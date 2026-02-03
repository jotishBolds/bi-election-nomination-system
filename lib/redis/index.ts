// Redis client for sessions, OTP, and rate limiting
import "server-only";
import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
  redisConnected: boolean;
  redisErrorLogged: boolean;
};

// In-memory fallback storage when Redis is unavailable
const memoryStore = new Map<string, { value: string; expiry: number }>();

function createRedisClient() {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 1) {
        // Only log once
        if (!globalForRedis.redisErrorLogged) {
          console.info(
            "[Redis] Not available, using in-memory fallback for development",
          );
          globalForRedis.redisErrorLogged = true;
        }
        return null; // Stop retrying immediately
      }
      return 100; // Quick first retry
    },
    reconnectOnError() {
      return false; // Don't reconnect on errors
    },
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  // Suppress all error logging - we use in-memory fallback
  client.on("error", () => {
    globalForRedis.redisConnected = false;
  });

  client.on("connect", () => {
    console.info("[Redis] Connected successfully");
    globalForRedis.redisConnected = true;
    globalForRedis.redisErrorLogged = false;
  });

  // Try to connect, but don't fail if unavailable
  client.connect().catch(() => {
    globalForRedis.redisConnected = false;
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

// Helper to check if Redis is connected
function isRedisConnected(): boolean {
  return globalForRedis.redisConnected && redis.status === "ready";
}

// Memory store helpers
function memoryGet(key: string): string | null {
  const item = memoryStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    memoryStore.delete(key);
    return null;
  }
  return item.value;
}

function memorySet(key: string, value: string, ttlSeconds: number): void {
  memoryStore.set(key, {
    value,
    expiry: Date.now() + ttlSeconds * 1000,
  });
}

function memoryDel(key: string): void {
  memoryStore.delete(key);
}

function memoryIncr(key: string): number {
  const current = memoryGet(key);
  const newVal = (current ? parseInt(current) : 0) + 1;
  const item = memoryStore.get(key);
  const ttl = item
    ? Math.max(1, Math.floor((item.expiry - Date.now()) / 1000))
    : 900;
  memorySet(key, String(newVal), ttl);
  return newVal;
}

// Redis key prefixes
export const REDIS_KEYS = {
  SESSION: "session:",
  OTP: "otp:",
  RATE_LIMIT: "rate_limit:",
  TOTP_TEMP: "totp_temp:",
  LOGIN_ATTEMPTS: "login_attempts:",
  ELECTION_CONFIG: "election_config:",
  USER_SESSION: "user_session:",
} as const;

// Session management
export async function setSession(
  sessionId: string,
  userId: string,
  ttlSeconds: number,
): Promise<void> {
  await redis.setex(
    `${REDIS_KEYS.SESSION}${sessionId}`,
    ttlSeconds,
    JSON.stringify({
      userId,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    }),
  );
}

export async function getSession(sessionId: string): Promise<{
  userId: string;
  createdAt: number;
  lastActivityAt: number;
} | null> {
  const data = await redis.get(`${REDIS_KEYS.SESSION}${sessionId}`);
  return data ? JSON.parse(data) : null;
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  const session = await getSession(sessionId);
  if (session) {
    const ttl = await redis.ttl(`${REDIS_KEYS.SESSION}${sessionId}`);
    if (ttl > 0) {
      session.lastActivityAt = Date.now();
      await redis.setex(
        `${REDIS_KEYS.SESSION}${sessionId}`,
        ttl,
        JSON.stringify(session),
      );
    }
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  await redis.del(`${REDIS_KEYS.SESSION}${sessionId}`);
}

// OTP management
export async function storeOTP(
  identifier: string,
  otp: string,
  type: string,
  ttlSeconds: number = 300,
): Promise<void> {
  const key = `${REDIS_KEYS.OTP}${type}:${identifier}`;
  const value = JSON.stringify({
    otp,
    attempts: 0,
    createdAt: Date.now(),
  });

  if (isRedisConnected()) {
    await redis.setex(key, ttlSeconds, value);
  } else {
    memorySet(key, value, ttlSeconds);
  }
}

export async function verifyOTP(
  identifier: string,
  otp: string,
  type: string,
): Promise<{ valid: boolean; expired: boolean; maxAttemptsReached: boolean }> {
  const key = `${REDIS_KEYS.OTP}${type}:${identifier}`;

  let data: string | null;
  if (isRedisConnected()) {
    data = await redis.get(key);
  } else {
    data = memoryGet(key);
  }

  if (!data) {
    return { valid: false, expired: true, maxAttemptsReached: false };
  }

  const otpData = JSON.parse(data);
  const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS || "3");

  if (otpData.attempts >= maxAttempts) {
    if (isRedisConnected()) {
      await redis.del(key);
    } else {
      memoryDel(key);
    }
    return { valid: false, expired: false, maxAttemptsReached: true };
  }

  if (otpData.otp === otp) {
    if (isRedisConnected()) {
      await redis.del(key);
    } else {
      memoryDel(key);
    }
    return { valid: true, expired: false, maxAttemptsReached: false };
  }

  // Increment attempts
  otpData.attempts += 1;
  if (isRedisConnected()) {
    const ttl = await redis.ttl(key);
    if (ttl > 0) {
      await redis.setex(key, ttl, JSON.stringify(otpData));
    }
  } else {
    const item = memoryStore.get(key);
    if (item) {
      const ttl = Math.max(1, Math.floor((item.expiry - Date.now()) / 1000));
      memorySet(key, JSON.stringify(otpData), ttl);
    }
  }

  return { valid: false, expired: false, maxAttemptsReached: false };
}

// Rate limiting
export async function checkRateLimit(
  identifier: string,
  windowMs: number = 60000,
  maxRequests: number = 100,
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = `${REDIS_KEYS.RATE_LIMIT}${identifier}`;
  const windowSeconds = Math.ceil(windowMs / 1000);

  let count: number;
  let ttl: number;

  if (isRedisConnected()) {
    const multi = redis.multi();
    multi.incr(key);
    multi.ttl(key);

    const results = await multi.exec();
    count = results?.[0]?.[1] as number;
    ttl = results?.[1]?.[1] as number;

    if (ttl === -1) {
      await redis.expire(key, windowSeconds);
    }
  } else {
    count = memoryIncr(key);
    const item = memoryStore.get(key);
    ttl = item ? Math.floor((item.expiry - Date.now()) / 1000) : windowSeconds;
    if (!item) {
      memorySet(key, String(count), windowSeconds);
    }
  }

  const remaining = Math.max(0, maxRequests - count);
  const resetTime = ttl > 0 ? ttl : windowSeconds;

  return {
    allowed: count <= maxRequests,
    remaining,
    resetTime,
  };
}

// Login attempts tracking
export async function trackLoginAttempt(identifier: string): Promise<number> {
  const key = `${REDIS_KEYS.LOGIN_ATTEMPTS}${identifier}`;

  if (isRedisConnected()) {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 900); // 15 minutes
    }
    return count;
  } else {
    return memoryIncr(key);
  }
}

export async function getLoginAttempts(identifier: string): Promise<number> {
  const key = `${REDIS_KEYS.LOGIN_ATTEMPTS}${identifier}`;

  if (isRedisConnected()) {
    const count = await redis.get(key);
    return count ? parseInt(count) : 0;
  } else {
    const count = memoryGet(key);
    return count ? parseInt(count) : 0;
  }
}

export async function clearLoginAttempts(identifier: string): Promise<void> {
  const key = `${REDIS_KEYS.LOGIN_ATTEMPTS}${identifier}`;
  if (isRedisConnected()) {
    await redis.del(key);
  } else {
    memoryDel(key);
  }
}

export default redis;

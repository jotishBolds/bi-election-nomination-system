// In-memory store to replace Redis
// Handles OTP, rate limiting, login attempts, and election config caching
// Uses globalThis to survive Turbopack HMR module re-evaluations
import "server-only";

const globalKey = Symbol.for("__memory_store__");

function getStore(): Map<string, { value: string; expiry: number }> {
  if (!(globalThis as any)[globalKey]) {
    (globalThis as any)[globalKey] = new Map<
      string,
      { value: string; expiry: number }
    >();
  }
  return (globalThis as any)[globalKey];
}

const store = getStore();

// Cleanup expired entries periodically
function cleanup() {
  const now = Date.now();
  for (const [key, item] of store.entries()) {
    if (now > item.expiry) {
      store.delete(key);
    }
  }
}

// Run cleanup every 60 seconds
if (typeof setInterval !== "undefined") {
  setInterval(cleanup, 60_000);
}

function get(key: string): string | null {
  const item = store.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    store.delete(key);
    return null;
  }
  return item.value;
}

function set(key: string, value: string, ttlSeconds: number): void {
  store.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 });
}

function del(key: string): void {
  store.delete(key);
}

function incr(key: string, defaultTTL: number = 900): number {
  const current = get(key);
  const newVal = (current ? parseInt(current) : 0) + 1;
  const item = store.get(key);
  const ttl = item
    ? Math.max(1, Math.floor((item.expiry - Date.now()) / 1000))
    : defaultTTL;
  set(key, String(newVal), ttl);
  return newVal;
}

// Key prefixes
const KEYS = {
  OTP: "otp:",
  RATE_LIMIT: "rate_limit:",
  LOGIN_ATTEMPTS: "login_attempts:",
  CACHE: "cache:",
} as const;

// OTP management
export async function storeOTP(
  identifier: string,
  otp: string,
  type: string,
  ttlSeconds: number = 300,
): Promise<void> {
  const key = `${KEYS.OTP}${type}:${identifier}`;
  set(
    key,
    JSON.stringify({ otp, attempts: 0, createdAt: Date.now() }),
    ttlSeconds,
  );
}

export async function verifyOTP(
  identifier: string,
  otp: string,
  type: string,
): Promise<{ valid: boolean; expired: boolean; maxAttemptsReached: boolean }> {
  const key = `${KEYS.OTP}${type}:${identifier}`;
  const data = get(key);

  if (!data) {
    return { valid: false, expired: true, maxAttemptsReached: false };
  }

  const otpData = JSON.parse(data);
  const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS || "3");

  if (otpData.attempts >= maxAttempts) {
    del(key);
    return { valid: false, expired: false, maxAttemptsReached: true };
  }

  if (otpData.otp === otp) {
    del(key);
    return { valid: true, expired: false, maxAttemptsReached: false };
  }

  // Increment attempts
  otpData.attempts += 1;
  const item = store.get(key);
  if (item) {
    const ttl = Math.max(1, Math.floor((item.expiry - Date.now()) / 1000));
    set(key, JSON.stringify(otpData), ttl);
  }

  return { valid: false, expired: false, maxAttemptsReached: false };
}

// Rate limiting
export async function checkRateLimit(
  identifier: string,
  windowMs: number = 60000,
  maxRequests: number = 100,
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = `${KEYS.RATE_LIMIT}${identifier}`;
  const windowSeconds = Math.ceil(windowMs / 1000);

  const count = incr(key, windowSeconds);
  const remaining = Math.max(0, maxRequests - count);

  return {
    allowed: count <= maxRequests,
    remaining,
    resetTime: windowSeconds,
  };
}

// Login attempts tracking
export async function trackLoginAttempt(identifier: string): Promise<number> {
  const key = `${KEYS.LOGIN_ATTEMPTS}${identifier}`;
  return incr(key, 900); // 15 minutes TTL
}

export async function getLoginAttempts(identifier: string): Promise<number> {
  const key = `${KEYS.LOGIN_ATTEMPTS}${identifier}`;
  const count = get(key);
  return count ? parseInt(count) : 0;
}

export async function clearLoginAttempts(identifier: string): Promise<void> {
  const key = `${KEYS.LOGIN_ATTEMPTS}${identifier}`;
  del(key);
}

// Generic cache
export async function cacheGet(key: string): Promise<string | null> {
  return get(`${KEYS.CACHE}${key}`);
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<void> {
  set(`${KEYS.CACHE}${key}`, value, ttlSeconds);
}

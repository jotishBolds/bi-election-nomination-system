import prisma from "./prisma";

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 5;

export async function checkRateLimit(key: string): Promise<{
  success: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const now = new Date();

  const existing = await prisma.rateLimit.findUnique({
    where: { key },
  });

  if (!existing || existing.expiresAt < now) {
    const expiresAt = new Date(now.getTime() + RATE_LIMIT_WINDOW);

    await prisma.rateLimit.upsert({
      where: { key },
      update: { count: 1, expiresAt },
      create: { key, count: 1, expiresAt },
    });

    return { success: true, remaining: MAX_REQUESTS - 1, resetAt: expiresAt };
  }

  if (existing.count >= MAX_REQUESTS) {
    return { success: false, remaining: 0, resetAt: existing.expiresAt };
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { count: existing.count + 1 },
  });

  return {
    success: true,
    remaining: MAX_REQUESTS - existing.count - 1,
    resetAt: existing.expiresAt,
  };
}

export async function cleanupExpiredRateLimits(): Promise<void> {
  await prisma.rateLimit.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}

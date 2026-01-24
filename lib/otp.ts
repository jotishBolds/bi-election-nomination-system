import prisma from "./prisma";

const OTP_EXPIRY_MINUTES = 5;

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createOtp(userId: string): Promise<string> {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otp.updateMany({
    where: { userId, used: false },
    data: { used: true },
  });

  await prisma.otp.create({
    data: {
      code,
      userId,
      expiresAt,
    },
  });

  console.log(`[OTP] Code for user ${userId}: ${code}`);

  return code;
}

export async function verifyOtp(
  userId: string,
  code: string,
): Promise<boolean> {
  const otp = await prisma.otp.findFirst({
    where: {
      userId,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otp) return false;

  await prisma.otp.update({
    where: { id: otp.id },
    data: { used: true },
  });

  return true;
}

export async function cleanupExpiredOtps(): Promise<void> {
  await prisma.otp.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { used: true }],
    },
  });
}

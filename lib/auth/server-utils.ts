// Authentication utilities - password hashing, JWT, OTP generation
import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { authenticator } from "otplib";
import crypto from "crypto";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-me",
);

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// JWT Token generation
export async function generateAccessToken(payload: {
  userId: string;
  role: string;
  email?: string;
}): Promise<string> {
  const expiresIn = process.env.JWT_EXPIRES_IN || "15m";

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setJti(crypto.randomUUID())
    .sign(JWT_SECRET);
}

export async function generateRefreshToken(userId: string): Promise<string> {
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

  return new SignJWT({ userId, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setJti(crypto.randomUUID())
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{
  payload: any;
  expired: boolean;
}> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { payload, expired: false };
  } catch (error: any) {
    if (error?.code === "ERR_JWT_EXPIRED") {
      return { payload: null, expired: true };
    }
    throw error;
  }
}

// OTP Generation
export function generateOTP(length: number = 6): string {
  const digits = "0123456789";
  let otp = "";
  const randomValues = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    otp += digits[randomValues[i] % 10];
  }

  return otp;
}

// Hash OTP for storage (don't store plain OTP)
export function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export function verifyOTPHash(otp: string, hash: string): boolean {
  return hashOTP(otp) === hash;
}

// TOTP (Time-based OTP) for MFA
export function generateTOTPSecret(): string {
  return authenticator.generateSecret();
}

export function generateTOTPUri(
  secret: string,
  accountName: string,
  issuer: string = "Election NMS",
): string {
  return authenticator.keyuri(accountName, issuer, secret);
}

export function verifyTOTP(token: string, secret: string): boolean {
  return authenticator.verify({ token, secret });
}

// Generate secure random token
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

// Encryption for sensitive data
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function encryptData(data: string): string {
  const key = Buffer.from(
    process.env.ENCRYPTION_KEY || "default-32-char-encryption-key!",
    "utf8",
  );
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decryptData(encryptedData: string): string {
  const key = Buffer.from(
    process.env.ENCRYPTION_KEY || "default-32-char-encryption-key!",
    "utf8",
  );

  const [ivHex, authTagHex, encrypted] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// IP Address extraction
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return "127.0.0.1";
}

// User agent extraction
export function getUserAgent(request: Request): string {
  return request.headers.get("user-agent") || "Unknown";
}

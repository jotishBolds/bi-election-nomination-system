// OTP Send API Route
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateOTP, hashOTP, getClientIP } from "@/lib/auth/server-utils";
import { storeOTP, checkRateLimit } from "@/lib/redis";
import { z } from "zod";
import { OTPType, OTPStatus } from "@prisma/client";

const sendOTPSchema = z.object({
  identifier: z.string().min(1), // Phone or email
  type: z.enum([
    "LOGIN",
    "REGISTRATION",
    "RECEIPT_CONFIRMATION",
    "WITHDRAWAL",
    "DATA_CORRECTION",
  ]),
  channel: z.enum(["sms", "email"]).default("sms"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, type, channel } = sendOTPSchema.parse(body);

    const clientIp = getClientIP(request);

    // For LOGIN type, check if user exists in database first
    if (type === "LOGIN") {
      const isEmail = identifier.includes("@");
      const user = await db.user.findFirst({
        where: isEmail
          ? { email: identifier.toLowerCase() }
          : { phone: identifier },
      });

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error:
              "No account found with this email/phone. Please register first.",
          },
          { status: 404 },
        );
      }

      if (!user.isActive) {
        return NextResponse.json(
          {
            success: false,
            error: "Your account is deactivated. Please contact support.",
          },
          { status: 403 },
        );
      }
    }

    // Rate limiting
    const rateLimitKey = `otp:${identifier}`;
    const windowMinutes = parseInt(
      process.env.OTP_RATE_LIMIT_WINDOW_MINUTES || "15",
    );
    const maxRequests = parseInt(
      process.env.OTP_RATE_LIMIT_MAX_REQUESTS || "5",
    );

    const rateLimit = await checkRateLimit(
      rateLimitKey,
      windowMinutes * 60 * 1000,
      maxRequests,
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many OTP requests. Try again in ${rateLimit.resetTime} seconds.`,
        },
        { status: 429 },
      );
    }

    // Generate OTP
    const otp = generateOTP(6);
    const otpHash = hashOTP(otp);
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || "5");
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Store in Redis/memory for quick verification
    await storeOTP(identifier, otpHash, type, expiryMinutes * 60);

    // Store in database for audit (if db is available)
    try {
      await db.oTPLog.create({
        data: {
          phone: channel === "sms" ? identifier : null,
          email: channel === "email" ? identifier : null,
          otpHash,
          type: type as OTPType,
          status: OTPStatus.PENDING,
          maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || "3"),
          expiresAt,
          ipAddress: clientIp,
        },
      });
    } catch (dbError) {
      // Log but don't fail - Redis/memory storage is primary
      console.warn("Failed to store OTP in database:", dbError);
    }

    // Console log OTP for development
    console.log("========================================");
    console.log(`📱 ${type} OTP for ${identifier}: ${otp}`);
    console.log(`   Channel: ${channel}`);
    console.log(`   Expires in: ${expiryMinutes} minutes`);
    console.log("========================================");

    return NextResponse.json({
      success: true,
      message: `OTP sent to your ${channel === "sms" ? "phone" : "email"}`,
      expiresIn: expiryMinutes * 60, // seconds
      remaining: rateLimit.remaining,
      // In development, also return OTP for testing
      ...(process.env.NODE_ENV === "development" && { devOtp: otp }),
    });
  } catch (error) {
    console.error("OTP Send Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to send OTP" },
      { status: 500 },
    );
  }
}

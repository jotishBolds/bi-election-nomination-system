// OTP Verify API Route
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClientIP } from "@/lib/auth/server-utils";
import { verifyOTP as verifyRedisOTP } from "@/lib/memory-store";
import { z } from "zod";
import { OTPStatus } from "@prisma/client";

const verifyOTPSchema = z.object({
  identifier: z.string().min(1), // Phone or email
  otp: z.string().length(6),
  type: z.enum([
    "LOGIN",
    "REGISTRATION",
    "RECEIPT_CONFIRMATION",
    "WITHDRAWAL",
    "DATA_CORRECTION",
  ]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, otp, type } = verifyOTPSchema.parse(body);

    const clientIp = getClientIP(request);

    // Verify OTP from memory store (comparing plain OTP)
    const result = await verifyRedisOTP(identifier, otp, type);

    console.log(
      `[OTP Verify] identifier=${identifier}, type=${type}, result=`,
      result,
    );

    if (result.expired) {
      return NextResponse.json(
        { success: false, error: "OTP has expired. Please request a new one." },
        { status: 400 },
      );
    }

    if (result.maxAttemptsReached) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Maximum verification attempts reached. Please request a new OTP.",
        },
        { status: 400 },
      );
    }

    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: "Invalid OTP. Please try again." },
        { status: 400 },
      );
    }

    // Update OTP log in database (if available)
    try {
      const otpLog = await db.oTPLog.findFirst({
        where: {
          OR: [{ phone: identifier }, { email: identifier }],
          type: type as any,
          status: OTPStatus.PENDING,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (otpLog) {
        await db.oTPLog.update({
          where: { id: otpLog.id },
          data: {
            status: OTPStatus.VERIFIED,
            verifiedAt: new Date(),
          },
        });
      }

      // Log audit
      await db.auditLog.create({
        data: {
          action: "OTP_VERIFIED",
          entityType: "OTPLog",
          entityId: otpLog?.id,
          ipAddress: clientIp,
          metadata: { identifier, type },
        },
      });
    } catch (dbError) {
      // Log but don't fail - OTP was verified successfully
      console.warn("Failed to update OTP log in database:", dbError);
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      verified: true,
    });
  } catch (error) {
    console.error("OTP Verify Error:", error);

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
      { success: false, error: "Failed to verify OTP" },
      { status: 500 },
    );
  }
}

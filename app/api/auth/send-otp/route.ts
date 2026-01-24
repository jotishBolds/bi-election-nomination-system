import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createOtp } from "@/lib/otp";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod/v4";

const sendOtpSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  type: z.enum(["email", "phone"]),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimitKey = `send-otp:${ip}`;

    const rateLimit = await checkRateLimit(rateLimitKey);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many OTP requests. Please try again later.",
          resetAt: rateLimit.resetAt,
          remaining: rateLimit.remaining,
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const validation = sendOtpSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { identifier, type } = validation.data;

    const user = await prisma.user.findFirst({
      where: type === "email" ? { email: identifier } : { phone: identifier },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userRateLimitKey = `send-otp:user:${user.id}`;
    const userRateLimit = await checkRateLimit(userRateLimitKey);

    if (!userRateLimit.success) {
      return NextResponse.json(
        {
          error:
            "Too many OTP requests for this account. Please try again later.",
          resetAt: userRateLimit.resetAt,
        },
        { status: 429 },
      );
    }

    const otp = await createOtp(user.id);

    console.log(`[OTP SENT] To ${type}: ${identifier}, Code: ${otp}`);

    return NextResponse.json(
      {
        message: "OTP sent successfully",
        phone: user.phone.slice(-4).padStart(user.phone.length, "*"),
        remaining: rateLimit.remaining,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

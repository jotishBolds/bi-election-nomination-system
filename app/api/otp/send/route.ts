// OTP Send API Route
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateOTP, hashOTP, getClientIP } from "@/lib/auth/server-utils";
import { storeOTP, checkRateLimit } from "@/lib/memory-store";
import { sendOTPSms, isThunderSMSConfigured } from "@/lib/sms/thundersms";
import { z } from "zod";
import { OTPType, OTPStatus, Role } from "@prisma/client";

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

    // Track if this is an RO/Admin needing TOTP setup (phone login, first time)
    let needsTOTPSetup = false;

    // For LOGIN type, check if user exists in database first
    if (type === "LOGIN") {
      const isEmail = identifier.includes("@");
      const user = await db.user.findFirst({
        where: isEmail
          ? { email: identifier.toLowerCase() }
          : { phone: identifier },
        include: {
          roles: { where: { isActive: true } },
          totpSecret: true,
        },
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

      // Check if user is RO or SUPER_ADMIN — they use TOTP instead of SMS OTP
      const userRoles = user.roles.map((r) => r.role);
      const isPrivilegedUser =
        userRoles.includes(Role.RO) || userRoles.includes(Role.SUPER_ADMIN);

      if (isPrivilegedUser) {
        const totpEnabled = user.totpSecret?.isEnabled ?? false;

        if (totpEnabled) {
          // TOTP is enabled — skip SMS OTP entirely, client shows TOTP input
          return NextResponse.json({
            success: true,
            requiresTOTP: true,
            totpEnabled: true,
            message: "Enter the code from your authenticator app",
          });
        } else {
          // TOTP not set up yet
          if (channel === "sms") {
            // Phone login: Send one-time SMS OTP for identity verification before TOTP setup
            // Fall through to normal OTP sending below, but flag that TOTP setup is needed
            needsTOTPSetup = true;
          } else {
            // Email login: Password already verifies identity, skip SMS OTP
            // Client will show TOTP setup flow directly
            return NextResponse.json({
              success: true,
              requiresTOTP: true,
              totpEnabled: false,
              message:
                "Two-factor authentication setup required. You will be guided through the setup.",
            });
          }
        }
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

    // Store PLAIN OTP in memory for quick verification (not hash!)
    await storeOTP(identifier, otp, type, expiryMinutes * 60);

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
      console.warn("Failed to store OTP in database:", dbError);
    }

    // Always log OTP to console
    console.log("========================================");
    console.log(`📱 ${type} OTP for ${identifier}: ${otp}`);
    console.log(`   Channel: ${channel}`);
    console.log(`   Expires in: ${expiryMinutes} minutes`);
    console.log("========================================");

    // Send OTP via ThunderSMS if channel is sms and ThunderSMS is configured
    let smsSent = false;
    if (channel === "sms" && isThunderSMSConfigured()) {
      try {
        const smsResult = await sendOTPSms(identifier, otp, expiryMinutes);
        smsSent = smsResult.success;
        if (!smsResult.success) {
          console.warn(
            `📱 ThunderSMS failed for ${identifier}: ${smsResult.desc}`,
          );
        } else {
          console.log(`📱 ThunderSMS sent successfully to ${identifier}`);
        }
      } catch (smsError) {
        console.warn("ThunderSMS error:", smsError);
      }
    }

    return NextResponse.json({
      success: true,
      message: needsTOTPSetup
        ? "OTP sent for identity verification. You will need to set up two-factor authentication."
        : `OTP sent to your ${channel === "sms" ? "phone" : "email"}`,
      expiresIn: expiryMinutes * 60, // seconds
      remaining: rateLimit.remaining,
      smsSent,
      // Flag for RO/Admin TOTP setup requirement
      ...(needsTOTPSetup && { requiresTOTP: true, totpEnabled: false }),
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

// Registration API Route
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, generateOTP, hashOTP } from "@/lib/auth/server-utils";
import { storeOTP } from "@/lib/redis";
import { z } from "zod";
import { Role } from "@prisma/client";

const registerSchema = z.object({
  epicNo: z.string().min(1, "EPIC number is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const verifyOtpSchema = z.object({
  phone: z.string(),
  otp: z.string().length(6),
  registrationData: z.object({
    epicNo: z.string(),
    name: z.string(),
    phone: z.string(),
    email: z.string(),
    password: z.string(),
  }),
});

// POST - Initiate registration (send OTP)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "send-otp") {
      // Validate registration data
      const validationResult = registerSchema.safeParse(body.data);
      if (!validationResult.success) {
        return NextResponse.json(
          { success: false, error: validationResult.error.issues[0].message },
          { status: 400 },
        );
      }

      const { epicNo, phone, email } = validationResult.data;

      // Check if user already exists
      const existingUser = await db.user.findFirst({
        where: {
          OR: [{ phone }, { email: email.toLowerCase() }],
        },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error:
              existingUser.phone === phone
                ? "Phone number already registered"
                : "Email already registered",
          },
          { status: 400 },
        );
      }

      // Check if EPIC exists in applicant profiles (optional validation)
      // For now, we'll skip this check

      // Generate OTP
      const otp = generateOTP(6);

      // Store OTP with phone as identifier
      await storeOTP(phone, hashOTP(otp), "REGISTRATION", 300); // 5 minutes

      // Console log OTP for development
      console.log("========================================");
      console.log(`📱 REGISTRATION OTP for ${phone}: ${otp}`);
      console.log("========================================");

      return NextResponse.json({
        success: true,
        message: "OTP sent successfully",
        // In development, also return OTP for testing
        ...(process.env.NODE_ENV === "development" && { devOtp: otp }),
      });
    }

    if (action === "verify-otp") {
      const validationResult = verifyOtpSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { success: false, error: "Invalid request data" },
          { status: 400 },
        );
      }

      const { phone, otp, registrationData } = validationResult.data;

      // Verify OTP from Redis/memory
      const { verifyOTP } = await import("@/lib/redis");
      const otpResult = await verifyOTP(phone, hashOTP(otp), "REGISTRATION");

      if (otpResult.expired) {
        return NextResponse.json(
          {
            success: false,
            error: "OTP has expired. Please request a new one.",
          },
          { status: 400 },
        );
      }

      if (otpResult.maxAttemptsReached) {
        return NextResponse.json(
          {
            success: false,
            error: "Maximum OTP attempts reached. Please request a new one.",
          },
          { status: 400 },
        );
      }

      if (!otpResult.valid) {
        return NextResponse.json(
          { success: false, error: "Invalid OTP. Please try again." },
          { status: 400 },
        );
      }

      // OTP verified, create user
      const hashedPassword = await hashPassword(registrationData.password);

      // Create user in database (ApplicantProfile will be created after EPIC verification)
      const user = await db.user.create({
        data: {
          phone: registrationData.phone,
          email: registrationData.email.toLowerCase(),
          name: registrationData.name,
          passwordHash: hashedPassword,
          isActive: true,
          isPhoneVerified: true,
          // Assign CANDIDATE role
          roles: {
            create: {
              role: Role.CANDIDATE,
              isActive: true,
            },
          },
        },
        include: {
          roles: true,
        },
      });

      // Log audit
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_CREATED",
          entityType: "User",
          entityId: user.id,
          metadata: { epicNo: registrationData.epicNo },
          ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
          userAgent: request.headers.get("user-agent") || "Unknown",
        },
      });

      console.log(`✅ User registered successfully: ${user.email}`);

      return NextResponse.json({
        success: true,
        message: "Registration successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}

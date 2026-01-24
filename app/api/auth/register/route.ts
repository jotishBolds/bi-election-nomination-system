import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod/v4";

const registerSchema = z.object({
  epicNumber: z.string().min(10, "Epic number must be at least 10 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimitKey = `register:${ip}`;

    const rateLimit = await checkRateLimit(rateLimitKey);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          resetAt: rateLimit.resetAt,
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { epicNumber, email, password, phone } = validation.data;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }, { epicNumber }],
      },
    });

    if (existingUser) {
      let field = "User";
      if (existingUser.email === email) field = "Email";
      else if (existingUser.phone === phone) field = "Phone";
      else if (existingUser.epicNumber === epicNumber) field = "Epic number";

      return NextResponse.json(
        { error: `${field} already registered` },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        epicNumber,
        email,
        password: hashedPassword,
        phone,
      },
      select: {
        id: true,
        epicNumber: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Registration successful",
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

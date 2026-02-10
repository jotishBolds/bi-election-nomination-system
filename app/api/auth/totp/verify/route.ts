import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/auth/auth-guard";
import { Role } from "@prisma/client";
import speakeasy from "speakeasy";

/* POST - Verify TOTP token and enable it */
export async function POST(request: NextRequest) {
  try {
    const session = await requireRoles([Role.RO, Role.SUPER_ADMIN]);

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "TOTP token is required" },
        { status: 400 },
      );
    }

    const totpSecret = await db.tOTPSecret.findUnique({
      where: { userId: session.user.id },
    });

    if (!totpSecret) {
      return NextResponse.json(
        { error: "TOTP not set up. Please setup first." },
        { status: 400 },
      );
    }

    // Verify the token using speakeasy
    const isValid = speakeasy.totp.verify({
      secret: totpSecret.secret,
      encoding: "base32",
      token: token,
      window: 1, // Allow 1 step tolerance
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid TOTP token" },
        { status: 400 },
      );
    }

    // Enable TOTP
    await db.tOTPSecret.update({
      where: { userId: session.user.id },
      data: {
        isEnabled: true,
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "TOTP has been enabled successfully",
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err.message === "FORBIDDEN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("TOTP verify error:", err);
    return NextResponse.json(
      { error: "Failed to verify TOTP" },
      { status: 500 },
    );
  }
}

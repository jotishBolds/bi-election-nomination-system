import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import speakeasy from "speakeasy";

/**
 * Public TOTP verification route for login flow (no session required).
 * Used for:
 * 1. First-time setup: Verifies the authenticator code and enables TOTP
 * 2. Subsequent logins: Verifies TOTP code during login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, token, action } = body;

    if (!identifier || !token) {
      return NextResponse.json(
        { error: "Identifier and TOTP token are required" },
        { status: 400 },
      );
    }

    if (token.length !== 6 || !/^\d{6}$/.test(token)) {
      return NextResponse.json(
        { error: "TOTP token must be a 6-digit number" },
        { status: 400 },
      );
    }

    // Find user by phone or email
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only allow for RO and SUPER_ADMIN
    const userRoles = user.roles.map((r) => r.role);
    const isPrivileged =
      userRoles.includes(Role.RO) || userRoles.includes(Role.SUPER_ADMIN);

    if (!isPrivileged) {
      return NextResponse.json(
        { error: "TOTP verification is only for RO and Admin users" },
        { status: 403 },
      );
    }

    // Check that TOTP secret exists
    if (!user.totpSecret?.secret) {
      return NextResponse.json(
        { error: "TOTP not set up. Please complete setup first." },
        { status: 400 },
      );
    }

    // Verify the TOTP token using speakeasy
    const isValid = speakeasy.totp.verify({
      secret: user.totpSecret.secret,
      encoding: "base32",
      token: token,
      window: 1, // Allow 1 step tolerance (30 seconds before/after)
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid authenticator code. Please try again." },
        { status: 400 },
      );
    }

    // If this is the first-time verification (setup), enable TOTP
    if (action === "enable" || !user.totpSecret.isEnabled) {
      await db.tOTPSecret.update({
        where: { userId: user.id },
        data: {
          isEnabled: true,
          verifiedAt: new Date(),
        },
      });

      console.log(
        `🔐 TOTP enabled for ${user.email || user.phone} (first-time setup verification)`,
      );

      return NextResponse.json({
        success: true,
        enabled: true,
        message:
          "TOTP has been enabled successfully. You can now log in with your authenticator app.",
      });
    }

    // Regular TOTP login verification
    console.log(
      `🔐 TOTP verified for ${user.email || user.phone} during login`,
    );

    return NextResponse.json({
      success: true,
      verified: true,
      message: "Authenticator code verified successfully",
    });
  } catch (error) {
    console.error("TOTP login-verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify TOTP" },
      { status: 500 },
    );
  }
}

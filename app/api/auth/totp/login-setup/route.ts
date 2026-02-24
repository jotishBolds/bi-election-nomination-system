import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

/**
 * Public TOTP setup route for login flow (no session required).
 * Used when RO/Admin needs to set up TOTP during their first login.
 * Identity is verified beforehand via SMS OTP (phone) or password (email).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier } = body;

    if (!identifier) {
      return NextResponse.json(
        { error: "Identifier (phone/email) is required" },
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
        { error: "TOTP setup is only available for RO and Admin users" },
        { status: 403 },
      );
    }

    // If TOTP is already enabled, don't allow re-setup
    if (user.totpSecret?.isEnabled) {
      return NextResponse.json(
        { error: "TOTP is already enabled for this account" },
        { status: 400 },
      );
    }

    // Generate TOTP secret using speakeasy
    const displayName = user.email || user.phone || identifier;
    const secret = speakeasy.generateSecret({
      name: `ElectionNMS:${displayName}`,
      issuer: "Election NMS",
      length: 20,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || "");

    // Save or upsert the TOTP secret (not enabled yet until verified)
    await db.tOTPSecret.upsert({
      where: { userId: user.id },
      update: {
        secret: secret.base32,
        isEnabled: false,
        verifiedAt: null,
      },
      create: {
        userId: user.id,
        secret: secret.base32,
        isEnabled: false,
      },
    });

    console.log(
      `🔐 TOTP setup initiated for ${displayName} (${userRoles.join(", ")})`,
    );

    return NextResponse.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        otpauthUrl: secret.otpauth_url,
      },
      message: "Scan the QR code with your authenticator app",
    });
  } catch (error) {
    console.error("TOTP login-setup error:", error);
    return NextResponse.json(
      { error: "Failed to setup TOTP" },
      { status: 500 },
    );
  }
}

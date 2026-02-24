import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/auth/auth-guard";
import { Role } from "@prisma/client";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

/* POST - Setup TOTP for RO user */
export async function POST(request: NextRequest) {
  try {
    const session = await requireRoles([Role.RO, Role.SUPER_ADMIN]);

    // Check if user already has TOTP
    const existing = await db.tOTPSecret.findUnique({
      where: { userId: session.user.id },
    });

    if (existing?.isEnabled) {
      return NextResponse.json(
        { error: "TOTP is already enabled" },
        { status: 400 },
      );
    }

    // Generate TOTP secret using speakeasy
    const secret = speakeasy.generateSecret({
      name: `ElectionNMS:${session.user.email}`,
      issuer: "Election NMS",
      length: 20,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || "");

    // Save or upsert the TOTP secret
    await db.tOTPSecret.upsert({
      where: { userId: session.user.id },
      update: {
        secret: secret.base32,
        isEnabled: false,
        verifiedAt: null,
      },
      create: {
        userId: session.user.id,
        secret: secret.base32,
        isEnabled: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        otpauthUrl: secret.otpauth_url,
      },
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err.message === "FORBIDDEN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("TOTP setup error:", err);
    return NextResponse.json(
      { error: "Failed to setup TOTP" },
      { status: 500 },
    );
  }
}

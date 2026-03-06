import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireRoles } from "@/lib/auth/auth-guard";
import { declareUnopposedCandidateWithROOTP } from "@/lib/services/ro";
import { getClientIP } from "@/lib/auth/server-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRoles([Role.RO]);
    const { id: nominationId } = await params;

    // Validate nomination ID format (UUID)
    if (!nominationId || typeof nominationId !== 'string') {
      return NextResponse.json(
        { success: false, error: "Invalid nomination ID" },
        { status: 400 },
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(nominationId)) {
      return NextResponse.json(
        { success: false, error: "Invalid nomination ID format. UUID required." },
        { status: 400 },
      );
    }

    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: "Invalid request body. JSON required." },
        { status: 400 },
      );
    }

    const { otp } = body;

    if (!otp || typeof otp !== 'string') {
      return NextResponse.json(
        { success: false, error: "Authorization OTP is required and must be a string" },
        { status: 400 },
      );
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp.trim())) {
      return NextResponse.json(
        { success: false, error: "OTP must be exactly 6 digits" },
        { status: 400 },
      );
    }

    const ip = getClientIP(request);

    const result = await declareUnopposedCandidateWithROOTP(
      nominationId,
      otp.trim(),
      session.user.id,
      ip,
    );

    if (!result.success) {
      const status = result.error === "Invalid OTP" || result.error === "OTP expired" ? 400 : 403;
      return NextResponse.json(
        { success: false, error: result.error },
        { status },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.nomination,
      message: "Candidate declared elected unopposed successfully",
    });
  } catch (error: any) {
    console.error("API declare-unopposed error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: error.message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}

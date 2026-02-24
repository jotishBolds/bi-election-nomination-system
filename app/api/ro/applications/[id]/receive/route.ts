import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireRoles } from "@/lib/auth/auth-guard";
import { receiveNominationWithROOTP } from "@/lib/services/ro";
import { getClientIP } from "@/lib/auth/server-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRoles([Role.RO]);
    const { id: nominationId } = await params;
    const { otp } = await request.json();

    if (!otp) {
      return NextResponse.json(
        { success: false, error: "Authorization OTP is required" },
        { status: 400 },
      );
    }

    const ip = getClientIP(request);

    const result = await receiveNominationWithROOTP(
      nominationId,
      otp,
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
      message: "Nomination verified and marked as received successfully",
    });
  } catch (error: any) {
    console.error("API receive error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: error.message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}

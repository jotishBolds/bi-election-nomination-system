import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireRoles } from "@/lib/auth/auth-guard";
import { sendROReceiptOTP } from "@/lib/services/ro";
import { getClientIP } from "@/lib/auth/server-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRoles([Role.RO]);
    const { id: nominationId } = await params;
    const ip = getClientIP(request);

    const result = await sendROReceiptOTP(nominationId, session.user.id, ip);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Authorization OTP sent successfully to your registered device" 
    });
  } catch (error: any) {
    console.error("API send-otp error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: error.message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}

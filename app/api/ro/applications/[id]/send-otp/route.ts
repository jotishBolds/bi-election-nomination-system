import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireRoles } from "@/lib/auth/auth-guard";
import { sendROOTP } from "@/lib/services/ro";
import { getClientIP } from "@/lib/auth/server-utils";
import { OTPType } from "@prisma/client";
import { sendROOTPSchema } from "@/lib/auth/validations/ro";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRoles([Role.RO]);
    const { id: nominationId } = await params;

    const body = await request.json().catch(() => ({}));
    const validation = sendROOTPSchema.safeParse(body);

    if (!validation.success) {
      const issue = validation.error.issues[0];
      const field = issue.path.join(".");
      return NextResponse.json(
        { success: false, error: `${field}: ${issue.message}` },
        { status: 400 },
      );
    }

    const { action } = validation.data;
    const ip = getClientIP(request);

    const result = await sendROOTP(nominationId, session.user.id, ip, action as OTPType);

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

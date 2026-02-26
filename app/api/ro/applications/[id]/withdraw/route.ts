import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireRoles } from "@/lib/auth/auth-guard";
import { getClientIP } from "@/lib/auth/server-utils";
import { processWithdrawalWithROOTP } from "@/lib/services/ro";

import { roWithdrawalSchema } from "@/lib/auth/validations/ro";

// POST /api/ro/applications/[id]/withdraw - Process nomination withdrawal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRoles([Role.RO]);
    const { id: nominationId } = await params;

    const body = await request.json().catch(() => ({}));
    const validation = roWithdrawalSchema.safeParse(body);

    if (!validation.success) {
      const issue = validation.error.issues[0];
      const field = issue.path.join(".");
      return NextResponse.json(
        { success: false, error: `${field}: ${issue.message}` },
        { status: 400 },
      );
    }

    const { reason, otp } = validation.data;
    const ip = getClientIP(request);

    const result = await processWithdrawalWithROOTP({
      nominationId,
      roUserId: session.user.id,
      reason,
      ipAddress: ip,
      otp,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.nomination,
      message: "Nomination withdrawn successfully",
    });
  } catch (error: any) {
    console.error("Error processing withdrawal:", error);
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to process withdrawal" },
      { status: 500 },
    );
  }
}

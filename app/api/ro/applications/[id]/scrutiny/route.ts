import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { requireRoles } from "@/lib/auth/auth-guard";
import { getClientIP } from "@/lib/auth/server-utils";
import { scrutinizeNominationWithROOTP } from "@/lib/services/ro";
import { roScrutinySchema } from "@/lib/auth/validations/ro";

// POST /api/ro/applications/[id]/scrutiny - Submit scrutiny decision
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRoles([Role.RO, Role.SES, Role.SUPER_ADMIN]);
    const { id: nominationId } = await params;

    const body = await request.json().catch(() => ({}));
    const validation = roScrutinySchema.safeParse(body);

    if (!validation.success) {
      const issue = validation.error.issues[0];
      const field = issue.path.join(".");
      return NextResponse.json(
        { success: false, error: `${field}: ${issue.message}` },
        { status: 400 },
      );
    }

    const data = validation.data;
    const ip = getClientIP(request);

    // Handle START flow (No OTP needed)
    if (data._flow === "START") {
      const application = await db.nominationApplication.findUnique({
        where: { id: nominationId },
      });

      if (!application) {
        return NextResponse.json(
          { success: false, error: "Application not found" },
          { status: 404 },
        );
      }

      if (
        application.status === "SUBMITTED" ||
        application.status === "RECEIVED"
      ) {
        await db.nominationApplication.update({
          where: { id: nominationId },
          data: { status: "UNDER_SCRUTINY" },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Scrutiny started",
      });
    }

    // Now it's the DECISION flow
    const { decision, remarks, rejectionReasons, otp } = data;

    // Call the service with OTP verification if RO
    let result;
    if (session.user.role === Role.RO) {
      result = await scrutinizeNominationWithROOTP({
        nominationId,
        roUserId: session.user.id,
        decision,
        remarks,
        rejectionReasons,
        ipAddress: ip,
        otp,
      });
    } else {
      // Non-RO (Admin/SES) - Currently we restrict scrutiny to RO via this specific OTP flow
      // If we want to allow Admins to bypass OTP, we could call scrutinizeNomination directly.
      return NextResponse.json(
        { success: false, error: "Currently only RO can perform scrutiny via this flow" },
        { status: 403 },
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.nomination,
      message: `Application ${decision.toLowerCase()} successfully`,
    });
  } catch (error: any) {
    console.error("Error processing scrutiny:", error);
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to process scrutiny" },
      { status: 500 },
    );
  }
}

// GET /api/ro/applications/[id]/scrutiny - Get scrutiny details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRoles([Role.RO, Role.SES, Role.SUPER_ADMIN]);
    const { id } = await params;

    const application = await db.nominationApplication.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        scrutinyRemarks: true,
        scrutinyDate: true,
        scrutinizedBy: true,
        rejectionReasons: true,
        scrutinizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: application,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    console.error("Error processing scrutiny request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 },
    );
  }
}

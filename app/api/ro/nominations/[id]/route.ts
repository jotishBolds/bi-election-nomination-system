// RO API - Single Nomination Actions (Receive, Scrutiny)
import { NextRequest, NextResponse } from "next/server";
import {
  receiveNomination,
  scrutinizeNomination,
  processWithdrawal,
} from "@/lib/services/ro";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { requireRoles } from "@/lib/auth/auth-guard";
import { hasAccessToWard } from "@/lib/services/ro-jurisdiction";
import {
  checkPortalTimeWindow,
  getElectionStatus,
} from "@/lib/services/election-time";

// GET - Get single nomination details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRoles([Role.RO]);

    const { id } = await params;

    const nomination = await db.nominationApplication.findUnique({
      where: { id },
      include: {
        applicantProfile: {
          include: {
            voterRecord: true,
            user: {
              select: {
                id: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        ward: true,
        ulb: {
          include: {
            district: {
              include: {
                state: true,
              },
            },
          },
        },
        politicalParty: true,
        symbolPreferences: {
          include: { symbol: true },
          orderBy: { preferenceOrder: "asc" },
        },
        proposers: {
          orderBy: { createdAt: "asc" },
        },
        documents: true,
        brPayments: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!nomination) {
      return NextResponse.json(
        { success: false, error: "Nomination not found" },
        { status: 404 },
      );
    }

    // Verify RO has jurisdiction over this nomination
    const hasJurisdiction = await hasAccessToWard(session.user.id, nomination.wardId);
    if (!hasJurisdiction) {
      return NextResponse.json(
        { success: false, error: "Access denied - not in your jurisdiction" },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true, nomination });
  } catch (error) {
    console.error("RO nomination GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Perform action on nomination
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRoles([Role.RO]);

    // Check portal time window
    const timeCheck = await checkPortalTimeWindow();
    if (!timeCheck.isOpen) {
      return NextResponse.json(
        { success: false, error: timeCheck.message },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action, ...actionData } = body;

    // Get election status to check phase
    const electionStatus = await getElectionStatus();

    switch (action) {
      case "receive": {
        // Receiving nominations allowed during NOMINATION phase
        if (electionStatus?.currentPhase !== "NOMINATION") {
          return NextResponse.json(
            {
              success: false,
              error: "Nominations can only be received during nomination phase",
            },
            { status: 400 },
          );
        }

        const { otpVerified } = actionData;
        const result = await receiveNomination({
          nominationId: id,
          roUserId: session.user.id,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          otpVerified: otpVerified || false,
        });
        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 400 },
          );
        }
        return NextResponse.json({
          success: true,
          nomination: result.nomination,
        });
      }

      case "scrutinize": {
        // Scrutiny allowed during SCRUTINY phase
        if (electionStatus?.currentPhase !== "SCRUTINY") {
          return NextResponse.json(
            {
              success: false,
              error: "Scrutiny can only be performed during scrutiny phase",
            },
            { status: 400 },
          );
        }

        const { decision, rejectionReason, remarks } = actionData;
        if (!decision || !["ACCEPTED", "REJECTED"].includes(decision)) {
          return NextResponse.json(
            { success: false, error: "Invalid scrutiny decision" },
            { status: 400 },
          );
        }

        const result = await scrutinizeNomination({
          nominationId: id,
          roUserId: session.user.id,
          decision,
          rejectionReasons: rejectionReason,
          remarks,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        });

        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 400 },
          );
        }
        return NextResponse.json({
          success: true,
          nomination: result.nomination,
        });
      }

      case "process-withdrawal": {
        // Withdrawals allowed during WITHDRAWAL phase
        if (electionStatus?.currentPhase !== "WITHDRAWAL") {
          return NextResponse.json(
            {
              success: false,
              error:
                "Withdrawals can only be processed during withdrawal phase",
            },
            { status: 400 },
          );
        }

        const { reason, candidateOtpVerified } = actionData;
        const result = await processWithdrawal({
          nominationId: id,
          roUserId: session.user.id,
          candidateOtpVerified: candidateOtpVerified || false,
          reason: reason || "",
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        });

        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 400 },
          );
        }
        return NextResponse.json({
          success: true,
          nomination: result.nomination,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    console.error("RO nomination action error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";
import { NominationStatus } from "@prisma/client";

// POST /api/ro/applications/[id]/action - Update application status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["SUPER_ADMIN", "SES", "RO"].includes(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // Validate action
    // RECEIVE: Mark as received by RO
    // SCRUTINY: Send to scrutiny process
    // ACCEPT: Accept after scrutiny (valid nomination)
    // CONTESTING: Add to final contestant list
    // REJECT: Reject the nomination
    const validActions = ["RECEIVE", "SCRUTINY", "ACCEPT", "CONTESTING", "REJECT"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }

    // Get the application
    const application = await db.nominationApplication.findUnique({
      where: { id },
      include: {
        ward: {
          include: {
            ulb: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    // Verify RO has jurisdiction over this application
    if (session.user.role === "RO") {
      const userJurisdictions = await db.userJurisdiction.findMany({
        where: { userId: session.user.id },
      });

      const hasJurisdiction = userJurisdictions.some((j) => {
        if (j.ulbId) {
          return j.ulbId === application.ward?.ulbId;
        } else if (j.districtId) {
          return j.districtId === application.ward?.ulb?.districtId;
        }
        return false;
      });

      if (!hasJurisdiction) {
        return NextResponse.json(
          { success: false, error: "Access denied - not in your jurisdiction" },
          { status: 403 }
        );
      }
    }

    // Map action to status (using valid NominationStatus enum values)
    let newStatus: NominationStatus;
    switch (action) {
      case "RECEIVE":
        newStatus = NominationStatus.RECEIVED;
        break;
      case "SCRUTINY":
        newStatus = NominationStatus.UNDER_SCRUTINY;
        break;
      case "ACCEPT":
        newStatus = NominationStatus.ACCEPTED;
        break;
      case "CONTESTING":
        newStatus = NominationStatus.CONTESTING;
        break;
      case "REJECT":
        newStatus = NominationStatus.REJECTED;
        break;
      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }

    // Validate status transitions
    const validTransitions: Record<string, NominationStatus[]> = {
      SUBMITTED: [NominationStatus.RECEIVED, NominationStatus.REJECTED],
      RECEIVED: [NominationStatus.UNDER_SCRUTINY, NominationStatus.REJECTED],
      UNDER_SCRUTINY: [NominationStatus.ACCEPTED, NominationStatus.REJECTED],
      ACCEPTED: [NominationStatus.CONTESTING, NominationStatus.REJECTED],
    };

    const currentStatus = application.status;
    if (
      !validTransitions[currentStatus] ||
      !validTransitions[currentStatus].includes(newStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
        },
        { status: 400 }
      );
    }

    // Update the application status
    const updatedApplication = await db.nominationApplication.update({
      where: { id },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
      include: {
        applicantProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        ward: {
          include: {
            ulb: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedApplication,
      message: `Application ${action.toLowerCase()}ed successfully`,
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update application status" },
      { status: 500 }
    );
  }
}

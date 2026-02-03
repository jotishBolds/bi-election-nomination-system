import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// POST /api/ro/applications/[id]/withdraw - Process withdrawal request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["SUPER_ADMIN", "SES", "RO"].includes(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action, remarks } = body;

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be APPROVE or REJECT" },
        { status: 400 },
      );
    }

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
        { status: 404 },
      );
    }

    // Verify RO has jurisdiction
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
          { status: 403 },
        );
      }
    }

    // Check if application can be withdrawn (must be ACCEPTED or CONTESTING)
    if (!["ACCEPTED", "CONTESTING"].includes(application.status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Application cannot be withdrawn in current state",
        },
        { status: 400 },
      );
    }

    // Update application to withdrawn
    const updatedApplication = await db.nominationApplication.update({
      where: { id },
      data: {
        status: "WITHDRAWN",
        withdrawnAt: new Date(),
        withdrawalReason: remarks,
        withdrawalApprovedBy: session.user.id,
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
            ulb: {
              include: {
                district: true,
              },
            },
          },
        },
        politicalParty: true,
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        action: "NOMINATION_WITHDRAWN",
        entityType: "NominationApplication",
        entityId: id,
        userId: session.user.id,
        newValues: {
          remarks,
          previousStatus: application.status,
          newStatus: "WITHDRAWN",
        },
        ipAddress: "api",
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedApplication,
      message: `Withdrawal ${action.toLowerCase()}d successfully`,
    });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process withdrawal" },
      { status: 500 },
    );
  }
}

// GET /api/ro/applications/[id]/withdraw - Get withdrawal requests list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["SUPER_ADMIN", "SES", "RO"].includes(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const application = await db.nominationApplication.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        withdrawnAt: true,
        withdrawalReason: true,
        withdrawalApprovedBy: true,
        withdrawalOtpVerified: true,
        withdrawalApprover: {
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
  } catch (error) {
    console.error("Error fetching withdrawal details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch withdrawal details" },
      { status: 500 },
    );
  }
}

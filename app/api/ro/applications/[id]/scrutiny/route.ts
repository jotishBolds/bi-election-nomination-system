import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// POST /api/ro/applications/[id]/scrutiny - Submit scrutiny decision
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
    const { decision, checklist, remarks, rejectionReasons, action } = body;

    // Handle START action - mark as under scrutiny
    if (action === "START") {
      const application = await db.nominationApplication.findUnique({
        where: { id },
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
          where: { id },
          data: { status: "UNDER_SCRUTINY" },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Scrutiny started",
      });
    }

    if (!decision || !["ACCEPTED", "REJECTED"].includes(decision)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid decision. Must be ACCEPTED or REJECTED",
        },
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

    // Check if application is in a state that can be scrutinized
    if (
      !["SUBMITTED", "RECEIVED", "UNDER_SCRUTINY"].includes(application.status)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Application cannot be scrutinized in current state",
        },
        { status: 400 },
      );
    }

    // Determine new status based on decision
    const newStatus = decision === "ACCEPTED" ? "ACCEPTED" : "REJECTED";

    // Update application with scrutiny result
    const updatedApplication = await db.nominationApplication.update({
      where: { id },
      data: {
        status: newStatus,
        scrutinyRemarks: remarks,
        scrutinyDate: new Date(),
        scrutinizedBy: session.user.id,
        rejectionReasons:
          decision === "REJECTED" ? rejectionReasons : undefined,
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
        allocatedSymbol: true,
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        action:
          decision === "ACCEPTED"
            ? "NOMINATION_ACCEPTED"
            : "NOMINATION_REJECTED",
        entityType: "NominationApplication",
        entityId: id,
        userId: session.user.id,
        newValues: {
          decision,
          remarks,
          rejectionReasons:
            decision === "REJECTED" ? rejectionReasons : undefined,
        },
        ipAddress: "api",
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedApplication,
      message: `Application ${decision.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error("Error processing scrutiny:", error);
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
  } catch (error) {
    console.error("Error fetching scrutiny details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch scrutiny details" },
      { status: 500 },
    );
  }
}

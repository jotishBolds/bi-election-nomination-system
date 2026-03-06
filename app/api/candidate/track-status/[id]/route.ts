import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// Status step mapping for progress tracking
// NominationStatus: DRAFT, SUBMITTED, RECEIVED, UNDER_SCRUTINY, ACCEPTED, REJECTED, WITHDRAWN, CONTESTING, ELECTED_UNOPPOSED
const STATUS_STEPS = [
  { key: "DRAFT", label: "Draft Created", order: 1 },
  { key: "SUBMITTED", label: "Form Submitted", order: 2 },
  { key: "RECEIVED", label: "Received by RO", order: 3 },
  { key: "UNDER_SCRUTINY", label: "Under Scrutiny", order: 4 },
  { key: "ACCEPTED", label: "Accepted", order: 5 },
  { key: "REJECTED", label: "Rejected", order: 5 }, // Same level as accepted
  { key: "WITHDRAWN", label: "Withdrawn", order: 6 },
  { key: "CONTESTING", label: "Contesting", order: 7 },
  { key: "ELECTED_UNOPPOSED", label: "Elected Unopposed", order: 8 },
];

function getStatusOrder(status: string): number {
  const step = STATUS_STEPS.find((s) => s.key === status);
  return step?.order || 0;
}

function getStepStatus(
  currentStatus: string,
  stepKey: string,
): "completed" | "current" | "pending" | "error" {
  const currentOrder = getStatusOrder(currentStatus);
  const stepOrder = getStatusOrder(stepKey);

  // Handle rejection as error state
  if (currentStatus === "REJECTED" && stepKey === "REJECTED") {
    return "error";
  }

  // Handle withdrawal flow
  if (currentStatus === "WITHDRAWN" && stepKey === "WITHDRAWN") {
    return "completed";
  }

  if (stepOrder < currentOrder) {
    return "completed";
  }

  if (stepOrder === currentOrder) {
    return "current";
  }

  return "pending";
}

// GET /api/candidate/track-status/[id] - Get detailed tracking info for a nomination
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const nomination = await db.nominationApplication.findUnique({
      where: { id },
      include: {
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
        scrutinizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!nomination) {
      return NextResponse.json(
        { success: false, error: "Nomination not found" },
        { status: 404 },
      );
    }

    // Verify ownership
    if (nomination.createdBy !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // Build progress steps based on current status
    const isWithdrawalFlow = nomination.status === "WITHDRAWN";
    const isRejected = nomination.status === "REJECTED";

    let progressSteps = [
      {
        key: "DRAFT",
        label: "Draft Created",
        status: getStepStatus(nomination.status, "DRAFT"),
        timestamp: nomination.createdAt,
        description: "Nomination form created",
      },
      {
        key: "SUBMITTED",
        label: "Form Submitted",
        status: getStepStatus(nomination.status, "SUBMITTED"),
        timestamp: nomination.submittedAt,
        description: "Nomination form submitted for processing",
      },
      {
        key: "RECEIVED",
        label: "Received by RO",
        status: getStepStatus(nomination.status, "RECEIVED"),
        timestamp: nomination.receivedAt,
        description: "Nomination received by Returning Officer",
      },
      {
        key: "UNDER_SCRUTINY",
        label: "Under Scrutiny",
        status: getStepStatus(nomination.status, "UNDER_SCRUTINY"),
        timestamp: nomination.scrutinyDate,
        description: "Application is being reviewed by Returning Officer",
      },
    ];

    if (isRejected) {
      progressSteps.push({
        key: "REJECTED",
        label: "Rejected",
        status: "error",
        timestamp: nomination.scrutinyDate,
        description: "Application was rejected",
      });
    } else {
      progressSteps.push({
        key: "ACCEPTED",
        label: "Accepted",
        status: getStepStatus(nomination.status, "ACCEPTED"),
        timestamp:
          nomination.status === "ACCEPTED" ? nomination.scrutinyDate : null,
        description: "Application accepted - You are now a valid contestant",
      });
    }

    // Add withdrawal step if applicable
    if (isWithdrawalFlow) {
      progressSteps.push({
        key: "WITHDRAWN",
        label: "Withdrawn",
        status: "completed",
        timestamp: nomination.withdrawnAt,
        description:
          nomination.withdrawalReason || "Nomination has been withdrawn",
      });
    }

    // Get audit log for this nomination
    const auditLogs = await db.auditLog.findMany({
      where: {
        entityType: "NominationApplication",
        entityId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            roles: {
              where: { isActive: true },
              select: { role: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        nomination: {
          id: nomination.id,
          applicationNo: nomination.applicationNo,
          status: nomination.status,
          ward: nomination.ward,
          politicalParty: nomination.politicalParty,
          allocatedSymbol: nomination.allocatedSymbol,
        },
        progress: {
          currentStatus: nomination.status,
          steps: progressSteps,
          completedSteps: progressSteps.filter((s) => s.status === "completed")
            .length,
          totalSteps: progressSteps.length,
        },
        timeline: auditLogs.map((log) => ({
          id: log.id,
          action: log.action,
          timestamp: log.createdAt,
          performedBy: log.user?.name || "System",
          details: log.newValues,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching track status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tracking status" },
      { status: 500 },
    );
  }
}

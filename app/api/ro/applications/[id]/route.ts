import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { requireRoles } from "@/lib/auth/auth-guard";
import { hasAccessToWard } from "@/lib/services/ro-jurisdiction";

// GET /api/ro/applications/[id] - Get application details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRoles([Role.RO, Role.SES, Role.SUPER_ADMIN]);

    const { id } = await params;

    const application = await db.nominationApplication.findUnique({
      where: { id },
      include: {
        applicantProfile: {
          include: {
            voterRecord: true,
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        ward: {
          include: {
            ulb: {
              include: {
                district: {
                  include: {
                    state: true,
                  },
                },
              },
            },
          },
        },
        politicalParty: true,
        allocatedSymbol: true,
        documents: true,
        proposers: true,
        symbolPreferences: {
          include: {
            symbol: true,
          },
        },
        documents: true,
        payments: true,
        statusHistory: {
          orderBy: {
            createdAt: "desc",
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

    // Verify RO has jurisdiction over this application
    if (session.user.role === Role.RO) {
      const hasJurisdiction = await hasAccessToWard(session.user.id, application.wardId);

      if (!hasJurisdiction) {
        return NextResponse.json(
          { success: false, error: "Access denied - not in your jurisdiction" },
          { status: 403 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: application,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN" || error.message.startsWith("UNAUTHORIZED_")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch application" },
      { status: 500 },
    );
  }
}

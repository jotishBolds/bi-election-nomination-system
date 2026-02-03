import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// GET /api/ro/applications/[id] - Get application details
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
      include: {
        applicantProfile: {
          include: {
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
                district: true,
              },
            },
          },
        },
        politicalParty: true,
        allocatedSymbol: true,
        proposers: true,
        symbolPreferences: {
          include: {
            symbol: true,
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

    return NextResponse.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch application" },
      { status: 500 },
    );
  }
}

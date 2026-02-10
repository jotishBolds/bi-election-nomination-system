import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// Helper to get RO's jurisdiction filter
async function getROJurisdictionFilter(userId: string) {
  const userJurisdictions = await db.userJurisdiction.findMany({
    where: { userId },
  });

  if (userJurisdictions.length === 0) {
    return null;
  }

  const ulbIds: string[] = [];
  const districtIds: string[] = [];

  userJurisdictions.forEach((j) => {
    if (j.ulbId) {
      ulbIds.push(j.ulbId);
    } else if (j.districtId) {
      districtIds.push(j.districtId);
    }
  });

  const wardFilter: Record<string, unknown> = {};
  if (ulbIds.length > 0 && districtIds.length > 0) {
    wardFilter.OR = [
      { ulbId: { in: ulbIds } },
      { ulb: { districtId: { in: districtIds } } },
    ];
  } else if (ulbIds.length > 0) {
    wardFilter.ulbId = { in: ulbIds };
  } else if (districtIds.length > 0) {
    wardFilter.ulb = { districtId: { in: districtIds } };
  }

  return wardFilter;
}

// GET /api/ro/applications - Get nominations in RO's jurisdiction
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const wardId = searchParams.get("wardId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};

    // Filter by RO's jurisdiction if user is RO
    if (session.user.role === "RO") {
      const wardFilter = await getROJurisdictionFilter(session.user.id);
      if (!wardFilter) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
      where.ward = wardFilter;
    }

    // Filter by status (supports comma-separated values)
    if (status && status !== "all") {
      if (status.includes(",")) {
        where.status = { in: status.split(",") };
      } else {
        where.status = status;
      }
    } else {
      // By default exclude DRAFT nominations - RO should only see submitted+
      where.status = { not: "DRAFT" };
    }

    // Filter by ward
    if (wardId && wardId !== "all") {
      where.wardId = wardId;
    }

    // Search by candidate name or application number
    if (search) {
      where.OR = [
        { candidateName: { contains: search, mode: "insensitive" } },
        { applicationNo: { contains: search, mode: "insensitive" } },
      ];
    }

    const [applications, total] = await Promise.all([
      db.nominationApplication.findMany({
        where,
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
        },
        orderBy: { submittedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.nominationApplication.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch applications" },
      { status: 500 },
    );
  }
}

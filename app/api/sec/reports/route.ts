import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// GET /api/sec/reports - Get SEC reports and statistics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "SES"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "overview";
    const districtId = searchParams.get("districtId");

    // Base filter for nominations
    const nominationFilter: Record<string, unknown> = {};
    if (districtId && districtId !== "all") {
      nominationFilter.ward = {
        ulb: {
          districtId,
        },
      };
    }

    if (reportType === "overview") {
      // Get overall statistics
      const [
        totalNominations,
        statusCounts,
        districtCounts,
        partyCounts,
        reservationCounts,
      ] = await Promise.all([
        db.nominationApplication.count({ where: nominationFilter }),
        db.nominationApplication.groupBy({
          by: ["status"],
          where: nominationFilter,
          _count: { id: true },
        }),
        getDistrictCounts(nominationFilter),
        getPartyCounts(nominationFilter),
        getReservationCounts(nominationFilter),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          totalNominations,
          statusDistribution: statusCounts.map((s) => ({
            status: s.status,
            count: s._count.id,
          })),
          districtDistribution: districtCounts,
          partyDistribution: partyCounts,
          reservationDistribution: reservationCounts,
        },
      });
    }

    if (reportType === "daily") {
      // Get daily submission counts for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailySubmissions = await db.nominationApplication.groupBy({
        by: ["submittedAt"],
        where: {
          ...nominationFilter,
          submittedAt: {
            gte: thirtyDaysAgo,
          },
        },
        _count: { id: true },
        orderBy: { submittedAt: "asc" },
      });

      return NextResponse.json({
        success: true,
        data: {
          dailySubmissions: dailySubmissions.map((d) => ({
            date: d.submittedAt,
            count: d._count.id,
          })),
        },
      });
    }

    if (reportType === "detailed") {
      // Get detailed report with all data
      const [districts, ulbs, wards, nominations] = await Promise.all([
        db.district.findMany({
          include: {
            _count: {
              select: { ulbs: true },
            },
          },
        }),
        db.uLB.findMany({
          include: {
            district: true,
            _count: {
              select: { wards: true },
            },
          },
        }),
        db.ward.count(),
        db.nominationApplication.findMany({
          where: nominationFilter,
          include: {
            applicantProfile: {
              include: {
                user: {
                  select: { name: true, phone: true },
                },
              },
            },
            ward: {
              include: {
                ulb: {
                  include: { district: true },
                },
              },
            },
            politicalParty: true,
          },
          orderBy: { submittedAt: "desc" },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalDistricts: districts.length,
            totalULBs: ulbs.length,
            totalWards: wards,
            totalNominations: nominations.length,
          },
          districts,
          ulbs,
          nominations,
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: "Invalid report type",
    });
  } catch (error) {
    console.error("Error generating reports:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate reports" },
      { status: 500 },
    );
  }
}

// Helper function to get district-wise counts
async function getDistrictCounts(baseFilter: Record<string, unknown>) {
  const nominations = await db.nominationApplication.findMany({
    where: baseFilter,
    include: {
      ward: {
        include: {
          ulb: {
            include: { district: true },
          },
        },
      },
    },
  });

  const districtMap = new Map<string, { name: string; count: number }>();
  nominations.forEach((n) => {
    const districtName = n.ward?.ulb?.district?.name || "Unknown";
    const existing = districtMap.get(districtName);
    if (existing) {
      existing.count++;
    } else {
      districtMap.set(districtName, { name: districtName, count: 1 });
    }
  });

  return Array.from(districtMap.values());
}

// Helper function to get party-wise counts
async function getPartyCounts(baseFilter: Record<string, unknown>) {
  const nominations = await db.nominationApplication.findMany({
    where: baseFilter,
    include: {
      politicalParty: true,
    },
  });

  const partyMap = new Map<string, { name: string; count: number }>();
  nominations.forEach((n) => {
    const partyName = n.politicalParty?.name || "Independent";
    const existing = partyMap.get(partyName);
    if (existing) {
      existing.count++;
    } else {
      partyMap.set(partyName, { name: partyName, count: 1 });
    }
  });

  return Array.from(partyMap.values()).sort((a, b) => b.count - a.count);
}

// Helper function to get reservation-wise counts
async function getReservationCounts(baseFilter: Record<string, unknown>) {
  const nominations = await db.nominationApplication.findMany({
    where: baseFilter,
    include: {
      ward: true,
    },
  });

  const reservationMap = new Map<string, { category: string; count: number }>();
  nominations.forEach((n) => {
    const category = n.ward?.reservationType || "GENERAL";
    const existing = reservationMap.get(category);
    if (existing) {
      existing.count++;
    } else {
      reservationMap.set(category, { category, count: 1 });
    }
  });

  return Array.from(reservationMap.values());
}

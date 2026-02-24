import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { requireRoles } from "@/lib/auth/auth-guard";
import { buildJurisdictionFilter } from "@/lib/services/ro-jurisdiction";

// GET /api/ro/reports - Get RO jurisdiction reports
export async function GET(request: NextRequest) {
  try {
    const session = await requireRoles([Role.RO, Role.SES, Role.SUPER_ADMIN]);

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "overview";

    // Build filter for RO's jurisdiction
    const nominationFilter: Record<string, unknown> = {};

    if (session.user.role === "RO") {
      const wardFilter = await buildJurisdictionFilter(session.user.id);
      if (!wardFilter) {
        return NextResponse.json({
          success: true,
          data: {
            totalNominations: 0,
            statusDistribution: [],
            wardDistribution: [],
            partyDistribution: [],
          },
        });
      }
      nominationFilter.ward = wardFilter;
    }

    if (reportType === "overview") {
      // Get overall statistics for RO's jurisdiction
      const nominations = await db.nominationApplication.findMany({
        where: nominationFilter,
        include: {
          ward: {
            include: {
              ulb: true,
            },
          },
          politicalParty: true,
        },
      });

      // Status distribution
      const statusCounts: Record<string, number> = {};
      nominations.forEach((n) => {
        statusCounts[n.status] = (statusCounts[n.status] || 0) + 1;
      });

      // Ward distribution
      const wardCounts: Record<
        string,
        { wardNo: number | null; name: string; count: number }
      > = {};
      nominations.forEach((n) => {
        const wardKey = n.wardId || "unknown";
        if (!wardCounts[wardKey]) {
          wardCounts[wardKey] = {
            wardNo: n.ward?.wardNo || null,
            name: n.ward?.wardName || "Unknown",
            count: 0,
          };
        }
        wardCounts[wardKey].count++;
      });

      // Party distribution
      const partyCounts: Record<string, number> = {};
      nominations.forEach((n) => {
        const partyName = n.politicalParty?.name || "Independent";
        partyCounts[partyName] = (partyCounts[partyName] || 0) + 1;
      });

      // Reservation distribution
      const reservationCounts: Record<string, number> = {};
      nominations.forEach((n) => {
        const reservation = n.ward?.reservationType || "GENERAL";
        reservationCounts[reservation] =
          (reservationCounts[reservation] || 0) + 1;
      });

      return NextResponse.json({
        success: true,
        data: {
          totalNominations: nominations.length,
          statusDistribution: Object.entries(statusCounts).map(
            ([status, count]) => ({
              status,
              count,
            }),
          ),
          wardDistribution: Object.values(wardCounts).sort(
            (a, b) => (a.wardNo || 0) - (b.wardNo || 0),
          ),
          partyDistribution: Object.entries(partyCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count),
          reservationDistribution: Object.entries(reservationCounts).map(
            ([category, count]) => ({
              category,
              count,
            }),
          ),
          pendingScrutiny: nominations.filter((n) =>
            ["SUBMITTED", "RECEIVED", "UNDER_SCRUTINY"].includes(n.status),
          ).length,
          accepted: nominations.filter((n) => n.status === "ACCEPTED").length,
          rejected: nominations.filter((n) => n.status === "REJECTED").length,
          contesting: nominations.filter((n) =>
            ["CONTESTING", "ELECTED_UNOPPOSED"].includes(n.status),
          ).length,
          withdrawn: nominations.filter((n) => n.status === "WITHDRAWN").length,
        },
      });
    }

    if (reportType === "daily") {
      // Get daily submission counts for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const nominations = await db.nominationApplication.findMany({
        where: {
          ...nominationFilter,
          submittedAt: {
            gte: thirtyDaysAgo,
          },
        },
        select: {
          submittedAt: true,
        },
        orderBy: { submittedAt: "asc" },
      });

      // Group by date
      const dailyCounts: Record<string, number> = {};
      nominations.forEach((n) => {
        if (n.submittedAt) {
          const dateKey = n.submittedAt.toISOString().split("T")[0];
          dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          dailySubmissions: Object.entries(dailyCounts).map(
            ([date, count]) => ({
              date,
              count,
            }),
          ),
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: "Invalid report type",
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    console.error("Error generating RO reports:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate reports" },
      { status: 500 },
    );
  }
}

// SEC Dashboard API
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { db } from "@/lib/db";
import type { SECDashboardData, ElectionScheduleItem } from "@/types/dashboard";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get user with roles
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        roles: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Verify SEC role
    const isSEC = user.roles.some(
      (r) => r.role === "SES" || r.role === "SUPER_ADMIN",
    );
    if (!isSEC) {
      return NextResponse.json(
        { success: false, error: "Forbidden - SEC access required" },
        { status: 403 },
      );
    }

    // Get election config
    const electionConfig = await db.electionConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    // Get all districts
    const districts = await db.district.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    // Get all ULBs
    const ulbs = await db.uLB.findMany({
      where: { isActive: true },
      include: {
        district: true,
        wards: {
          where: { isActive: true },
        },
      },
    });

    // Get total ward count
    const totalWards = await db.ward.count({
      where: { isActive: true },
    });

    // Get unique candidate count
    const uniqueCandidates = await db.nominationApplication.groupBy({
      by: ["applicantProfileId"],
    });

    // Get nomination statistics
    const [nominationStats, nominations] = await Promise.all([
      db.nominationApplication.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      db.nominationApplication.findMany({
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
          applicantProfile: true,
        },
        orderBy: { submittedAt: "desc" },
      }),
    ]);

    // Calculate stats by status
    const byStatus: Record<string, number> = {};
    let totalNominations = 0;
    for (const n of nominationStats) {
      byStatus[n.status] = n._count.status;
      totalNominations += n._count.status;
    }

    // Calculate district-wise stats
    const districtWiseStats = districts.map((district) => {
      const districtNominations = nominations.filter(
        (n) => n.ward?.ulb?.districtId === district.id,
      );
      return {
        districtId: district.id,
        districtName: district.name,
        totalNominations: districtNominations.length,
        approved: districtNominations.filter((n) => n.status === "ACCEPTED")
          .length,
        rejected: districtNominations.filter((n) => n.status === "REJECTED")
          .length,
        pending: districtNominations.filter((n) =>
          [
            "SUBMITTED",
            "PENDING_RECEIPT",
            "RECEIPT_GENERATED",
            "PENDING_SCRUTINY",
          ].includes(n.status),
        ).length,
      };
    });

    // Calculate ULB-wise stats
    const ulbWiseStats = ulbs.map((ulb) => {
      const ulbNominations = nominations.filter(
        (n) => n.ward?.ulbId === ulb.id,
      );
      return {
        ulbId: ulb.id,
        ulbName: ulb.name,
        districtName: ulb.district.name,
        totalNominations: ulbNominations.length,
      };
    });

    // Calculate category-wise stats
    const categoryWiseStats: Record<string, number> = {};
    for (const nom of nominations) {
      const category = nom.category || "GENERAL";
      categoryWiseStats[category] = (categoryWiseStats[category] || 0) + 1;
    }

    // Build election schedule (no fallback - config required)
    const electionSchedule: ElectionScheduleItem[] = electionConfig
      ? buildElectionSchedule(electionConfig)
      : []; // No static fallback

    // Calculate days remaining (only if config exists)
    const nominationEndDate = electionConfig?.nominationEndDate;
    const today = new Date();
    const daysRemaining = nominationEndDate
      ? Math.max(
          0,
          Math.ceil(
            (nominationEndDate.getTime() - today.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : null;

    const dashboardData: SECDashboardData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email || undefined,
        phone: user.phone || undefined,
        role: "SES",
      },
      stats: {
        totalNominations,
        uniqueCandidates: uniqueCandidates.length,
        totalWards,
        totalULBs: ulbs.length,
        totalDistricts: districts.length,
        byStatus,
      },
      districtWiseStats,
      ulbWiseStats,
      categoryWiseStats,
      electionSchedule,
      daysRemaining,
      currentPhase: electionConfig?.currentPhase || "NOMINATION",
    };

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error("SEC dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard" },
      { status: 500 },
    );
  }
}

function buildElectionSchedule(config: any): ElectionScheduleItem[] {
  const today = new Date();

  const getStatus = (date: Date): "completed" | "current" | "upcoming" => {
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    if (dateOnly < todayOnly) return "completed";
    if (dateOnly.getTime() === todayOnly.getTime()) return "current";
    return "upcoming";
  };

  const formatDate = (date: Date): string => {
    return date
      .toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, ".");
  };

  const schedule: ElectionScheduleItem[] = [
    {
      slNo: "i",
      event: "Issue of Notification",
      date: formatDate(config.notificationDate),
      dateObj: config.notificationDate,
      status: getStatus(config.notificationDate),
    },
    {
      slNo: "ii",
      event: "Last date for making nomination",
      date: formatDate(config.nominationEndDate),
      dateObj: config.nominationEndDate,
      status: getStatus(config.nominationEndDate),
      highlight: true,
    },
    {
      slNo: "iii",
      event: "Date for scrutiny of Nomination",
      date: formatDate(config.scrutinyDate),
      dateObj: config.scrutinyDate,
      status: getStatus(config.scrutinyDate),
    },
    {
      slNo: "iv",
      event: "Last date for withdrawal",
      date: formatDate(config.withdrawalEndDate),
      dateObj: config.withdrawalEndDate,
      status: getStatus(config.withdrawalEndDate),
    },
    {
      slNo: "v",
      event: "Date of Poll (if necessary)",
      date: formatDate(config.pollingDate),
      dateObj: config.pollingDate,
      status: getStatus(config.pollingDate),
    },
    {
      slNo: "vi",
      event: "Election completion date",
      date: formatDate(config.resultDate),
      dateObj: config.resultDate,
      status: getStatus(config.resultDate),
    },
  ];

  return schedule;
}

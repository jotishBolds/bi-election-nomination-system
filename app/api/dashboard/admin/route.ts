// Admin Dashboard API
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { db } from "@/lib/db";
import type {
  AdminDashboardData,
  ElectionScheduleItem,
} from "@/types/dashboard";

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

    // Verify admin role
    const isAdmin = user.roles.some((r) => r.role === "SUPER_ADMIN");
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    // Get user stats
    const [totalUsers, usersByRole, activeToday] = await Promise.all([
      db.user.count(),
      db.userRole.groupBy({
        by: ["role"],
        where: { isActive: true },
        _count: { role: true },
      }),
      db.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    const roleStats: Record<string, number> = {};
    for (const r of usersByRole) {
      roleStats[r.role] = r._count.role;
    }

    // Get nomination stats
    const nominationStats = await db.nominationApplication.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const nominationByStatus: Record<string, number> = {};
    let totalNominations = 0;
    for (const n of nominationStats) {
      nominationByStatus[n.status] = n._count.status;
      totalNominations += n._count.status;
    }

    // Get recent users
    const recentUsers = await db.user.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        roles: true,
        jurisdictions: {
          include: {
            district: true,
          },
        },
      },
    });

    // Get recent audit logs
    const recentAuditLogs = await db.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
      },
    });

    // Get election config
    const electionConfig = await db.electionConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    // Check system health
    const systemHealth = await checkSystemHealth();

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

    const dashboardData: AdminDashboardData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email || undefined,
        phone: user.phone || undefined,
        role: "SUPER_ADMIN",
      },
      userStats: {
        total: totalUsers,
        byRole: roleStats,
        activeToday,
      },
      systemHealth,
      nominationStats: {
        total: totalNominations,
        byStatus: nominationByStatus,
      },
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email || undefined,
        role: u.roles[0]?.role || "CANDIDATE",
        district: u.jurisdictions[0]?.district?.name,
        status: u.isActive ? "active" : "inactive",
        lastLoginAt: u.lastLoginAt?.toISOString(),
      })),
      recentAuditLogs: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        userName: log.user?.name,
        createdAt: log.createdAt.toISOString(),
      })),
      electionConfig: electionConfig
        ? {
            name: electionConfig.name,
            year: electionConfig.year,
            currentPhase: electionConfig.currentPhase,
            nominationStartDate:
              electionConfig.nominationStartDate.toISOString(),
            nominationEndDate: electionConfig.nominationEndDate.toISOString(),
            scrutinyDate: electionConfig.scrutinyDate.toISOString(),
            withdrawalEndDate: electionConfig.withdrawalEndDate.toISOString(),
            isLocked: electionConfig.isLocked,
          }
        : undefined,
      electionSchedule,
      daysRemaining,
    };

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard" },
      { status: 500 },
    );
  }
}

async function checkSystemHealth() {
  const health = {
    database: {
      status: "healthy" as "healthy" | "degraded" | "down",
      latency: 0,
    },
    storage: {
      status: "healthy" as "healthy" | "degraded" | "down",
      usedPercent: 0,
    },
  };

  // Check database
  try {
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    health.database.latency = Date.now() - dbStart;
    health.database.status =
      health.database.latency < 100 ? "healthy" : "degraded";
  } catch (error) {
    health.database.status = "down";
    health.database.latency = -1;
  }

  // Storage check placeholder (would need actual implementation based on storage provider)
  health.storage.usedPercent = 45; // Placeholder
  health.storage.status =
    health.storage.usedPercent < 80 ? "healthy" : "degraded";

  return health;
}

function buildElectionSchedule(config: any): ElectionScheduleItem[] {
  const formatDate = (date: Date) =>
    date
      .toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, ".");

  const getStatus = (date: Date): "completed" | "current" | "upcoming" => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    if (target < today) return "completed";
    if (target.getTime() === today.getTime()) return "current";
    return "upcoming";
  };

  return [
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
      date: config.pollDate ? formatDate(config.pollDate) : "TBD",
      dateObj: config.pollDate || new Date(),
      status: config.pollDate ? getStatus(config.pollDate) : "upcoming",
    },
    {
      slNo: "vi",
      event: "Election completion date",
      date: config.resultDate ? formatDate(config.resultDate) : "TBD",
      dateObj: config.resultDate || new Date(),
      status: config.resultDate ? getStatus(config.resultDate) : "upcoming",
    },
  ];
}

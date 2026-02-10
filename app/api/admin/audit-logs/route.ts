import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// GET /api/admin/audit-logs - Get audit logs
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const format = searchParams.get("format");
    const page = parseInt(searchParams.get("page") || "1");
    const limit =
      format === "csv" ? 10000 : parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};

    // Filter by action
    if (action && action !== "all") {
      where.action = action;
    }

    // Filter by entity type
    if (entityType && entityType !== "all") {
      where.entityType = entityType;
    }

    // Filter by user
    if (userId && userId !== "all") {
      where.userId = userId;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, unknown>).lte = end;
      }
    }

    // Search in entity ID or user name
    if (search) {
      where.OR = [
        { entityId: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              roles: {
                where: { isActive: true },
                select: { role: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ]);

    // Get unique values for filters
    const [actions, entityTypes, users] = await Promise.all([
      db.auditLog.findMany({
        distinct: ["action"],
        select: { action: true },
      }),
      db.auditLog.findMany({
        distinct: ["entityType"],
        select: { entityType: true },
      }),
      db.user.findMany({
        where: {
          roles: {
            some: {
              role: { in: ["SUPER_ADMIN", "SES", "RO"] },
              isActive: true,
            },
          },
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    // CSV export
    if (format === "csv") {
      const csvRows = [
        [
          "Timestamp",
          "User",
          "Action",
          "Entity Type",
          "Entity ID",
          "IP Address",
        ].join(","),
        ...logs.map((log) =>
          [
            new Date(log.createdAt).toISOString(),
            log.user?.name || "System",
            log.action,
            log.entityType,
            log.entityId || "",
            log.ipAddress || "",
          ].join(","),
        ),
      ];
      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename=audit-logs-${new Date().toISOString().split("T")[0]}.csv`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        actions: actions.map((a) => a.action),
        entityTypes: entityTypes.map((e) => e.entityType),
        users,
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch audit logs" },
      { status: 500 },
    );
  }
}

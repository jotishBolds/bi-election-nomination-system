import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";
import { buildJurisdictionFilter } from "@/lib/services/ro-jurisdiction";

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
    const ulbId = searchParams.get("ulbId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};

    // Scope to RO's jurisdiction
    if (session.user.role === "RO") {
      const wardFilter = await buildJurisdictionFilter(session.user.id);
      if (!wardFilter) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
      where.ward = wardFilter;
    }

    // Filter by status
    if (status && status !== "all") {
      where.status = status;
    }

    // Filter by specific ward (narrows within jurisdiction)
    if (wardId && wardId !== "all") {
      where.wardId = wardId;
      delete (where as any).ward;
    }

    // Filter by ULB (narrows within jurisdiction)
    if (ulbId && ulbId !== "all") {
      where.ulbId = ulbId;
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

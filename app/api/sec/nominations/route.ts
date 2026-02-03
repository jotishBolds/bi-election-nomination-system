import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// GET /api/sec/nominations - Get all nominations for SEC view
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
    const districtId = searchParams.get("districtId");
    const ulbId = searchParams.get("ulbId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};

    // Filter by district
    if (districtId && districtId !== "all") {
      where.ward = {
        ulb: {
          districtId,
        },
      };
    }

    // Filter by ULB
    if (ulbId && ulbId !== "all") {
      where.ward = {
        ulbId,
      };
    }

    // Filter by status
    if (status && status !== "all") {
      where.status = status;
    }

    // Search by candidate name or application number
    if (search) {
      where.OR = [
        { candidateName: { contains: search, mode: "insensitive" } },
        { applicationNo: { contains: search, mode: "insensitive" } },
      ];
    }

    const [nominations, total] = await Promise.all([
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
      data: nominations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching nominations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch nominations" },
      { status: 500 },
    );
  }
}

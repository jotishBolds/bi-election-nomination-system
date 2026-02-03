import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// GET /api/sec/ulbs - Get all ULBs with optional filters
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
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (districtId && districtId !== "all") {
      where.districtId = districtId;
    }
    if (type && type !== "all") {
      where.type = type;
    }

    const ulbs = await db.uLB.findMany({
      where,
      include: {
        district: {
          include: {
            state: true,
          },
        },
        _count: {
          select: {
            wards: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: ulbs,
    });
  } catch (error) {
    console.error("Error fetching ULBs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ULBs" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// GET /api/sec/wards - Get all wards with optional filters
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
    const reservation = searchParams.get("reservation");

    const where: Record<string, unknown> = {};

    if (ulbId && ulbId !== "all") {
      where.ulbId = ulbId;
    } else if (districtId && districtId !== "all") {
      where.ulb = { districtId };
    }

    if (reservation && reservation !== "all") {
      where.reservationStatus = reservation;
    }

    const wards = await db.ward.findMany({
      where,
      include: {
        ulb: {
          include: {
            district: true,
          },
        },
        _count: {
          select: {
            nominations: true,
          },
        },
      },
      orderBy: [{ ulb: { name: "asc" } }, { wardNo: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: wards,
    });
  } catch (error) {
    console.error("Error fetching wards:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wards" },
      { status: 500 },
    );
  }
}

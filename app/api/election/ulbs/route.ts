// API for fetching ULBs by district
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const districtId = searchParams.get("districtId");

    const whereClause: any = { isActive: true };

    if (districtId) {
      whereClause.districtId = districtId;
    }

    const ulbs = await db.uLB.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        districtId: true,
        district: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (ulbs.length === 0 && districtId) {
      return NextResponse.json(
        {
          success: false,
          error: "No ULBs found for the selected district.",
          data: [],
        },
        { status: 200 },
      );
    }

    if (ulbs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No ULBs configured. Please contact administrator.",
          configRequired: true,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: ulbs });
  } catch (error) {
    console.error("ULBs fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ULBs" },
      { status: 500 },
    );
  }
}

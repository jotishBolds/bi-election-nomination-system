// API for fetching districts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const districts = await db.district.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    if (districts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No districts configured. Please contact administrator.",
          configRequired: true,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: districts });
  } catch (error) {
    console.error("Districts fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch districts" },
      { status: 500 },
    );
  }
}

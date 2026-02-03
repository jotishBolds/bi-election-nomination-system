import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// GET /api/sec/districts - Get all districts
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
    const stateId = searchParams.get("stateId");

    const where: Record<string, unknown> = {};
    if (stateId) {
      where.stateId = stateId;
    }

    const districts = await db.district.findMany({
      where,
      include: {
        state: true,
        _count: {
          select: {
            ulbs: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: districts,
    });
  } catch (error) {
    console.error("Error fetching districts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch districts" },
      { status: 500 },
    );
  }
}

// API for fetching Wards by ULB
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ulbId = searchParams.get("ulbId");

    if (!ulbId) {
      return NextResponse.json(
        { success: false, error: "ULB ID is required" },
        { status: 400 },
      );
    }

    const wards = await db.ward.findMany({
      where: {
        ulbId: ulbId,
        isActive: true,
      },
      orderBy: { wardNo: "asc" },
      include: {
        ulb: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        constituency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (wards.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No wards found for the selected ULB.",
          data: [],
        },
        { status: 200 },
      );
    }

    // Format the response
    const formattedWards = wards.map((w) => ({
      id: w.id,
      wardNumber: w.wardNo,
      wardName: w.wardName,
      reservationStatus: w.reservationType || null,
      constituencyType: w.constituency?.name || null,
      ulbId: w.ulbId,
      ulb: w.ulb,
    }));

    return NextResponse.json({ success: true, data: formattedWards });
  } catch (error) {
    console.error("Wards fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wards" },
      { status: 500 },
    );
  }
}

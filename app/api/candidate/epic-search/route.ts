import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* GET - Search voter roll by EPIC number (public, for registration/nomination) */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const epicNumber = searchParams.get("epicNumber");

    if (!epicNumber || epicNumber.length < 3) {
      return NextResponse.json(
        { error: "EPIC number is required (min 3 chars)" },
        { status: 400 },
      );
    }

    const entries = await db.voterRollEntry.findMany({
      where: {
        epicNumber: { contains: epicNumber, mode: "insensitive" },
        isActive: true,
      },
      take: 10,
      orderBy: { epicNumber: "asc" },
    });

    return NextResponse.json({ success: true, data: entries });
  } catch (err: any) {
    console.error("EPIC search error:", err);
    return NextResponse.json(
      { error: "Failed to search voter roll" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* GET - List all active election symbols (for candidate nomination form) */
export async function GET(request: NextRequest) {
  try {
    const symbols = await db.electionSymbol.findMany({
      where: {
        isActive: true,
        isReserved: false, // Only show unreserved symbols for independent candidates
      },
      select: {
        id: true,
        name: true,
        imagePath: true,
        displayOrder: true,
      },
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({ success: true, data: symbols });
  } catch (err: any) {
    console.error("Election symbols list error:", err);
    return NextResponse.json(
      { error: "Failed to fetch symbols" },
      { status: 500 },
    );
  }
}

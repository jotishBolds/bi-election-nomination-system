// Election Config API Route
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Get active election config
    const electionConfig = await db.electionConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!electionConfig) {
      return NextResponse.json(
        { success: false, error: "No active election configuration found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      config: electionConfig,
    });
  } catch (error) {
    console.error("Election config fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch election config" },
      { status: 500 },
    );
  }
}

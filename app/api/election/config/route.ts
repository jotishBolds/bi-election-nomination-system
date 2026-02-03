// API for fetching election configuration and master data
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/election/config - Fetch active election configuration
export async function GET(request: NextRequest) {
  try {
    const electionConfig = await db.electionConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!electionConfig) {
      return NextResponse.json(
        {
          success: false,
          error: "No active election configured. Please contact administrator.",
          configRequired: true,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: electionConfig.id,
        name: electionConfig.name,
        year: electionConfig.year,
        currentPhase: electionConfig.currentPhase,
        notificationDate: electionConfig.notificationDate.toISOString(),
        nominationStartDate: electionConfig.nominationStartDate.toISOString(),
        nominationEndDate: electionConfig.nominationEndDate.toISOString(),
        scrutinyDate: electionConfig.scrutinyDate.toISOString(),
        withdrawalEndDate: electionConfig.withdrawalEndDate.toISOString(),
        pollDate: electionConfig.pollDate?.toISOString(),
        countingDate: electionConfig.countingDate?.toISOString(),
        resultDate: electionConfig.resultDate?.toISOString(),
        maxNominationsPerCandidate: electionConfig.maxNominationsPerCandidate,
        nominationFee: electionConfig.nominationFee,
        isLocked: electionConfig.isLocked,
      },
    });
  } catch (error) {
    console.error("Election config fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch election configuration" },
      { status: 500 },
    );
  }
}

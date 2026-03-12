// Admin API - Election Configuration
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import {
  createElectionConfig,
  getElectionConfigs,
  updateElectionConfig,
} from "@/lib/services/admin";

// GET - List election configurations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 },
      );
    }

    const configs = await getElectionConfigs();
    return NextResponse.json({ success: true, configs });
  } catch (error) {
    console.error("Admin election config GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create new election configuration
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      name,
      year,
      type,
      notificationDate,
      nominationStartDate,
      nominationEndDate,
      scrutinyDate,
      withdrawalStartDate,
      withdrawalEndDate,
      dailyStartTime,
      dailyEndTime,
      nominationFee,
      scStFeeDiscount,
      maxNominationsPerCandidate,
      maxProposersRequired,
    } = body;

    // Validate required fields
    if (
      !name ||
      !year ||
      !type ||
      !notificationDate ||
      !nominationStartDate ||
      !nominationEndDate ||
      !scrutinyDate ||
      !withdrawalStartDate ||
      !withdrawalEndDate ||
      nominationFee === undefined
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required configuration fields" },
        { status: 400 },
      );
    }

    // Validate dates
    const nomStart = new Date(nominationStartDate);
    const nomEnd = new Date(nominationEndDate);
    const scrutiny = new Date(scrutinyDate);
    const wdStart = new Date(withdrawalStartDate);
    const wdEnd = new Date(withdrawalEndDate);

    if (nomEnd <= nomStart) {
      return NextResponse.json(
        {
          success: false,
          error: "Nomination end date must be after start date",
        },
        { status: 400 },
      );
    }

    if (scrutiny <= nomEnd) {
      return NextResponse.json(
        {
          success: false,
          error: "Scrutiny date must be after nomination end date",
        },
        { status: 400 },
      );
    }

    if (wdStart <= scrutiny) {
      return NextResponse.json(
        {
          success: false,
          error: "Withdrawal start date must be after scrutiny date",
        },
        { status: 400 },
      );
    }

    const result = await createElectionConfig(
      {
        name,
        year,
        type,
        notificationDate: new Date(notificationDate),
        nominationStartDate: nomStart,
        nominationEndDate: nomEnd,
        scrutinyDate: scrutiny,
        withdrawalStartDate: wdStart,
        withdrawalEndDate: wdEnd,
        dailyStartTime: dailyStartTime || "09:00",
        dailyEndTime: dailyEndTime || "15:00",
        nominationFee,
        scStFeeDiscount: scStFeeDiscount || 0,
        maxNominationsPerCandidate: maxNominationsPerCandidate || 3,
        maxProposersRequired: maxProposersRequired || 1,
      },
      session.user.id,
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, config: result.config });
  } catch (error) {
    console.error("Admin election config POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Update election configuration
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { configId, ...updateData } = body;

    if (!configId) {
      return NextResponse.json(
        { success: false, error: "Configuration ID is required" },
        { status: 400 },
      );
    }

    // Convert date strings to Date objects if present
    const parsedData = { ...updateData };
    const dateFields = [
      "notificationDate",
      "nominationStartDate",
      "nominationEndDate",
      "scrutinyDate",
      "withdrawalStartDate",
      "withdrawalEndDate",
      "symbolAllotmentDate",
      "pollDate",
      "countingDate",
      "resultDate",
    ];

    for (const field of dateFields) {
      if (parsedData[field]) {
        parsedData[field] = new Date(parsedData[field]);
      } else if (parsedData[field] === null) {
        parsedData[field] = null;
      }
    }

    const result = await updateElectionConfig(
      configId,
      parsedData,
      session.user.id,
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, config: result.config });
  } catch (error) {
    console.error("Admin election config PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

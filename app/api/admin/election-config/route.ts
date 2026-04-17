// Admin API - Election Configuration
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import {
  // createElectionConfig,
  getElectionConfigs,
  updateElectionConfig,
} from "@/lib/services/admin";
import {
  createElectionWithSeats,
  getElectionWithSeats,
} from "@/lib/services/election-config-v2";

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

// POST - Create new election configuration with automatic seat creation
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

    // Check if this is the new V2 format with electionType
    if (body.electionType) {
      // New V2 election creation with automatic seat creation
      const scopeType = body.scopeType || "FULL";

      // For FULL scope, geographic selection is optional
      // For PARTIAL/BY_ELECTION, geographic selection is required
      const electionConfig = {
        name: body.name,
        year: body.year,
        electionType: body.electionType,
        scopeType: scopeType,
        notificationDate: new Date(body.notificationDate),
        nominationStartDate: new Date(body.nominationStartDate),
        nominationEndDate: new Date(body.nominationEndDate),
        scrutinyDate: new Date(body.scrutinyDate),
        withdrawalStartDate: new Date(body.withdrawalStartDate),
        withdrawalEndDate: new Date(body.withdrawalEndDate),
        dailyStartTime: body.dailyStartTime,
        dailyEndTime: body.dailyEndTime,
        nominationFee: body.nominationFee,
        scStFeeDiscount: body.scStFeeDiscount,
        maxNominationsPerCandidate: body.maxNominationsPerCandidate,
        maxProposersRequired: body.maxProposersRequired,
        // Geographic selection - optional for FULL scope
        selectedDistricts: body.selectedDistricts || undefined,
        selectedULBs: body.selectedULBs || undefined,
        selectedGPUs: body.selectedGPUs || undefined,
        selectedZPTCs: body.selectedZPTCs || undefined,
        selectedWards: body.selectedWards || undefined,
        selectedPanchayatWards: body.selectedPanchayatWards || undefined,
      };

      try {
        const election = await createElectionWithSeats(
          electionConfig,
          session.user.id,
        );
        const electionWithSeats = await getElectionWithSeats(election.id);

        return NextResponse.json({
          success: true,
          election: electionWithSeats,
        });
      } catch (validationError) {
        // Handle validation errors and return proper API response
        if (validationError instanceof Error && validationError.message.includes('Validation failed:')) {
          return NextResponse.json(
            {
              success: false,
              error: validationError.message.replace('Validation failed: ', ''),
              type: 'VALIDATION_ERROR'
            },
            { status: 400 }
          );
        }
        
        // Handle other errors
        console.error("Admin election config POST error:", validationError);
        return NextResponse.json(
          { success: false, error: "Internal server error" },
          { status: 500 }
        );
      }
    }

    // If we reach here, it's not a valid V2 format
    return NextResponse.json(
      {
        success: false,
        error:
          "Invalid election configuration format. 'electionType' is required.",
      },
      { status: 400 },
    );

    // // Legacy V1 election creation (backward compatibility)
    // const {
    //   name,
    //   year,
    //   type,
    //   notificationDate,
    //   nominationStartDate,
    //   nominationEndDate,
    //   scrutinyDate,
    //   withdrawalStartDate,
    //   withdrawalEndDate,
    //   dailyStartTime,
    //   dailyEndTime,
    //   nominationFee,
    //   scStFeeDiscount,
    //   maxNominationsPerCandidate,
    //   maxProposersRequired,
    // } = body;

    // // Validate required fields
    // if (
    //   !name ||
    //   !year ||
    //   !type ||
    //   !notificationDate ||
    //   !nominationStartDate ||
    //   !nominationEndDate ||
    //   !scrutinyDate ||
    //   !withdrawalStartDate ||
    //   !withdrawalEndDate ||
    //   nominationFee === undefined
    // ) {
    //   return NextResponse.json(
    //     { success: false, error: "Missing required configuration fields" },
    //     { status: 400 },
    //   );
    // }

    // // Validate dates
    // const nomStart = new Date(nominationStartDate);
    // const nomEnd = new Date(nominationEndDate);
    // const scrutiny = new Date(scrutinyDate);
    // const wdStart = new Date(withdrawalStartDate);
    // const wdEnd = new Date(withdrawalEndDate);

    // if (nomEnd <= nomStart) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: "Nomination end date must be after start date",
    //     },
    //     { status: 400 },
    //   );
    // }

    // if (scrutiny <= nomEnd) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: "Scrutiny date must be after nomination end date",
    //     },
    //     { status: 400 },
    //   );
    // }

    // if (wdStart <= scrutiny) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: "Withdrawal start date must be after scrutiny date",
    //     },
    //     { status: 400 },
    //   );
    // }

    // const result = await createElectionConfig(
    //   {
    //     name,
    //     year,
    //     type,
    //     notificationDate: new Date(notificationDate),
    //     nominationStartDate: nomStart,
    //     nominationEndDate: nomEnd,
    //     scrutinyDate: scrutiny,
    //     withdrawalStartDate: wdStart,
    //     withdrawalEndDate: wdEnd,
    //     dailyStartTime: dailyStartTime || "09:00",
    //     dailyEndTime: dailyEndTime || "15:00",
    //     nominationFee,
    //     scStFeeDiscount: scStFeeDiscount || 0,
    //     maxNominationsPerCandidate: maxNominationsPerCandidate || 3,
    //     maxProposersRequired: maxProposersRequired || 1,
    //   },
    //   session.user.id,
    // );

    // if (!result.success) {
    //   return NextResponse.json(
    //     { success: false, error: result.error },
    //     { status: 400 },
    //   );
    // }

    // return NextResponse.json({ success: true, config: result.config });
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
      "nominationStartDate",
      "nominationEndDate",
      "scrutinyDate",
      "withdrawalStartDate",
      "withdrawalEndDate",
    ];

    for (const field of dateFields) {
      if (parsedData[field]) {
        parsedData[field] = new Date(parsedData[field]);
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

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";
import { NominationStatus } from "@prisma/client";
import { getClientIP } from "@/lib/auth/server-utils";

// POST /api/ro/election/finalize-contesting-candidates - Finalize contesting candidates for active election
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["SUPER_ADMIN", "SES", "RO"].includes(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 1️⃣ Fetch Active Election
    const electionConfig = await db.electionConfig.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        withdrawalEndDate: true,
        currentPhase: true,
      },
    });

    if (!electionConfig) {
      return NextResponse.json(
        { success: false, error: "Active election not found" },
        { status: 404 },
      );
    }

    // 2️⃣ Validate Election Phase
    const currentDate = new Date();
    const withdrawalEndDate = new Date(electionConfig.withdrawalEndDate);

    // Set withdrawal end date to end of day for comparison
    withdrawalEndDate.setHours(23, 59, 59, 999);

    if (currentDate <= withdrawalEndDate) {
      return NextResponse.json(
        { success: false, error: "Withdrawal period still active" },
        { status: 400 },
      );
    }

    const ip = getClientIP(request);

    // 3️⃣ Transaction-Based Update
    const result = await db.$transaction(async (tx) => {
      // Get nominations to update before changing them
      // PROPER: Filter by electionId instead of temporal assumptions
      const nominationsToUpdate = await tx.nominationApplication.findMany({
        where: { 
          status: NominationStatus.ACCEPTED,
          electionId: electionConfig.id, // PROPER: Filter by active election
        },
        select: { 
          id: true,
          ulbId: true,
          wardId: true,
          createdAt: true,
        },
      });

      // If no nominations to update, return early
      if (nominationsToUpdate.length === 0) {
        return { count: 0, nominations: [] };
      }

      // Update all ACCEPTED nominations to CONTESTING
      const updateResult = await tx.nominationApplication.updateMany({
        where: {
          status: NominationStatus.ACCEPTED,
          electionId: electionConfig.id, // PROPER: Filter by active election
        },
        data: {
          status: NominationStatus.CONTESTING,
        },
      });

      // 4️⃣ Create Status History Records
      if (nominationsToUpdate.length > 0) {
        await tx.nominationStatusHistory.createMany({
          data: nominationsToUpdate.map((nomination) => ({
            nominationId: nomination.id,
            fromStatus: NominationStatus.ACCEPTED,
            toStatus: NominationStatus.CONTESTING,
            changedBy: session.user.id,
            ipAddress: ip,
            remarks: "Finalized as contesting candidate",
          })),
        });
      }

      // 5️⃣ Audit Logging
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          entityType: "ElectionConfig",
          entityId: electionConfig.id,
          newValues: {
            finalizedCount: updateResult.count,
            finalizedAt: new Date(),
            operation: "FINALIZE_CONTESTING_CANDIDATES",
            note: "Properly filtered by electionId - no temporal assumptions",
          },
          ipAddress: ip,
        },
      });

      return {
        count: updateResult.count,
        nominations: nominationsToUpdate,
      };
    });

    // 6️⃣ Response
    return NextResponse.json({
      success: true,
      message: "Contestant list finalized successfully",
      data: {
        updatedCount: result.count,
        electionId: electionConfig.id,
        finalizedAt: new Date().toISOString(),
      },
    });

  } catch (error: unknown) {
    console.error("Finalize contesting candidates error:", error);
    
    return NextResponse.json(
      { success: false, error: "Failed to finalize contesting candidates" },
      { status: 500 },
    );
  }
}

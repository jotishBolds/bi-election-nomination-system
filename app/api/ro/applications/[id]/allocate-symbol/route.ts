import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";
import { Role } from "@prisma/client";
import { hasAccessToWard } from "@/lib/services/ro-jurisdiction";
import { allocateSymbolSchema } from "@/lib/auth/validations/symbol-allocation";

// POST /api/ro/applications/[id]/allocate-symbol - Allocate a symbol to a nomination
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id: nominationId } = await params;

    // Validate request body
    const body = await request.json().catch(() => ({}));
    const validation = allocateSymbolSchema.safeParse(body);

    if (!validation.success) {
      const issue = validation.error.issues[0];
      const field = issue.path.join(".");
      return NextResponse.json(
        { success: false, error: `${field}: ${issue.message}` },
        { status: 400 },
      );
    }

    const { symbolId } = validation.data;

    // 2️⃣ Fetch Nomination Details
    const nomination = await db.nominationApplication.findUnique({
      where: { id: nominationId },
      select: {
        id: true,
        wardId: true,
        ulbId: true,
        allocatedSymbolId: true,
        electionId: true, // NEW: Include electionId
      },
    });

    if (!nomination) {
      return NextResponse.json(
        { success: false, error: "Nomination not found" },
        { status: 404 },
      );
    }

    // 3️⃣ Check RO Jurisdiction Access
    if (session.user.role === Role.RO) {
      const hasAccess = await hasAccessToWard(session.user.id, nomination.wardId);
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: "You don't have jurisdiction access to this ward" },
          { status: 403 },
        );
      }
    }

    // 4️⃣ Validate Symbol
    const symbol = await db.electionSymbol.findUnique({
      where: { id: symbolId },
      select: {
        id: true,
        name: true,
        imagePath: true,
        isActive: true,
      },
    });

    if (!symbol || !symbol.isActive) {
      return NextResponse.json(
        { success: false, error: "Symbol not found or inactive" },
        { status: 404 },
      );
    }

    // 6️⃣ Get Active Election
    // Use the nomination's electionId if available, otherwise fall back to active election
    let electionConfig;
    if (nomination.electionId) {
      electionConfig = await db.electionConfig.findUnique({
        where: { id: nomination.electionId },
        select: { id: true },
      });
    } else {
      electionConfig = await db.electionConfig.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
    }

    if (!electionConfig) {
      return NextResponse.json(
        { success: false, error: "No active election found" },
        { status: 400 },
      );
    }

    // 7️⃣ Transaction-Based Allocation
    const result = await db.$transaction(async (tx) => {
      // 5️⃣ Prevent Ward-Level Conflicts (re-check in transaction)
      const existingAllocation = await tx.symbolAllocation.findFirst({
        where: {
          wardId: nomination.wardId,
          symbolId: symbolId,
          electionId: electionConfig.id,
          NOT: [
            { allocatedTo: null },
            { allocatedTo: nominationId },
          ],
        },
      });

      if (existingAllocation) {
        throw new Error("SYMBOL_ALREADY_ALLOCATED");
      }

      // Find existing allocation record for this ward+symbol+election
      const currentAllocation = await tx.symbolAllocation.findFirst({
        where: {
          wardId: nomination.wardId,
          symbolId: symbolId,
          electionId: electionConfig.id,
        },
      });

      let allocation;

      if (currentAllocation) {
        if (currentAllocation.allocatedTo === null) {
          // Case 1: Update existing unallocated allocation
          allocation = await tx.symbolAllocation.update({
            where: { id: currentAllocation.id },
            data: {
              allocatedTo: nominationId,
              allocatedBy: session.user.id,
              allocatedAt: new Date(),
            },
            include: {
              symbol: true,
              ward: true,
            },
          });
        } else if (currentAllocation.allocatedTo === nominationId) {
          // Case 2: Update existing allocation (same nomination)
          allocation = await tx.symbolAllocation.update({
            where: { id: currentAllocation.id },
            data: {
              allocatedBy: session.user.id,
              allocatedAt: new Date(),
            },
            include: {
              symbol: true,
              ward: true,
            },
          });
        } else {
          // This should not happen due to the conflict check above
          throw new Error("SYMBOL_ALREADY_ALLOCATED");
        }
      } else {
        // Case 3: Create new allocation
        allocation = await tx.symbolAllocation.create({
          data: {
            wardId: nomination.wardId,
            symbolId: symbolId,
            electionId: electionConfig.id,
            allocatedTo: nominationId,
            allocatedBy: session.user.id,
            allocatedAt: new Date(),
          },
          include: {
            symbol: true,
            ward: true,
          },
        });
      }

      // 8️⃣ Update NominationApplication
      await tx.nominationApplication.update({
        where: { id: nominationId },
        data: {
          allocatedSymbolId: symbolId,
          // status: "CONTESTING",
        },
      });

      // 10️⃣ Audit Logging
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          entityType: "NominationApplication",
          entityId: nominationId,
          newValues: {
            symbolId,
            symbolName: symbol.name,
            wardId: nomination.wardId,
            allocationType: "SYMBOL_ALLOCATED",
          },
          ipAddress: "api",
        },
      });

      // Log status change
      // await tx.nominationStatusHistory.create({
      //   data: {
      //     nominationId,
      //     fromStatus: "ACCEPTED", // Assuming nomination was accepted before allocation
      //     toStatus: "CONTESTING",
      //     changedBy: session.user.id,
      //     ipAddress: "api",
      //     remarks: `Symbol "${symbol.name}" allocated by RO`,
      //   },
      // });

      return allocation;
    });

    return NextResponse.json({
      success: true,
      message: "Symbol allocated successfully",
      data: {
        nominationId,
        symbolId,
        symbolName: symbol.name,
        allocatedAt: result.allocatedAt,
      },
    });

  } catch (error: unknown) {
    console.error("Symbol allocation error:", error);

    // Handle specific error cases
    if (error instanceof Error) {
      switch (error.message) {
        case "SYMBOL_ALREADY_ALLOCATED":
          return NextResponse.json(
            {
              success: false,
              error: "Symbol already allocated to another candidate in this ward",
            },
            { status: 409 },
          );
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to allocate symbol" },
      { status: 500 },
    );
  }
}

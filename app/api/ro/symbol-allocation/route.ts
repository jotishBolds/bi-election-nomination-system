import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// GET /api/ro/symbol-allocation - Get symbol allocations for accepted nominations
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const wardId = searchParams.get("wardId");
    const electionId = searchParams.get("electionId");

    const where: Record<string, unknown> = {};
    if (wardId) where.wardId = wardId;
    if (electionId) where.electionId = electionId;

    const allocations = await db.symbolAllocation.findMany({
      where,
      include: {
        symbol: true,
        ward: {
          include: {
            ulb: { include: { district: true } },
          },
        },
        election: true,
      },
      orderBy: { allocatedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: allocations,
    });
  } catch (error) {
    console.error("Error fetching symbol allocations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch symbol allocations" },
      { status: 500 },
    );
  }
}

// POST /api/ro/symbol-allocation - Allocate a symbol to a nomination
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

    const body = await request.json();
    const { nominationId, symbolId } = body;

    if (!nominationId || !symbolId) {
      return NextResponse.json(
        { success: false, error: "nominationId and symbolId are required" },
        { status: 400 },
      );
    }

    // Verify nomination exists and is in accepted state
    const nomination = await db.nominationApplication.findUnique({
      where: { id: nominationId },
      include: {
        ward: true,
      },
    });

    if (!nomination) {
      return NextResponse.json(
        { success: false, error: "Nomination not found" },
        { status: 404 },
      );
    }

    if (!["ACCEPTED", "CONTESTING"].includes(nomination.status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Symbol can only be allocated to accepted nominations",
        },
        { status: 400 },
      );
    }

    // Verify symbol exists
    const symbol = await db.electionSymbol.findUnique({
      where: { id: symbolId },
    });

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: "Symbol not found" },
        { status: 404 },
      );
    }

    // Get active election config
    const electionConfig = await db.electionConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!electionConfig) {
      return NextResponse.json(
        { success: false, error: "No active election found" },
        { status: 400 },
      );
    }

    // Check if symbol is already allocated in the same ward for this election
    const existingAllocation = await db.symbolAllocation.findFirst({
      where: {
        symbolId,
        wardId: nomination.wardId,
        electionId: electionConfig.id,
      },
    });

    if (existingAllocation) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This symbol is already allocated to another candidate in this ward",
        },
        { status: 409 },
      );
    }

    // Create symbol allocation record
    const allocation = await db.symbolAllocation.create({
      data: {
        symbolId,
        wardId: nomination.wardId,
        electionId: electionConfig.id,
        allocatedBy: session.user.id,
        allocatedTo: nominationId,
        allocatedAt: new Date(),
      },
      include: {
        symbol: true,
        ward: true,
      },
    });

    // Update the nomination with the allocated symbol
    await db.nominationApplication.update({
      where: { id: nominationId },
      data: {
        allocatedSymbolId: symbolId,
        status: "CONTESTING",
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: "NominationApplication",
        entityId: nominationId,
        userId: session.user.id,
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
    await db.nominationStatusHistory.create({
      data: {
        nominationId,
        fromStatus: nomination.status,
        toStatus: "CONTESTING",
        changedBy: session.user.id,
        ipAddress: "api",
        remarks: `Symbol "${symbol.name}" allocated by RO`,
      },
    });

    return NextResponse.json({
      success: true,
      data: allocation,
      message: `Symbol "${symbol.name}" allocated successfully`,
    });
  } catch (error) {
    console.error("Error allocating symbol:", error);
    return NextResponse.json(
      { success: false, error: "Failed to allocate symbol" },
      { status: 500 },
    );
  }
}

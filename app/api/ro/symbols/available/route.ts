import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { requireRoles } from "@/lib/auth/auth-guard";
import { hasAccessToWard } from "@/lib/services/ro-jurisdiction";

// GET /api/ro/symbols/available?constituencyId=<wardId>
// Returns available election symbols for a given constituency (ward)
export async function GET(request: NextRequest) {
  try {
    const session = await requireRoles([Role.RO, Role.SES, Role.SUPER_ADMIN]);

    const { searchParams } = new URL(request.url);
    const constituencyId = searchParams.get("constituencyId");

    if (!constituencyId) {
      return NextResponse.json(
        { success: false, error: "constituencyId is required" },
        { status: 400 },
      );
    }

    // Verify RO has jurisdiction over this ward
    if (session.user.role === Role.RO) {
      const hasAccess = await hasAccessToWard(session.user.id, constituencyId);
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: "Access denied - not in your jurisdiction" },
          { status: 403 },
        );
      }
    }

    // Get active election config
    const electionConfig = await db.electionConfig.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    if (!electionConfig) {
      return NextResponse.json(
        { success: false, error: "No active election found" },
        { status: 400 },
      );
    }

    // Get all active symbols
    const allSymbols = await db.electionSymbol.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    // Get allocated symbols in this ward for this election
    const allocatedSymbols = await db.symbolAllocation.findMany({
      where: {
        wardId: constituencyId,
        electionId: electionConfig.id,
        allocatedTo: { not: null },
      },
      select: { symbolId: true },
    });

    const allocatedSymbolIds = new Set(allocatedSymbols.map((a) => a.symbolId));

    // Build response with availability status
    const symbols = allSymbols.map((symbol) => ({
      id: symbol.id,
      name: symbol.name,
      imageUrl:
        symbol.imagePath ||
        `/symbols/${symbol.name.toLowerCase().replace(/\s+/g, "-")}.png`,
      isAvailable: !allocatedSymbolIds.has(symbol.id),
    }));

    return NextResponse.json({
      success: true,
      data: symbols,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    if (
      error instanceof Error &&
      (error.message === "FORBIDDEN" ||
        error.message.startsWith("UNAUTHORIZED_"))
    ) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 },
      );
    }
    console.error("Error fetching available symbols:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch available symbols" },
      { status: 500 },
    );
  }
}

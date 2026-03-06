import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// GET /api/ro/applications/[id]/available-symbols - Get available symbols for a nomination
export async function GET(
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

    // Get nomination details with symbol preferences
    const nomination = await db.nominationApplication.findUnique({
      where: { id: nominationId },
      include: {
        ward: true,
        symbolPreferences: {
          include: { symbol: true },
          orderBy: { preferenceOrder: 'asc' },
        },
        election: { // NEW: Include election info
          select: { id: true, isActive: true },
        },
      },
    });

    if (!nomination) {
      return NextResponse.json(
        { success: false, error: "Nomination not found" },
        { status: 404 },
      );
    }

    // Get active election config
    // Use the nomination's election if available, otherwise fall back to active election
    let electionConfig;
    if (nomination.election) {
      electionConfig = nomination.election.isActive ? nomination.election : null;
    } else {
      electionConfig = await db.electionConfig.findFirst({
        where: { isActive: true },
      });
    }

    if (!electionConfig) {
      return NextResponse.json(
        { success: false, error: "No active election found" },
        { status: 400 },
      );
    }

    // 1️⃣ Get applicant's preferred symbols
    const preferredSymbols = nomination.symbolPreferences.map(pref => ({
      id: pref.symbol.id,
      name: pref.symbol.name,
      imagePath: pref.symbol.imagePath,
      preferenceOrder: pref.preferenceOrder,
      isAvailable: false, // Will be determined below
    }));

    // 2️⃣ Determine preferred symbol availability
    // Get all allocated symbols in this ward for this election
    const allocatedSymbols = await db.symbolAllocation.findMany({
      where: {
        wardId: nomination.wardId,
        electionId: electionConfig.id,
        allocatedTo: { not: null },
      },
      select: { symbolId: true },
    });

    const allocatedSymbolIds = new Set(allocatedSymbols.map(a => a.symbolId));

    // Check availability for each preferred symbol
    preferredSymbols.forEach(pref => {
      pref.isAvailable = !allocatedSymbolIds.has(pref.id);
    });

    // 3️⃣ Keep existing available symbol logic
    // Get all symbols that are NOT allocated in the same ward for this election
    const allSymbols = await db.electionSymbol.findMany({
      where: {
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    // Filter out allocated symbols and mark preferences
    const availableSymbols = allSymbols.map(symbol => ({
      id: symbol.id,
      name: symbol.name,
      imagePath: symbol.imagePath,
      isAllocated: allocatedSymbolIds.has(symbol.id),
      isPreferred: preferredSymbols.some(pref => pref.id === symbol.id),
      preferenceOrder: preferredSymbols.find(pref => pref.id === symbol.id)?.preferenceOrder,
    }));

    // Sort by: preferred symbols first (by preference order), then unallocated symbols
    availableSymbols.sort((a, b) => {
      // Both preferred: sort by preference order
      if (a.isPreferred && b.isPreferred) {
        return (a.preferenceOrder || 999) - (b.preferenceOrder || 999);
      }
      // A preferred over unallocated
      if (a.isPreferred && !b.isPreferred) return -1;
      if (!a.isPreferred && b.isPreferred) return 1;
      // Both unallocated: sort by name
      return a.name.localeCompare(b.name);
    });

    // 5️⃣ Handle preferred symbols availability message
    const availablePreferredCount = preferredSymbols.filter(pref => pref.isAvailable).length;
    const preferredMessage = availablePreferredCount === 0 
      ? "No preferred symbols are currently available. Please assign another available symbol."
      : null;

    // 4️⃣ Allocation Priority Logic - Frontend can use this to prioritize
    // const availablePreferredSymbols = preferredSymbols.filter(pref => pref.isAvailable);
    // const otherAvailableSymbols = availableSymbols.filter(s => !s.isAllocated && !s.isPreferred);

    // 6️⃣ Updated API Response Structure
    return NextResponse.json({
      success: true,
      data: {
        nomination: {
          id: nomination.id,
          candidateName: nomination.candidateName,
          ward: nomination.ward,
          symbolPreferences: nomination.symbolPreferences,
        },
        preferredSymbols,
        availableSymbols,
        summary: {
          totalSymbols: allSymbols.length,
          allocatedSymbols: allocatedSymbolIds.size,
          availableCount: availableSymbols.filter(s => !s.isAllocated).length,
          preferredAvailable: availablePreferredCount,
        },
        preferredMessage,
        // Additional data for frontend priority logic
        // allocationPriority: {
        //   preferredAvailable: availablePreferredSymbols,
        //   otherAvailable: otherAvailableSymbols,
        // },
      },
    });

  } catch (error: unknown) {
    console.error("Available symbols GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch available symbols" },
      { status: 500 },
    );
  }
}

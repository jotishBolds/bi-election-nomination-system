// API for fetching Political Parties and Independent Symbols
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "party" or "independent"

    if (type === "party") {
      const parties = await db.politicalParty.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: {
          symbol: true,
        },
      });

      const formattedParties = parties.map((p) => ({
        id: p.id,
        name: p.name,
        shortName: p.abbreviation,
        symbol: p.symbol?.name || p.name,
        symbolImage: p.symbol?.imagePath || null,
      }));

      return NextResponse.json({ success: true, data: formattedParties });
    }

    if (type === "independent") {
      const symbols = await db.electionSymbol.findMany({
        where: {
          isActive: true,
          isReserved: false, // Only non-reserved symbols for independents
        },
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          name: true,
          imagePath: true,
        },
      });

      const formattedSymbols = symbols.map((s) => ({
        id: s.id,
        name: s.name,
        image: s.imagePath,
      }));

      return NextResponse.json({ success: true, data: formattedSymbols });
    }

    // Return both if no type specified
    const [parties, symbols] = await Promise.all([
      db.politicalParty.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: {
          symbol: true,
        },
      }),
      db.electionSymbol.findMany({
        where: {
          isActive: true,
          isReserved: false,
        },
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          name: true,
          imagePath: true,
        },
      }),
    ]);

    const formattedParties = parties.map((p) => ({
      id: p.id,
      name: p.name,
      shortName: p.abbreviation,
      symbol: p.symbol?.name || p.name,
      symbolImage: p.symbol?.imagePath || null,
    }));

    const formattedSymbols = symbols.map((s) => ({
      id: s.id,
      name: s.name,
      image: s.imagePath,
    }));

    return NextResponse.json({
      success: true,
      data: {
        parties: formattedParties,
        independentSymbols: formattedSymbols,
      },
    });
  } catch (error) {
    console.error("Parties fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch parties/symbols" },
      { status: 500 },
    );
  }
}

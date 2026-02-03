import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// GET /api/admin/parties - Get all political parties
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "SES"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { abbreviation: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive && isActive !== "all") {
      where.isActive = isActive === "true";
    }

    const parties = await db.politicalParty.findMany({
      where,
      include: {
        _count: {
          select: { nominations: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: parties,
    });
  } catch (error) {
    console.error("Error fetching parties:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch parties" },
      { status: 500 },
    );
  }
}

// POST /api/admin/parties - Create new political party
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      name,
      abbreviation,
      symbolId,
      isRecognized,
      isNational,
      isState,
      isActive,
    } = body;

    if (!name || !abbreviation) {
      return NextResponse.json(
        { success: false, error: "Party name and abbreviation are required" },
        { status: 400 },
      );
    }

    // Check if party already exists
    const existing = await db.politicalParty.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: "insensitive" } },
          { abbreviation: { equals: abbreviation, mode: "insensitive" } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Party with this name or abbreviation already exists",
        },
        { status: 400 },
      );
    }

    const party = await db.politicalParty.create({
      data: {
        name,
        abbreviation,
        symbolId: symbolId || undefined,
        isRecognized: isRecognized ?? false,
        isNational: isNational ?? false,
        isState: isState ?? false,
        isActive: isActive ?? true,
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "PoliticalParty",
        entityId: party.id,
        userId: session.user.id,
        newValues: { name, abbreviation },
        ipAddress: "api",
      },
    });

    return NextResponse.json({ success: true, data: party });
  } catch (error) {
    console.error("Error creating party:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create party" },
      { status: 500 },
    );
  }
}

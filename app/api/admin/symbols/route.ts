import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// GET /api/admin/symbols - Get all election symbols
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
    const isReserved = searchParams.get("isReserved");

    const where: Record<string, unknown> = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (isActive && isActive !== "all") {
      where.isActive = isActive === "true";
    }

    if (isReserved && isReserved !== "all") {
      where.isReserved = isReserved === "true";
    }

    const symbols = await db.electionSymbol.findMany({
      where,
      include: {
        parties: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
          },
        },
        _count: {
          select: { symbolPreferences: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: symbols,
    });
  } catch (error) {
    console.error("Error fetching symbols:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch symbols" },
      { status: 500 },
    );
  }
}

// POST /api/admin/symbols - Create new election symbol
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
    const { name, imagePath, isReserved, displayOrder, isActive } = body;

    if (!name || !imagePath) {
      return NextResponse.json(
        { success: false, error: "Symbol name and image path are required" },
        { status: 400 },
      );
    }

    // Check if symbol already exists
    const existing = await db.electionSymbol.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Symbol with this name already exists" },
        { status: 400 },
      );
    }

    const symbol = await db.electionSymbol.create({
      data: {
        name,
        imagePath,
        isReserved: isReserved ?? false,
        displayOrder: displayOrder ?? 0,
        isActive: isActive ?? true,
      },
      include: {
        parties: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
          },
        },
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "ElectionSymbol",
        entityId: symbol.id,
        userId: session.user.id,
        newValues: { name, isReserved, imagePath },
        ipAddress: "api",
      },
    });

    return NextResponse.json({ success: true, data: symbol });
  } catch (error) {
    console.error("Error creating symbol:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create symbol" },
      { status: 500 },
    );
  }
}

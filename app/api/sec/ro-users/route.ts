import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// GET /api/sec/ro-users - Get all RO users
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
    const districtId = searchParams.get("districtId");

    const where: Record<string, unknown> = {
      roles: {
        some: {
          role: "RO",
          isActive: true,
        },
      },
    };

    if (districtId && districtId !== "all") {
      where.jurisdictions = {
        some: {
          districtId,
        },
      };
    }

    const roUsers = await db.user.findMany({
      where,
      include: {
        roles: {
          where: { isActive: true },
          select: { role: true },
        },
        jurisdictions: {
          include: {
            district: true,
            ulb: true,
            ward: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: roUsers,
    });
  } catch (error) {
    console.error("Error fetching RO users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch RO users" },
      { status: 500 },
    );
  }
}

// POST /api/sec/ro-users - Create new RO user
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "SES"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { name, phone, email, jurisdiction } = body;

    if (!name || !phone || !jurisdiction?.districtId) {
      return NextResponse.json(
        { success: false, error: "Name, phone, and district are required" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: { phone },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this phone number already exists" },
        { status: 400 },
      );
    }

    const user = await db.user.create({
      data: {
        name,
        phone,
        email: email || undefined,
        isActive: true,
        roles: {
          create: {
            role: "RO",
            isActive: true,
          },
        },
        jurisdictions: {
          create: {
            type: jurisdiction.ulbId ? "ULB" : "DISTRICT",
            districtId: jurisdiction.districtId,
            ulbId: jurisdiction.ulbId || undefined,
          },
        },
      },
      include: {
        roles: {
          where: { isActive: true },
          select: { role: true },
        },
        jurisdictions: {
          include: {
            district: true,
            ulb: true,
            ward: true,
          },
        },
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "User",
        entityId: user.id,
        userId: session.user.id,
        newValues: { name, phone, role: "RO" },
        ipAddress: "api",
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Error creating RO user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create RO user" },
      { status: 500 },
    );
  }
}

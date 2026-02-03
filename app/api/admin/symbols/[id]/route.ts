import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// PUT /api/admin/symbols/[id] - Update election symbol
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, imagePath, isReserved, displayOrder, isActive } = body;

    const existing = await db.electionSymbol.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Symbol not found" },
        { status: 404 },
      );
    }

    // Check for duplicate name (excluding current symbol)
    if (name) {
      const duplicate = await db.electionSymbol.findFirst({
        where: {
          id: { not: id },
          name: { equals: name, mode: "insensitive" },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: "Another symbol with this name exists" },
          { status: 400 },
        );
      }
    }

    const updateData: {
      name?: string;
      imagePath?: string;
      isReserved?: boolean;
      displayOrder?: number;
      isActive?: boolean;
    } = {};
    if (name !== undefined) updateData.name = name;
    if (imagePath !== undefined) updateData.imagePath = imagePath;
    if (isReserved !== undefined) updateData.isReserved = isReserved;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    const symbol = await db.electionSymbol.update({
      where: { id },
      data: updateData,
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
        action: "UPDATE",
        entityType: "ElectionSymbol",
        entityId: symbol.id,
        userId: session.user.id,
        newValues: updateData,
        ipAddress: "api",
      },
    });

    return NextResponse.json({ success: true, data: symbol });
  } catch (error) {
    console.error("Error updating symbol:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update symbol" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/symbols/[id] - Delete election symbol
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const existing = await db.electionSymbol.findUnique({
      where: { id },
      include: {
        _count: {
          select: { symbolPreferences: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Symbol not found" },
        { status: 404 },
      );
    }

    // Check if symbol has preferences - soft delete instead
    if (existing._count.symbolPreferences > 0) {
      const symbol = await db.electionSymbol.update({
        where: { id },
        data: { isActive: false },
      });

      await db.auditLog.create({
        data: {
          action: "DELETE",
          entityType: "ElectionSymbol",
          entityId: symbol.id,
          userId: session.user.id,
          newValues: {
            deactivated: true,
            reason: "Has associated symbol preferences",
          },
          ipAddress: "api",
        },
      });

      return NextResponse.json({
        success: true,
        data: symbol,
        message: "Symbol deactivated (has associated preferences)",
      });
    }

    // Hard delete if no nominations
    await db.electionSymbol.delete({
      where: { id },
    });

    await db.auditLog.create({
      data: {
        action: "DELETE",
        entityType: "ElectionSymbol",
        entityId: id,
        userId: session.user.id,
        newValues: { deleted: true, name: existing.name },
        ipAddress: "api",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Symbol deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting symbol:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete symbol" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// PUT /api/admin/parties/[id] - Update political party
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
    const {
      name,
      abbreviation,
      symbolId,
      isRecognized,
      isNational,
      isState,
      isActive,
    } = body;

    const existing = await db.politicalParty.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Party not found" },
        { status: 404 },
      );
    }

    // Check for duplicate name/abbreviation (excluding current party)
    if (name || abbreviation) {
      const duplicate = await db.politicalParty.findFirst({
        where: {
          id: { not: id },
          OR: [
            name ? { name: { equals: name, mode: "insensitive" } } : {},
            abbreviation
              ? { abbreviation: { equals: abbreviation, mode: "insensitive" } }
              : {},
          ],
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: "Another party with this name or abbreviation exists",
          },
          { status: 400 },
        );
      }
    }

    const updateData: {
      name?: string;
      abbreviation?: string;
      symbolId?: string | null;
      isRecognized?: boolean;
      isNational?: boolean;
      isState?: boolean;
      isActive?: boolean;
    } = {};
    if (name !== undefined) updateData.name = name;
    if (abbreviation !== undefined) updateData.abbreviation = abbreviation;
    if (symbolId !== undefined) updateData.symbolId = symbolId;
    if (isRecognized !== undefined) updateData.isRecognized = isRecognized;
    if (isNational !== undefined) updateData.isNational = isNational;
    if (isState !== undefined) updateData.isState = isState;
    if (isActive !== undefined) updateData.isActive = isActive;

    const party = await db.politicalParty.update({
      where: { id },
      data: updateData,
    });

    // Log the action
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: "PoliticalParty",
        entityId: party.id,
        userId: session.user.id,
        newValues: updateData,
        ipAddress: "api",
      },
    });

    return NextResponse.json({ success: true, data: party });
  } catch (error) {
    console.error("Error updating party:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update party" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/parties/[id] - Delete political party (soft delete by deactivating)
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

    const existing = await db.politicalParty.findUnique({
      where: { id },
      include: {
        _count: {
          select: { nominations: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Party not found" },
        { status: 404 },
      );
    }

    // Check if party has nominations - soft delete instead
    if (existing._count.nominations > 0) {
      const party = await db.politicalParty.update({
        where: { id },
        data: { isActive: false },
      });

      await db.auditLog.create({
        data: {
          action: "DELETE",
          entityType: "PoliticalParty",
          entityId: party.id,
          userId: session.user.id,
          newValues: {
            deactivated: true,
            reason: "Has associated nominations",
          },
          ipAddress: "api",
        },
      });

      return NextResponse.json({
        success: true,
        data: party,
        message: "Party deactivated (has associated nominations)",
      });
    }

    // Hard delete if no nominations
    await db.politicalParty.delete({
      where: { id },
    });

    await db.auditLog.create({
      data: {
        action: "DELETE",
        entityType: "PoliticalParty",
        entityId: id,
        userId: session.user.id,
        newValues: { deleted: true, name: existing.name },
        ipAddress: "api",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Party deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting party:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete party" },
      { status: 500 },
    );
  }
}

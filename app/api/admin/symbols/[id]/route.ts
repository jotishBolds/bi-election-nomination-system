import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth/auth-guard";
import { z } from "zod";
export const symbolIdParamSchema = z.object({
  id: z.string().uuid("Invalid symbol id"),
});

export const updateSymbolSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  imagePath: z.string().min(1).max(500).optional(),
  isReserved: z.boolean().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

// PUT /api/admin/symbols/[id] - Update election symbol
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSuperAdmin();

    const { id } = symbolIdParamSchema.parse(await params);
    const body = await request.json();
    const data = updateSymbolSchema.parse(body);

    const existing = await db.electionSymbol.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Symbol not found" }, { status: 404 });
    }

    // Duplicate name check
    if (data.name) {
      const duplicate = await db.electionSymbol.findFirst({
        where: {
          id: { not: id },
          name: { equals: data.name, mode: "insensitive" },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Another symbol with this name already exists" },
          { status: 400 },
        );
      }
    }

    const symbol = await db.electionSymbol.update({
      where: { id },
      data,
      include: {
        parties: {
          select: { id: true, name: true, abbreviation: true },
        },
      },
    });

    await db.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: "ElectionSymbol",
        entityId: symbol.id,
        userId: session.user.id,
        newValues: data,
        ipAddress: "api",
      },
    });

    return NextResponse.json({ success: true, data: symbol });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: err.issues },
        { status: 400 },
      );
    }

    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("PUT symbol error:", err);
    return NextResponse.json(
      { error: "Failed to update symbol" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/symbols/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSuperAdmin();
    const { id } = symbolIdParamSchema.parse(await params);

    const symbol = await db.electionSymbol.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            symbolPreferences: true,
            allocations: true,
            parties: true,
          },
        },
      },
    });

    if (!symbol) {
      return NextResponse.json({ error: "Symbol not found" }, { status: 404 });
    }

    /**
     * Determine if symbol is in use
     */
    const isUsed =
      symbol.isReserved ||
      symbol._count.symbolPreferences > 0 ||
      symbol._count.allocations > 0 ||
      symbol._count.parties > 0;

    /**
     * SOFT DELETE
     */
    if (isUsed) {
      const updated = await db.electionSymbol.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      await db.auditLog.create({
        data: {
          action: "UPDATE",
          entityType: "ElectionSymbol",
          entityId: id,
          userId: session.user.id,
          oldValues: {
            isActive: true,
          },
          newValues: {
            isActive: false,
            reason: "Symbol already used or reserved",
            usage: {
              reserved: symbol.isReserved,
              preferences: symbol._count.symbolPreferences,
              allocations: symbol._count.allocations,
              parties: symbol._count.parties,
            },
          },
          ipAddress: "api",
          metadata: {
            operation: "SOFT_DELETE",
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message:
          "Symbol has been deactivated because it is already in use or reserved",
      });
    }

    /**
     * HARD DELETE (safe)
     */
    await db.electionSymbol.delete({
      where: { id },
    });

    await db.auditLog.create({
      data: {
        action: "DELETE",
        entityType: "ElectionSymbol",
        entityId: id,
        userId: session.user.id,
        newValues: {
          deleted: true,
          name: symbol.name,
        },
        ipAddress: "api",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Symbol deleted permanently",
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: err.issues },
        { status: 400 },
      );
    }

    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("DELETE symbol error:", err);
    return NextResponse.json(
      { error: "Failed to delete symbol" },
      { status: 500 },
    );
  }
}

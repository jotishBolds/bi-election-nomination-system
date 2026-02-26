// Admin API - Individual Checklist Item Management
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/auth-guard";

const updateChecklistItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(300, "Title too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  category: z.string().max(100, "Category too long").optional(),
  displayOrder: z.number().int().min(0, "Display order must be positive").optional(),
  isRequired: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// PUT - Update checklist item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    await requireSuperAdmin();

    const { itemId } = await params;
    const body = await request.json();

    // Validate request body
    const validation = updateChecklistItemSchema.safeParse(body);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      const field = issue.path.join(".");
      return NextResponse.json(
        { success: false, error: `${field}: ${issue.message}` },
        { status: 400 },
      );
    }

    const data = validation.data;

    // Check if item exists
    const existingItem = await db.electionChecklistItem.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: "Checklist item not found" },
        { status: 404 },
      );
    }

    // Check for duplicate title within election (if title is being updated)
    if (data.title && data.title !== existingItem.title) {
      const duplicateItem = await db.electionChecklistItem.findFirst({
        where: {
          electionId: existingItem.electionId,
          title: data.title,
          id: { not: itemId },
        },
      });

      if (duplicateItem) {
        return NextResponse.json(
          { success: false, error: "An item with this title already exists for this election" },
          { status: 400 },
        );
      }
    }

    const updatedItem = await db.electionChecklistItem.update({
      where: { id: itemId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedItem });
  } catch (error) {
    console.error("Admin checklist item PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete checklist item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    await requireSuperAdmin();

    const { itemId } = await params;

    // Check if item exists
    const existingItem = await db.electionChecklistItem.findUnique({
      where: { id: itemId },
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: "Checklist item not found" },
        { status: 404 },
      );
    }

    // Check if item has responses (prevent deletion if responses exist)
    if (existingItem._count.responses > 0) {
      // Soft delete by setting isActive to false
      await db.electionChecklistItem.update({
        where: { id: itemId },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: "Item deactivated (has responses)",
        data: { ...existingItem, isActive: false },
      });
    }

    // Hard delete if no responses exist
    await db.electionChecklistItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error("Admin checklist item DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

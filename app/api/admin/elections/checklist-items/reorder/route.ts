// Admin API - Reorder Checklist Items
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/auth-guard";

const reorderSchema = z.object({
  electionId: z.string().uuid("Invalid election ID"),
  items: z.array(z.object({
    id: z.string().uuid("Invalid item ID"),
    displayOrder: z.number().int().min(0, "Display order must be positive"),
  })),
});

// PATCH - Reorder checklist items
export async function PATCH(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const body = await request.json();

    // Validate request body
    const validation = reorderSchema.safeParse(body);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      const field = issue.path.join(".");
      return NextResponse.json(
        { success: false, error: `${field}: ${issue.message}` },
        { status: 400 },
      );
    }

    const { electionId, items } = validation.data;

    // Check if election exists
    const election = await db.electionConfig.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      return NextResponse.json(
        { success: false, error: "Election not found" },
        { status: 404 },
      );
    }

    // Update display orders in a transaction
    const updatePromises = items.map((item) =>
      db.electionChecklistItem.update({
        where: { id: item.id },
        data: { displayOrder: item.displayOrder },
      })
    );

    await db.$transaction(updatePromises);

    return NextResponse.json({
      success: true,
      message: "Checklist items reordered successfully",
    });
  } catch (error) {
    console.error("Admin checklist items reorder error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

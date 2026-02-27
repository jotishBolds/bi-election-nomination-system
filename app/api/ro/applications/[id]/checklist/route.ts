import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { requireRoles } from "@/lib/auth/auth-guard";

// GET /api/ro/applications/[id]/checklist - Get checklist items and responses for a nomination
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRoles([Role.RO, Role.SES, Role.SUPER_ADMIN]);
    const { id: nominationId } = await params;

    // Get nomination to verify it exists
    const nomination = await db.nominationApplication.findUnique({
      where: { id: nominationId },
      select: {
        id: true,
        status: true,
      }
    });

    if (!nomination) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 },
      );
    }

    // Get checklist responses for this nomination (created when scrutiny started)
    const checklistResponses = await db.checklistResponse.findMany({
      where: { nominationId },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            displayOrder: true,
            isRequired: true,
          }
        }
      },
      orderBy: {
        item: { displayOrder: 'asc' }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        checklistResponses: checklistResponses.map(response => ({
          id: response.id,
          itemId: response.itemId,
          isFulfilled: response.isFulfilled,
          notes: response.notes,
          fulfilledAt: response.fulfilledAt,
          item: response.item
        }))
      }
    });

  } catch (error: unknown) {
    console.error("RO checklist GET error:", error);
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch checklist" },
      { status: 500 },
    );
  }
}

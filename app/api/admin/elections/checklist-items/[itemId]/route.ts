// Admin API - Individual Checklist Item Management
// NOTE: The ElectionChecklistItem model has been removed from the Prisma schema.
// These endpoints are disabled until the model is restored.
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/auth-guard";

const DISABLED_MSG = "Checklist items feature is currently disabled";

// PUT - Update checklist item (DISABLED)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    await requireSuperAdmin();
    return NextResponse.json(
      { success: false, error: DISABLED_MSG },
      { status: 501 },
    );
  } catch (error) {
    console.error("Admin checklist item PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete checklist item (DISABLED)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    await requireSuperAdmin();
    return NextResponse.json(
      { success: false, error: DISABLED_MSG },
      { status: 501 },
    );
  } catch (error) {
    console.error("Admin checklist item DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

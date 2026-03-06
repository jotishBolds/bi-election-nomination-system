// Admin API - Reorder Checklist Items
// NOTE: The ElectionChecklistItem model has been removed from the Prisma schema.
// This endpoint is disabled until the model is restored.
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/auth-guard";

// PATCH - Reorder checklist items (DISABLED)
export async function PATCH(request: NextRequest) {
  try {
    await requireSuperAdmin();
    return NextResponse.json(
      {
        success: false,
        error: "Checklist items feature is currently disabled",
      },
      { status: 501 },
    );
  } catch (error) {
    console.error("Admin checklist items reorder error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

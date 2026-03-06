// Admin API - Election Checklist Items Management
// NOTE: The ElectionChecklistItem model has been removed from the Prisma schema.
// These endpoints are disabled until the model is restored.
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/auth-guard";

// GET - List checklist items for an election (DISABLED)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ electionId: string }> },
) {
  try {
    await requireSuperAdmin();
    return NextResponse.json({
      success: true,
      data: [],
      message: "Checklist items feature is currently disabled",
    });
  } catch (error) {
    console.error("Admin checklist items GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create new checklist item (DISABLED)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ electionId: string }> },
) {
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
    console.error("Admin checklist items POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

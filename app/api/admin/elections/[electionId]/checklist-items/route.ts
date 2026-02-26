// Admin API - Election Checklist Items Management
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/auth-guard";

const checklistItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(300, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  category: z.string().max(100, "Category too long").optional(),
  displayOrder: z.number().int().min(0, "Display order must be positive").default(0),
  isRequired: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

// GET - List checklist items for an election
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ electionId: string }> },
) {
  try {
    await requireSuperAdmin();

    const { electionId } = await params;
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");

    const checklistItems = await db.electionChecklistItem.findMany({
      where: {
        electionId,
        ...(isActive !== null && { isActive: isActive === "true" }),
      },
      orderBy: { displayOrder: "asc" },
      include: {
        creator: {
          select: { id: true, name: true },
        },
        _count: {
          select: { responses: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: checklistItems });
  } catch (error) {
    console.error("Admin checklist items GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create new checklist item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ electionId: string }> },
) {
  try {
    const session = await requireSuperAdmin();

    const { electionId } = await params;
    const body = await request.json();

    // Validate request body
    const validation = checklistItemSchema.safeParse(body);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      const field = issue.path.join(".");
      return NextResponse.json(
        { success: false, error: `${field}: ${issue.message}` },
        { status: 400 },
      );
    }

    const data = validation.data;

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

    // Check for duplicate title within election
    const existingItem = await db.electionChecklistItem.findFirst({
      where: {
        electionId,
        title: data.title,
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { success: false, error: "An item with this title already exists for this election" },
        { status: 400 },
      );
    }

    // Get the highest display order for this election
    const maxOrder = await db.electionChecklistItem.aggregate({
      where: { electionId },
      _max: { displayOrder: true },
    });

    const displayOrder = data.displayOrder || (maxOrder._max.displayOrder || 0) + 1;

    const checklistItem = await db.electionChecklistItem.create({
      data: {
        ...data,
        electionId,
        displayOrder,
        createdBy: session.user.id,
      },
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: checklistItem });
  } catch (error) {
    console.error("Admin checklist items POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireSuperAdmin, requireRoles } from "@/lib/auth/auth-guard";
import { Role, Gender } from "@prisma/client";

const updateVoterSchema = z.object({
  epic_number: z.string().min(1).max(20).optional(),
  full_name: z.string().min(1).max(200).optional(),
  relation_type: z.string().min(1).max(20).optional(),
  relation_name: z.string().min(1).max(200).optional(),
  postal_address: z.string().min(1).optional(),
  gender: z.nativeEnum(Gender).nullable().optional(),
  is_active: z.boolean().optional(),
});

/* GET - Single voter roll entry */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRoles([Role.SUPER_ADMIN, Role.SES, Role.RO]);

    const { id } = await params;

    const entry = await db.voterRollEntry.findUnique({ where: { id } });

    if (!entry) {
      return NextResponse.json(
        { error: "Voter roll entry not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: entry });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err.message === "FORBIDDEN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Voter roll GET [id] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch voter roll entry" },
      { status: 500 },
    );
  }
}

/* PUT - Update voter roll entry */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSuperAdmin();

    const { id } = await params;
    const body = await request.json();
    const data = updateVoterSchema.parse(body);

    const existing = await db.voterRollEntry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Voter roll entry not found" },
        { status: 404 },
      );
    }

    const updated = await db.voterRollEntry.update({
      where: { id },
      data: {
        ...(data.epic_number && { epicNumber: data.epic_number }),
        ...(data.full_name && { fullName: data.full_name }),
        ...(data.relation_type && { relationType: data.relation_type }),
        ...(data.relation_name && { relationName: data.relation_name }),
        ...(data.postal_address && { postalAddress: data.postal_address }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.is_active !== undefined && { isActive: data.is_active }),
      },
    });

    await db.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: "VoterRollEntry",
        entityId: id,
        userId: session.user.id,
        oldValues: existing as any,
        newValues: updated as any,
        ipAddress: "api",
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    if (err.name === "ZodError")
      return NextResponse.json(
        { error: "Invalid data", details: err.issues },
        { status: 400 },
      );
    if (err.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err.message === "FORBIDDEN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Voter roll PUT error:", err);
    return NextResponse.json(
      { error: "Failed to update voter roll entry" },
      { status: 500 },
    );
  }
}

/* DELETE - Soft delete voter roll entry */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSuperAdmin();

    const { id } = await params;

    const existing = await db.voterRollEntry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Voter roll entry not found" },
        { status: 404 },
      );
    }

    await db.voterRollEntry.update({
      where: { id },
      data: { isActive: false },
    });

    await db.auditLog.create({
      data: {
        action: "DELETE",
        entityType: "VoterRollEntry",
        entityId: id,
        userId: session.user.id,
        oldValues: existing as any,
        ipAddress: "api",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Voter roll entry deleted",
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err.message === "FORBIDDEN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Voter roll DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete voter roll entry" },
      { status: 500 },
    );
  }
}

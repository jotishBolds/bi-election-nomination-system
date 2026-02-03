import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// PUT /api/sec/ro-users/[id] - Update RO user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "SES"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, isActive, jurisdiction } = body;

    const existingUser = await db.user.findUnique({
      where: { id },
      include: { jurisdictions: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Update user data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await db.user.update({
      where: { id },
      data: updateData,
      include: {
        jurisdictions: {
          include: {
            district: true,
            ulb: true,
            ward: true,
          },
        },
      },
    });

    // Update jurisdiction if provided
    if (jurisdiction) {
      // Remove existing jurisdictions
      await db.userJurisdiction.deleteMany({
        where: { userId: id },
      });

      // Create new jurisdiction
      await db.userJurisdiction.create({
        data: {
          userId: id,
          type: jurisdiction.ulbId ? "ULB" : "DISTRICT",
          districtId: jurisdiction.districtId,
          ulbId: jurisdiction.ulbId || undefined,
        },
      });
    }

    // Log the action
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: "User",
        entityId: user.id,
        userId: session.user.id,
        newValues: body,
        ipAddress: "api",
      },
    });

    // Refetch with updated jurisdictions
    const updatedUser = await db.user.findUnique({
      where: { id },
      include: {
        jurisdictions: {
          include: {
            district: true,
            ulb: true,
            ward: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Error updating RO user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update RO user" },
      { status: 500 },
    );
  }
}

// DELETE /api/sec/ro-users/[id] - Deactivate RO user (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "SES"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const user = await db.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        action: "DELETE",
        entityType: "User",
        entityId: user.id,
        userId: session.user.id,
        newValues: { deactivated: true },
        ipAddress: "api",
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Error deactivating RO user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to deactivate RO user" },
      { status: 500 },
    );
  }
}

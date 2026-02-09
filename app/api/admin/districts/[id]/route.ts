import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { requireRoles, requireSuperAdmin } from "@/lib/auth/auth-guard";
import {
  getDistrictById,
  updateDistrictById,
  deleteDistrictById,
} from "@/lib/services/admin/district.service";

const updateDistrictSchema = z.object({
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(100).optional(),
  stateId: z.string().uuid("Invalid stateId").optional(),
  isActive: z.boolean().optional(),
});

/* ---------------- GET BY ID ---------------- */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRoles([Role.SUPER_ADMIN, Role.RO, Role.SES]);

    const { id } = await params;
    const districtId = id;

    const district = await getDistrictById(districtId);
    return NextResponse.json(district);
  } catch (err: any) {
    if (err.message === "DISTRICT_NOT_FOUND") {
      return NextResponse.json(
        { error: "District not found" },
        { status: 404 },
      );
    }

    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("District GET by id error:", err);
    return NextResponse.json(
      { error: "Failed to fetch district" },
      { status: 500 },
    );
  }
}

/* ---------------- UPDATE ---------------- */
// export async function PATCH(
//   request: NextRequest,
//   { params }: { params: { id: string } },
// ) {
//   try {
//     await requireSuperAdmin();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();

    const { id } = await params;
    const districtId = id;

    const body = await request.json();
    const data = updateDistrictSchema.parse(body);

    const updated = await updateDistrictById(districtId, data);
    return NextResponse.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: err.issues },
        { status: 400 },
      );
    }

    switch (err.message) {
      case "DISTRICT_NOT_FOUND":
        return NextResponse.json(
          { error: "District not found" },
          { status: 404 },
        );

      case "STATE_NOT_FOUND":
        return NextResponse.json({ error: "Invalid stateId" }, { status: 400 });

      case "DISTRICT_CODE_EXISTS":
        return NextResponse.json(
          { error: "District with this code already exists" },
          { status: 400 },
        );

      case "DISTRICT_NAME_EXISTS_IN_STATE":
        return NextResponse.json(
          { error: "District with this name already exists in this state" },
          { status: 400 },
        );
    }

    console.error("District PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update district" },
      { status: 500 },
    );
  }
}

/* ---------------- DELETE ---------------- */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();

    const { id } = await params;
    await deleteDistrictById(id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    switch (err.message) {
      case "DISTRICT_NOT_FOUND":
        return NextResponse.json(
          { error: "District not found" },
          { status: 404 },
        );

      case "DISTRICT_HAS_ULBS":
        return NextResponse.json(
          { error: "Cannot delete district with existing ULBs" },
          { status: 400 }, // or 409 Conflict
        );
    }

    console.error("District DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete district" },
      { status: 500 },
    );
  }
}

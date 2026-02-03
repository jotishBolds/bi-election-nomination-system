import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRoles } from "@/lib/auth-guard";
import { Role } from "@/app/generated/prisma/enums";
import { z } from "zod";

/* ---------------- Zod Schemas ---------------- */

const updateDistrictSchema = z.object({
  code: z.string().min(1).max(20).optional(),
  districtNo: z.number().int().positive().optional(),
  name: z.string().min(1).max(100).optional(),
});

/* ---------------- Helpers ---------------- */

function parseId(id: string) {
  const parsed = Number(id);
  if (isNaN(parsed)) {
    throw new Error("INVALID_ID");
  }
  return parsed;
}

/* ---------------- GET: Fetch District by ID ---------------- */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRoles([Role.SUPER_ADMIN, Role.RO, Role.SEC]);

    const { id } = await params;
    const districtId = parseId(id);

    const district = await prisma.district.findUnique({
      where: { id: districtId },
    });

    if (!district) {
      return NextResponse.json(
        { error: "District not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(district);
  } catch (err: any) {
    if (err.message === "INVALID_ID") {
      return NextResponse.json(
        { error: "Invalid district id" },
        { status: 400 },
      );
    }

    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("District GET by ID error:", err);
    return NextResponse.json(
      { error: "Failed to fetch district" },
      { status: 500 },
    );
  }
}

/* ---------------- DELETE: Remove District ---------------- */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRoles([Role.SUPER_ADMIN]);

    const { id } = await params;
    const districtId = parseId(id);

    const existing = await prisma.district.findUnique({
      where: { id: districtId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "District not found" },
        { status: 404 },
      );
    }

    await prisma.district.delete({
      where: { id: districtId },
    });

    return NextResponse.json(
      { message: "District deleted successfully" },
      { status: 200 },
    );
  } catch (err: any) {
    if (err.message === "INVALID_ID") {
      return NextResponse.json(
        { error: "Invalid district id" },
        { status: 400 },
      );
    }

    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("District DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete district" },
      { status: 500 },
    );
  }
}

/* ---------------- PUT: Update District ---------------- */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRoles([Role.SUPER_ADMIN]);

    const { id } = await params;
    const districtId = parseId(id);

    // const district = await prisma.district.findUnique({
    //   where: { id: districtId },
    // });
    // const id = parseId(params.id);
    const body = await request.json();
    const data = updateDistrictSchema.parse(body);

    const existing = await prisma.district.findUnique({
      where: { id: districtId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "District not found" },
        { status: 404 },
      );
    }

    // Unique checks (exclude current record)
    if (data.code) {
      const byCode = await prisma.district.findFirst({
        where: {
          code: data.code,
          NOT: { id: districtId },
        },
      });

      if (byCode) {
        return NextResponse.json(
          { error: "District code already exists" },
          { status: 400 },
        );
      }
    }

    if (data.districtNo) {
      const byNo = await prisma.district.findFirst({
        where: {
          districtNo: data.districtNo,
          NOT: { id: districtId },
        },
      });

      if (byNo) {
        return NextResponse.json(
          { error: "District number already exists" },
          { status: 400 },
        );
      }
    }

    if (data.name) {
      const byNo = await prisma.district.findFirst({
        where: {
          name: data.name,
          NOT: { id: districtId },
        },
      });

      if (byNo) {
        return NextResponse.json(
          { error: "District with the same name already exists" },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.district.update({
      where: { id: districtId },
      data,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: err.issues },
        { status: 400 },
      );
    }

    if (err.message === "INVALID_ID") {
      return NextResponse.json(
        { error: "Invalid district id" },
        { status: 400 },
      );
    }

    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("District PUT error:", err);
    return NextResponse.json(
      { error: "Failed to update district" },
      { status: 500 },
    );
  }
}

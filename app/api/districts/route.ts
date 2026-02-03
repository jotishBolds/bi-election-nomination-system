import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-guard";
import { requireRoles } from "@/lib/auth-guard";
import { z } from "zod";
import { Role } from "@/app/generated/prisma/enums";

const createDistrictSchema = z.object({
  code: z.string().min(1, "Code is required").max(20, "Code too long"),
  districtNo: z.number().int().positive().optional(),
  name: z.string().min(1, "District name is required").max(100),
});

export async function GET(request: NextRequest) {
  try {
    await requireRoles([Role.SUPER_ADMIN, Role.RO, Role.SES]);

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const [districts, totalCount] = await Promise.all([
      prisma.district.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.district.count({ where }),
    ]);

    return NextResponse.json({
      districts,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("Districts GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch districts" },
      { status: 500 },
    );
  }
}

/* ---------------- POST: Create District ---------------- */

export async function POST(request: NextRequest) {
  try {
    // await requireRoles([Role.SUPER_ADMIN, Role.RO]);
    await requireSuperAdmin();

    const body = await request.json();
    const data = createDistrictSchema.parse(body);

    // Check unique code
    const existingByCode = await prisma.district.findUnique({
      where: { code: data.code },
    });

    if (existingByCode) {
      return NextResponse.json(
        { error: "District with this code already exists" },
        { status: 400 },
      );
    }

    // Check unique districtNo (if provided)
    if (data.districtNo) {
      const existingByNo = await prisma.district.findUnique({
        where: { districtNo: data.districtNo },
      });

      if (existingByNo) {
        return NextResponse.json(
          { error: "District number already exists" },
          { status: 400 },
        );
      }
    }

    // Check unique name (if provided)
    if (data.name) {
      const existingByName = await prisma.district.findFirst({
        where: { name: data.name },
      });

      if (existingByName) {
        return NextResponse.json(
          { error: "District with the same name already exists" },
          { status: 400 },
        );
      }
    }

    const district = await prisma.district.create({
      data,
    });

    return NextResponse.json(district, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: err.issues },
        { status: 400 },
      );
    }

    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("Districts POST error:", err);
    return NextResponse.json(
      { error: "Failed to create district" },
      { status: 500 },
    );
  }
}

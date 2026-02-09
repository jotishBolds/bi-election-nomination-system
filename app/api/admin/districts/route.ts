import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { requireRoles, requireSuperAdmin } from "@/lib/auth/auth-guard";
import {
  getDistricts,
  createDistrict,
} from "@/lib/services/admin/district.service";

const createDistrictSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  stateId: z.string().uuid("Invalid stateId"),
});

/* ---------------- GET ---------------- */

export async function GET(request: NextRequest) {
  try {
    await requireRoles([Role.SUPER_ADMIN, Role.RO, Role.SES]);

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);

    const stateId = searchParams.get("stateId") || undefined;

    const result = await getDistricts({
      search,
      page,
      limit,
      stateId,
    });

    return NextResponse.json(result);
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

/* ---------------- POST ---------------- */
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const body = await request.json();
    const data = createDistrictSchema.parse(body);

    const district = await createDistrict(data);

    return NextResponse.json(district, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: err.issues },
        { status: 400 },
      );
    }

    switch (err.message) {
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
    console.error("Districts POST error:", err);

    return NextResponse.json(
      { error: "Failed to create district" },
      { status: 500 },
    );
  }
}

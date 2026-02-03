// Admin API - Jurisdictions (States, Districts, ULBs, Wards)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import {
  createState,
  createDistrict,
  createULB,
  createWard,
  getJurisdictions,
} from "@/lib/services/admin";
import { ULBType } from "@prisma/client";

// GET - List jurisdictions
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as
      | "states"
      | "districts"
      | "ulbs"
      | "wards";
    const parentId = searchParams.get("parentId") || undefined;

    if (!type || !["states", "districts", "ulbs", "wards"].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid type. Must be states, districts, ulbs, or wards",
        },
        { status: 400 },
      );
    }

    const data = await getJurisdictions(type, parentId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Admin jurisdictions GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create jurisdiction
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { type, ...data } = body;

    if (!type || !["state", "district", "ulb", "ward"].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid type. Must be state, district, ulb, or ward",
        },
        { status: 400 },
      );
    }

    let result;

    switch (type) {
      case "state": {
        const { name, code } = data;
        if (!name || !code) {
          return NextResponse.json(
            { success: false, error: "Name and code are required for state" },
            { status: 400 },
          );
        }
        result = await createState({ name, code }, session.user.id);
        break;
      }

      case "district": {
        const { stateId, name, code } = data;
        if (!stateId || !name || !code) {
          return NextResponse.json(
            {
              success: false,
              error: "State ID, name, and code are required for district",
            },
            { status: 400 },
          );
        }
        result = await createDistrict({ stateId, name, code }, session.user.id);
        break;
      }

      case "ulb": {
        const { districtId, name, code, ulbType } = data;
        if (!districtId || !name || !code || !ulbType) {
          return NextResponse.json(
            {
              success: false,
              error:
                "District ID, name, code, and ulbType are required for ULB",
            },
            { status: 400 },
          );
        }
        result = await createULB(
          { districtId, name, code, type: ulbType },
          session.user.id,
        );
        break;
      }

      case "ward": {
        const { ulbId, wardName, wardNo, reservationType } = data;
        if (!ulbId || !wardName || wardNo === undefined) {
          return NextResponse.json(
            {
              success: false,
              error: "ULB ID, wardName, and wardNo are required for ward",
            },
            { status: 400 },
          );
        }
        result = await createWard(
          { ulbId, wardName, wardNo, reservationType },
          session.user.id,
        );
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid type" },
          { status: 400 },
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Admin jurisdictions POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

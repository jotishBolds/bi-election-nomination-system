import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// GET /api/ro/wards - Get wards in RO's jurisdiction
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["SUPER_ADMIN", "SES", "RO"].includes(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // For RO, filter by their jurisdiction
    if (session.user.role === "RO") {
      const userJurisdictions = await db.userJurisdiction.findMany({
        where: { userId: session.user.id },
        include: {
          district: true,
          ulb: true,
        },
      });

      if (userJurisdictions.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      // Get wards based on jurisdiction type
      const ulbIds: string[] = [];
      const districtIds: string[] = [];

      userJurisdictions.forEach((j) => {
        if (j.ulbId) {
          ulbIds.push(j.ulbId);
        } else if (j.districtId) {
          districtIds.push(j.districtId);
        }
      });

      const where: Record<string, unknown> = {};
      if (ulbIds.length > 0 && districtIds.length > 0) {
        where.OR = [
          { ulbId: { in: ulbIds } },
          { ulb: { districtId: { in: districtIds } } },
        ];
      } else if (ulbIds.length > 0) {
        where.ulbId = { in: ulbIds };
      } else if (districtIds.length > 0) {
        where.ulb = { districtId: { in: districtIds } };
      }

      const wards = await db.ward.findMany({
        where,
        include: {
          ulb: {
            include: {
              district: true,
            },
          },
          _count: {
            select: { nominations: true },
          },
        },
        orderBy: { wardNo: "asc" },
      });

      return NextResponse.json({
        success: true,
        data: wards,
      });
    }

    // For admin/SES, return all wards
    const wards = await db.ward.findMany({
      include: {
        ulb: {
          include: {
            district: true,
          },
        },
        _count: {
          select: { nominations: true },
        },
      },
      orderBy: { wardNo: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: wards,
    });
  } catch (error) {
    console.error("Error fetching RO wards:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wards" },
      { status: 500 },
    );
  }
}

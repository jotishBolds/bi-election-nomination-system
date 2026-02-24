import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { requireRoles } from "@/lib/auth/auth-guard";
import { buildJurisdictionFilter } from "@/lib/services/ro-jurisdiction";

// GET /api/ro/wards - Get wards in RO's jurisdiction
export async function GET(request: NextRequest) {
  try {
    const session = await requireRoles([Role.RO, Role.SES, Role.SUPER_ADMIN]);

    const where: Record<string, unknown> = {};

    // For RO, filter by their jurisdiction
    if (session.user.role === Role.RO) {
      const wardFilter = await buildJurisdictionFilter(session.user.id);
      if (!wardFilter) {
        return NextResponse.json({ success: true, data: [] });
      }
      // Since buildJurisdictionFilter returns a condition on the 'ward' relation (id, ulbId, etc.)
      // and we are querying the 'Ward' model directly, we need to adapt the filter.
      // buildJurisdictionFilter returns things like { id: { in: [...] } } or { OR: [...] }
      Object.assign(where, wardFilter);
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
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching RO wards:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wards" },
      { status: 500 },
    );
  }
}

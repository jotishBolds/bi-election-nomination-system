// RO Dashboard API - Get Nominations for RO
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { getRONominations, getRODashboardStats } from "@/lib/services/ro";
import { checkPortalTimeWindow } from "@/lib/services/election-time";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check RO role
    if (session.user.role !== "RO") {
      return NextResponse.json(
        { success: false, error: "Forbidden - RO access required" },
        { status: 403 },
      );
    }

    // Check portal time window
    const timeCheck = await checkPortalTimeWindow();
    if (!timeCheck.isOpen) {
      return NextResponse.json(
        { success: false, error: timeCheck.message },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "nominations";
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // TODO: Look up RO's assigned ward from UserJurisdiction table
    // For now, we rely on getRONominations to handle jurisdiction filtering

    if (type === "stats") {
      // Get dashboard statistics
      const stats = await getRODashboardStats(session.user.id);
      return NextResponse.json({ success: true, stats });
    }

    // Get nominations
    // TODO: Add pagination support to getRONominations
    const nominations = await getRONominations(session.user.id, {
      status: status ? [status as any] : undefined,
    });

    return NextResponse.json({
      success: true,
      nominations,
      total: nominations.length,
      page,
      limit,
    });
  } catch (error) {
    console.error("RO nominations GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// SEC Dashboard API
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import {
  getSECDashboardStats,
  getSECNominations,
  getWardWiseSummary,
  getElectionProgress,
  getAuditTrail,
} from "@/lib/services/sec";

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

    // Check SEC role
    if (session.user.role !== "SES") {
      return NextResponse.json(
        { success: false, error: "Forbidden - SEC access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "stats";
    const stateId = searchParams.get("stateId") || undefined;
    const districtId = searchParams.get("districtId") || undefined;
    const ulbId = searchParams.get("ulbId") || undefined;
    const wardId = searchParams.get("wardId") || undefined;
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    switch (type) {
      case "stats": {
        const stats = await getSECDashboardStats(session.user.id, {
          stateId,
          districtId,
          ulbId,
        });
        return NextResponse.json({ success: true, stats });
      }

      case "nominations": {
        const result = await getSECNominations(session.user.id, {
          stateId,
          districtId,
          ulbId,
          wardId,
          status: status as any,
          page,
          limit,
        });

        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 400 },
          );
        }
        return NextResponse.json(result);
      }

      case "ward-summary": {
        if (!ulbId) {
          return NextResponse.json(
            { success: false, error: "ULB ID is required for ward summary" },
            { status: 400 },
          );
        }
        const result = await getWardWiseSummary(ulbId);
        return NextResponse.json(result);
      }

      case "progress": {
        const result = await getElectionProgress();
        return NextResponse.json(result);
      }

      case "audit": {
        const userId = searchParams.get("userId") || undefined;
        const action = searchParams.get("action") || undefined;
        const entityType = searchParams.get("entityType") || undefined;
        const fromDate = searchParams.get("fromDate")
          ? new Date(searchParams.get("fromDate")!)
          : undefined;
        const toDate = searchParams.get("toDate")
          ? new Date(searchParams.get("toDate")!)
          : undefined;

        const result = await getAuditTrail({
          userId,
          action,
          entityType,
          fromDate,
          toDate,
          page,
          limit,
        });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid type parameter" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("SEC dashboard GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

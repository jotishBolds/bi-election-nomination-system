import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/auth/auth-guard";
import { Role, NominationStatus } from "@prisma/client";
import {
  validateFilterAccess,
  getEffectiveDistrictId,
} from "@/lib/services/ro-jurisdiction";

function isValidUUID(id: string) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(id);
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireRoles([Role.RO, Role.SES, Role.SUPER_ADMIN]);

    const { searchParams } = new URL(request.url);
    const electionId = searchParams.get("electionId");
    const dayNumber = searchParams.get("day");

    const wardId = searchParams.get("wardId");
    const ulbId = searchParams.get("ulbId");
    const districtId = searchParams.get("districtId");

    if (!electionId) {
      return NextResponse.json(
        { success: false, error: "Election ID required" },
        { status: 400 },
      );
    }

    const election = await db.electionConfig.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      return NextResponse.json(
        { success: false, error: "Election not found" },
        { status: 404 },
      );
    }

    // =====================================
    // TERRITORY VALIDATION
    // =====================================

    if (wardId && !isValidUUID(wardId))
      return NextResponse.json(
        { success: false, error: "Invalid wardId" },
        { status: 400 },
      );

    if (ulbId && !isValidUUID(ulbId))
      return NextResponse.json(
        { success: false, error: "Invalid ulbId" },
        { status: 400 },
      );

    if (districtId && !isValidUUID(districtId))
      return NextResponse.json(
        { success: false, error: "Invalid districtId" },
        { status: 400 },
      );

    await validateFilterAccess({
      userId: session.user.id,
      role: session.user.role,
      districtId: districtId ?? undefined,
      ulbId: ulbId ?? undefined,
      wardId: wardId ?? undefined,
    });

    // =====================================
    // AUTO DISTRICT FOR RO
    // =====================================


    // Auto-scope to RO's district if no explicit filter provided
    const effectiveDistrictId = await getEffectiveDistrictId(
      session.user.id,
      session.user.role as Role,
      districtId,
    );


    // =====================================
    // DATE FILTER (WITHDRAWAL BASED)
    // =====================================

    let dateFilter: any = {};

    // DAY-WISE
    if (dayNumber) {
      const dayConfig = await db.dayModuleConfig.findFirst({
        where: {
          electionId,
          dayNumber: Number(dayNumber),
          withdrawalEnabled: true, // 🔥 IMPORTANT
        },
      });

      if (!dayConfig) {
        return NextResponse.json(
          { success: false, error: "Invalid day or withdrawal not enabled" },
          { status: 400 },
        );
      }

      const start = new Date(dayConfig.date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(dayConfig.date);
      end.setHours(23, 59, 59, 999);

      dateFilter = {
        withdrawnAt: {
          gte: start,
          lte: end,
        },
      };
    }

    // CUMULATIVE
    else {
      const start = new Date(election.withdrawalStartDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(election.withdrawalEndDate);
      end.setHours(23, 59, 59, 999);

      dateFilter = {
        withdrawnAt: {
          gte: start,
          lte: end,
        },
      };
    }

    // =====================================
    // WHERE CLAUSE
    // =====================================

    const whereClause: any = {
      AND: [
        dateFilter,
        {
          status: NominationStatus.WITHDRAWN,
        },
      ],
    };

    if (wardId) {
      whereClause.AND.push({ wardId });
    }

    if (ulbId) {
      whereClause.AND.push({ ulbId });
    }

    if (effectiveDistrictId) {
      whereClause.AND.push({
        ward: {
          ulb: {
            districtId: effectiveDistrictId,
          },
        },
      });
    }

    // =====================================
    // FETCH DATA
    // =====================================

    const withdrawals = await db.nominationApplication.findMany({
      where: whereClause,
      include: {
        ward: {
          include: {
            ulb: {
              include: {
                district: true,
              },
            },
          },
        },
        politicalParty: true,
        withdrawalApprover: true,
      },
      orderBy: {
        withdrawnAt: "asc",
      },
    });

    // =====================================
    // RESPONSE
    // =====================================

    return NextResponse.json({
      success: true,
      data: {
        election: {
          id: election.id,
          name: election.name,
          year: election.year,
        },
        reportType: dayNumber ? "DAY_WISE" : "CUMULATIVE",
        totalWithdrawals: withdrawals.length,
        withdrawals: withdrawals.map((n) => ({
          applicationNo: n.applicationNo,
          candidateName: n.candidateName,
          fatherHusbandName: n.fatherHusbandName,
          age: n.age,
          gender: n.gender,
          category: n.category,
          address: n.address,
          districtName: n.ward?.ulb?.district?.name,
          ulbName: n.ward?.ulb?.name,
          wardNo: n.ward?.wardNo,
          wardName: n.ward?.wardName,
          candidateElectoralRollNo: `${n.voterPartNo}/${n.voterSerialNo}`,
          partyName: n.politicalParty?.name || "Independent",

          withdrawnAt: n.withdrawnAt,
          withdrawalReason: n.withdrawalReason,
          approvedBy: n.withdrawalApprover?.name,
        })),
      },
    });
  } catch (error: any) {
    console.error("Form-22 error:", error);

    if (error.message === "UNAUTHORIZED")
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );

    if (error.message === "FORBIDDEN")
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );

    if (
      error.message === "NO_JURISDICTION_ASSIGNED" ||
      error.message === "UNAUTHORIZED_DISTRICT_ACCESS" ||
      error.message === "UNAUTHORIZED_ULB_ACCESS" ||
      error.message === "UNAUTHORIZED_WARD_ACCESS"
    ) {
      return NextResponse.json(
        { success: false, error: "Access denied for selected territory" },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/auth/auth-guard";
import { Role } from "@prisma/client";
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
    // const type = searchParams.get("type"); // cumulative

    const wardId = searchParams.get("wardId");
    const ulbId = searchParams.get("ulbId");
    const districtId = searchParams.get("districtId");

    if (!electionId) {
      return NextResponse.json({
        success: false,
        error: "Election ID required",
      });
    }

    const election = await db.electionConfig.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      return NextResponse.json({ success: false, error: "Election not found" });
    }

    // =====================================
    // SIMPLE FILTER VALIDATION
    // =====================================

    if (wardId) {
      if (!isValidUUID(wardId)) {
        return NextResponse.json(
          { success: false, error: "Invalid wardId" },
          { status: 400 },
        );
      }

      const wardExists = await db.ward.findUnique({
        where: { id: wardId },
        select: { id: true },
      });

      if (!wardExists) {
        return NextResponse.json(
          { success: false, error: "Invalid wardId" },
          { status: 400 },
        );
      }
    }

    if (ulbId) {
      if (!isValidUUID(ulbId)) {
        return NextResponse.json(
          { success: false, error: "Invalid ulbId" },
          { status: 400 },
        );
      }

      const ulbExists = await db.uLB.findUnique({
        where: { id: ulbId },
        select: { id: true },
      });

      if (!ulbExists) {
        return NextResponse.json(
          { success: false, error: "Invalid ulbId" },
          { status: 400 },
        );
      }
    }

    if (districtId) {
      if (!isValidUUID(districtId)) {
        return NextResponse.json(
          { success: false, error: "Invalid districtId format" },
          { status: 400 },
        );
      }

      const districtExists = await db.district.findUnique({
        where: { id: districtId },
        select: { id: true },
      });

      if (!districtExists) {
        return NextResponse.json(
          { success: false, error: "Invalid districtId" },
          { status: 400 },
        );
      }
    }

    await validateFilterAccess({
      userId: session.user.id,
      role: session.user.role,
      districtId: districtId ?? undefined,
      ulbId: ulbId ?? undefined,
      wardId: wardId ?? undefined,
    });

    // =====================================
    // AUTO DISTRICT FILTER FOR RO
    // =====================================

    // Auto-scope to RO's district if no explicit filter provided
    const effectiveDistrictId = await getEffectiveDistrictId(
      session.user.id,
      session.user.role as Role,
      districtId,
    );

    let dateFilter: any = {};

    // ===============================
    // DAY-WISE REPORT
    // ===============================
    if (dayNumber) {
      const dayConfig = await db.dayModuleConfig.findFirst({
        where: {
          electionId,
          dayNumber: Number(dayNumber),
          nominationEnabled: true,
        },
      });

      if (!dayConfig) {
        return NextResponse.json({
          success: false,
          error: "Invalid day or nominations not enabled",
        });
      }

      const start = new Date(dayConfig.date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(dayConfig.date);
      end.setHours(23, 59, 59, 999);

      dateFilter = {
        submittedAt: {
          gte: start,
          lte: end,
        },
      };
    }

    // ===============================
    // CUMULATIVE REPORT
    // ===============================
    else {
      const start = new Date(election.nominationStartDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(election.nominationEndDate);
      end.setHours(23, 59, 59, 999);

      dateFilter = {
        submittedAt: {
          gte: start,
          lte: end,
        },
      };
    }

    // =====================================
    // BUILD DYNAMIC WHERE CLAUSE
    // =====================================

    const whereClause: any = {
      AND: [
        dateFilter,
        {
          status: { not: "DRAFT" },
        },
      ],
    };

    // Ward filter (direct)
    if (wardId) {
      whereClause.AND.push({
        wardId: wardId,
      });
    }

    // ULB filter (direct)
    if (ulbId) {
      whereClause.AND.push({
        ulbId: ulbId,
      });
    }

    // District filter (via relation)
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
    // FETCH NOMINATIONS
    // =====================================

    const nominations = await db.nominationApplication.findMany({
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
        proposers: true,
      },
      orderBy: {
        submittedAt: "asc",
      },
    });

    // =====================================
    // RESPONSE
    // =====================================

    // Group nominations by ward if no specific wardId provided
    if (!wardId) {
      // Group nominations by ward
      const wardGroups = new Map<string, any[]>();
      nominations.forEach((nomination) => {
        const wardId = nomination.wardId;
        if (!wardGroups.has(wardId)) {
          wardGroups.set(wardId, []);
        }
        wardGroups.get(wardId)!.push(nomination);
      });

      // Build ward-wise response
      const wards = Array.from(wardGroups.entries()).map(
        ([wardId, wardNominations]) => {
          const firstNomination = wardNominations[0];
          return {
            wardId,
            wardNo: firstNomination.ward?.wardNo,
            wardName: firstNomination.ward?.wardName,
            ulbName: firstNomination.ward?.ulb?.name,
            districtName: firstNomination.ward?.ulb?.district?.name,
            totalSubmissions: wardNominations.length,
            nominations: wardNominations.map((n) => ({
              applicationNo: n.applicationNo,
              candidateName: n.candidateName,
              fatherHusbandName: n.fatherHusbandName,
              age: n.age,
              address: n.address,
              category: n.category,
              gender: n.gender,

              districtName: n.ward?.ulb?.district?.name,
              ulbName: n.ward?.ulb?.name,
              wardNo: n.ward?.wardNo,
              wardName: n.ward?.wardName,

              partyName: n.politicalParty?.name || "Independent",
              submittedAt: n.submittedAt,

              candidateElectoralRollNo: `${n.voterPartNo}/${n.voterSerialNo}`,

              proposers: n.proposers.map((p: any) => ({
                proposerName: p.name,
                proposerElectoralRollNo: `${p.voterPartNo}/${p.voterSerialNo}`,
              })),
            })),
          };
        },
      );

      // Sort wards by wardNo for consistent PDF page order
      wards.sort((a, b) => (a.wardNo || 0) - (b.wardNo || 0));

      // Return ward-grouped response
      return NextResponse.json({
        success: true,
        data: {
          election: {
            id: election.id,
            name: election.name,
            year: election.year,
            dailyStartTime: election.dailyStartTime,
            dailyEndTime: election.dailyEndTime,
          },
          reportType: dayNumber ? "DAY_WISE" : "CUMULATIVE",
          filtersApplied: {
            wardId,
            ulbId,
            districtId,
          },
          totalSubmissions: nominations.length,
          wards,
        },
      });
    }

    // Return existing flat response for backward compatibility
    return NextResponse.json({
      success: true,
      data: {
        election: {
          id: election.id,
          name: election.name,
          year: election.year,
          dailyStartTime: election.dailyStartTime,
          dailyEndTime: election.dailyEndTime,
        },
        reportType: dayNumber ? "DAY_WISE" : "CUMULATIVE",
        filtersApplied: {
          wardId,
          ulbId,
          districtId,
        },
        totalSubmissions: nominations.length,
        nominations: nominations.map((n) => ({
          applicationNo: n.applicationNo,
          candidateName: n.candidateName,
          fatherHusbandName: n.fatherHusbandName,
          age: n.age,
          address: n.address,
          category: n.category,
          gender: n.gender,

          districtName: n.ward?.ulb?.district?.name,
          ulbName: n.ward?.ulb?.name,
          wardNo: n.ward?.wardNo,
          wardName: n.ward?.wardName,

          partyName: n.politicalParty?.name || "Independent",
          submittedAt: n.submittedAt,

          candidateElectoralRollNo: `${n.voterPartNo}/${n.voterSerialNo}`,

          proposers: n.proposers.map((p: any) => ({
            proposerName: p.name,
            proposerElectoralRollNo: `${p.voterPartNo}/${p.voterSerialNo}`,
          })),
        })),
      },
    });
  } catch (error: any) {
    console.error("Form-19 error:", error);

    // Proper error mapping from guard
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }
    // Territory errors
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

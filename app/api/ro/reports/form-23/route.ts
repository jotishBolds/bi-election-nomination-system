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
    // BASIC FILTER VALIDATION
    // =====================================

    if (wardId) {
      if (!isValidUUID(wardId))
        return NextResponse.json(
          { success: false, error: "Invalid wardId" },
          { status: 400 },
        );

      const exists = await db.ward.findUnique({
        where: { id: wardId },
        select: { id: true },
      });

      if (!exists)
        return NextResponse.json(
          { success: false, error: "Invalid wardId" },
          { status: 400 },
        );
    }

    if (ulbId) {
      if (!isValidUUID(ulbId))
        return NextResponse.json(
          { success: false, error: "Invalid ulbId" },
          { status: 400 },
        );

      const exists = await db.uLB.findUnique({
        where: { id: ulbId },
        select: { id: true },
      });

      if (!exists)
        return NextResponse.json(
          { success: false, error: "Invalid ulbId" },
          { status: 400 },
        );
    }

    if (districtId) {
      if (!isValidUUID(districtId))
        return NextResponse.json(
          { success: false, error: "Invalid districtId" },
          { status: 400 },
        );

      const exists = await db.district.findUnique({
        where: { id: districtId },
        select: { id: true },
      });

      if (!exists)
        return NextResponse.json(
          { success: false, error: "Invalid districtId" },
          { status: 400 },
        );
    }

    // Only validate if any filter passed
    if (districtId || ulbId || wardId) {
      await validateFilterAccess({
        userId: session.user.id,
        role: session.user.role,
        districtId: districtId ?? undefined,
        ulbId: ulbId ?? undefined,
        wardId: wardId ?? undefined,
      });
    }

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
    // NOMINATION DATE RANGE (CUMULATIVE ONLY)
    // =====================================

    const start = new Date(election.nominationStartDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(election.nominationEndDate);
    end.setHours(23, 59, 59, 999);

    const dateFilter = {
      submittedAt: {
        gte: start,
        lte: end,
      },
    };

    // =====================================
    // WHERE CLAUSE
    // =====================================

    const whereClause: any = {
      AND: [
        dateFilter,
        {
          status: NominationStatus.CONTESTING,
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

    const contestingList = await db.nominationApplication.findMany({
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
        allocatedSymbol: true,
      },
      orderBy: [{ wardId: "asc" }, { candidateName: "asc" }],
    });

    // =====================================
    // RESPONSE
    // =====================================

    // Group contesting candidates by ward if no specific wardId provided
    if (!wardId) {
      // Group contesting candidates by ward
      const wardGroups = new Map<string, any[]>();
      contestingList.forEach((candidate) => {
        const wardId = candidate.wardId;
        if (!wardGroups.has(wardId)) {
          wardGroups.set(wardId, []);
        }
        wardGroups.get(wardId)!.push(candidate);
      });

      // Build ward-wise response
      const wards = Array.from(wardGroups.entries()).map(
        ([wardId, wardCandidates]) => {
          const firstCandidate = wardCandidates[0];
          return {
            wardId,
            wardNo: firstCandidate.ward?.wardNo,
            wardName: firstCandidate.ward?.wardName,
            ulbName: firstCandidate.ward?.ulb?.name,
            districtName: firstCandidate.ward?.ulb?.district?.name,
            totalContestingCandidates: wardCandidates.length,
            nominations: wardCandidates.map((n) => ({
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

              partyName: n.politicalParty?.name || "Independent",
              allocatedSymbol: n.allocatedSymbol?.name || null,

              submittedAt: n.submittedAt,
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
          },
          reportType: "CUMULATIVE",
          filtersApplied: {
            wardId,
            ulbId,
            districtId: effectiveDistrictId,
          },
          totalContestingCandidates: contestingList.length,
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
        },
        reportType: "CUMULATIVE",
        filtersApplied: {
          wardId,
          ulbId,
          districtId: effectiveDistrictId,
        },
        totalContestingCandidates: contestingList.length,
        candidates: contestingList.map((n) => ({
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

          partyName: n.politicalParty?.name || "Independent",
          allocatedSymbol: n.allocatedSymbol?.name || null,

          submittedAt: n.submittedAt,
        })),
      },
    });
  } catch (error: any) {
    console.error("Form-23 error:", error);

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

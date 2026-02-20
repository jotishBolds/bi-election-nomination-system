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

    // ===============================
    // SIMPLE FILTER VALIDATION
    // ===============================

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

    // ===============================
    // TERRITORY GUARD
    // ===============================

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

    // ===============================
    // DATE RANGE (CUMULATIVE ONLY)
    // ===============================

    const start = new Date(election.nominationStartDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(election.nominationEndDate);
    end.setHours(23, 59, 59, 999);

    // ===============================
    // BUILD WHERE CLAUSE
    // ===============================

    const whereClause: any = {
      AND: [
        {
          submittedAt: {
            gte: start,
            lte: end,
          },
        },
        {
          status: {
            in: [NominationStatus.ACCEPTED],
          },
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

    // ===============================
    // FETCH DATA
    // ===============================

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
      },
      orderBy: {
        candidateName: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        election: {
          id: election.id,
          name: election.name,
          year: election.year,
        },
        filtersApplied: {
          wardId,
          ulbId,
          districtId,
        },
        totalValidNominations: nominations.length,
        nominations: nominations.map((n) => ({
          applicationNo: n.applicationNo,
          candidateName: n.candidateName,
          fatherHusbandName: n.fatherHusbandName,
          age: n.age,
          address: n.address,
          gender: n.gender,
          category: n.category,
          districtName: n.ward?.ulb?.district?.name,
          ulbName: n.ward?.ulb?.name,
          wardNo: n.ward?.wardNo,
          wardName: n.ward?.wardName,
          candidateElectoralRollNo: `${n.voterPartNo}/${n.voterSerialNo}`,
          submittedAt: n.submittedAt,
          partyName: n.politicalParty?.name || "Independent",
          status: n.status,
        })),
      },
    });
  } catch (error: any) {
    console.error("Form-20 error:", error);

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

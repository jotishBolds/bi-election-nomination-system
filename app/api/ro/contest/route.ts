import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// Helper to get RO's jurisdiction filter
async function getROJurisdictionFilter(userId: string) {
  const userJurisdictions = await db.userJurisdiction.findMany({
    where: { userId },
  });

  if (userJurisdictions.length === 0) {
    return null;
  }

  const ulbIds: string[] = [];
  const districtIds: string[] = [];

  userJurisdictions.forEach((j) => {
    if (j.ulbId) {
      ulbIds.push(j.ulbId);
    } else if (j.districtId) {
      districtIds.push(j.districtId);
    }
  });

  const wardFilter: Record<string, unknown> = {};
  if (ulbIds.length > 0 && districtIds.length > 0) {
    wardFilter.OR = [
      { ulbId: { in: ulbIds } },
      { ulb: { districtId: { in: districtIds } } },
    ];
  } else if (ulbIds.length > 0) {
    wardFilter.ulbId = { in: ulbIds };
  } else if (districtIds.length > 0) {
    wardFilter.ulb = { districtId: { in: districtIds } };
  }

  return wardFilter;
}

// GET /api/ro/contest - Get final contestant list
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

    const { searchParams } = new URL(request.url);
    const wardId = searchParams.get("wardId");
    const format = searchParams.get("format"); // "json" | "csv"

    // Only approved nominations that haven't been withdrawn
    const where: Record<string, unknown> = {
      status: "APPROVED",
    };

    // Filter by RO's jurisdiction if user is RO
    if (session.user.role === "RO") {
      const wardFilter = await getROJurisdictionFilter(session.user.id);
      if (!wardFilter) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
      where.ward = wardFilter;
    }

    // Filter by specific ward
    if (wardId && wardId !== "all") {
      where.wardId = wardId;
    }

    const contestants = await db.nominationApplication.findMany({
      where,
      include: {
        applicantProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
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
      orderBy: [{ ward: { wardNo: "asc" } }, { candidateName: "asc" }],
    });

    // If CSV format requested
    if (format === "csv") {
      const csvRows = [
        [
          "Application No",
          "Candidate Name",
          "Phone",
          "Ward No",
          "Ward Name",
          "ULB",
          "District",
          "Party",
          "Symbol",
          "Reservation",
        ].join(","),
      ];

      contestants.forEach((c) => {
        csvRows.push(
          [
            c.applicationNo || "",
            c.candidateName || "",
            c.applicantProfile?.user?.phone || "",
            c.ward?.wardNo?.toString() || "",
            c.ward?.wardName || "",
            c.ward?.ulb?.name || "",
            c.ward?.ulb?.district?.name || "",
            c.politicalParty?.name || "Independent",
            c.allocatedSymbol?.name || "",
            c.ward?.reservationType || "",
          ].join(","),
        );
      });

      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=contestants.csv",
        },
      });
    }

    // Group by ward for summary
    interface WardSummaryItem {
      wardId: string;
      wardNo: number | undefined;
      wardName: string | undefined;
      ulbName: string | undefined;
      districtName: string | undefined;
      reservation: string | null | undefined;
      contestants: Array<{
        id: string;
        applicationNo: string;
        candidateName: string;
        candidatePhone: string | null | undefined;
        partyName: string;
        symbolName: string | undefined;
      }>;
    }

    const wardSummary = contestants.reduce(
      (acc, c) => {
        const wardKey = c.wardId || "unknown";
        if (!acc[wardKey]) {
          acc[wardKey] = {
            wardId: wardKey,
            wardNo: c.ward?.wardNo,
            wardName: c.ward?.wardName,
            ulbName: c.ward?.ulb?.name,
            districtName: c.ward?.ulb?.district?.name,
            reservation: c.ward?.reservationType,
            contestants: [],
          };
        }
        acc[wardKey].contestants.push({
          id: c.id,
          applicationNo: c.applicationNo,
          candidateName: c.candidateName,
          candidatePhone: c.applicantProfile?.user?.phone,
          partyName: c.politicalParty?.name || "Independent",
          symbolName: c.allocatedSymbol?.name,
        });
        return acc;
      },
      {} as Record<string, WardSummaryItem>,
    );

    return NextResponse.json({
      success: true,
      data: {
        contestants,
        wardSummary: Object.values(wardSummary),
        totalContestants: contestants.length,
        totalWards: Object.keys(wardSummary).length,
      },
    });
  } catch (error) {
    console.error("Error fetching contestants:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch contestants" },
      { status: 500 },
    );
  }
}

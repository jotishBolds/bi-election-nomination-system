// RO Dashboard API
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { db } from "@/lib/db";
import { NominationStatus } from "@prisma/client";
import type { RODashboardData, ElectionScheduleItem } from "@/types/dashboard";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get user with jurisdictions
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        roles: true,
        jurisdictions: {
          include: {
            district: true,
            ulb: {
              include: {
                wards: true,
                district: true,
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
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Verify RO role
    const isRO = user.roles.some((r) => r.role === "RO");
    if (!isRO) {
      return NextResponse.json(
        { success: false, error: "Forbidden - RO access required" },
        { status: 403 },
      );
    }

    // Build ward IDs from jurisdiction
    const wardIds: string[] = [];
    let districtName = "";
    let ulbName = "";
    const wardNames: string[] = [];

    for (const j of user.jurisdictions) {
      if (j.ward) {
        wardIds.push(j.ward.id);
        wardNames.push(j.ward.wardName);
        ulbName = j.ward.ulb.name;
        districtName = j.ward.ulb.district.name;
      } else if (j.ulb) {
        wardIds.push(...j.ulb.wards.map((w) => w.id));
        wardNames.push(...j.ulb.wards.map((w) => w.wardName));
        ulbName = j.ulb.name;
        districtName = j.ulb.district.name;
      } else if (j.district) {
        districtName = j.district.name;
        // Get all ULBs and wards under this district
        const ulbs = await db.uLB.findMany({
          where: { districtId: j.district.id },
          include: { wards: true },
        });
        for (const ulb of ulbs) {
          wardIds.push(...ulb.wards.map((w) => w.id));
          wardNames.push(...ulb.wards.map((w) => w.wardName));
        }
        ulbName = ulbs.length > 0 ? `${ulbs.length} ULBs` : "";
      }
    }

    // Get nominations in jurisdiction
    const nominations = await db.nominationApplication.findMany({
      where: {
        wardId: { in: wardIds },
      },
      include: {
        ward: {
          include: {
            ulb: true,
          },
        },
        applicantProfile: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    // Calculate stats
    const stats = {
      totalNominations: nominations.length,
      uniqueCandidates: new Set(nominations.map((n) => n.applicantProfileId))
        .size,
      pendingReceipt: nominations.filter(
        (n) => n.status === NominationStatus.SUBMITTED,
      ).length,
      pendingScrutiny: nominations.filter(
        (n) => n.status === NominationStatus.RECEIVED,
      ).length,
      approved: nominations.filter(
        (n) => n.status === NominationStatus.ACCEPTED,
      ).length,
      rejected: nominations.filter(
        (n) => n.status === NominationStatus.REJECTED,
      ).length,
      withdrawn: nominations.filter(
        (n) => n.status === NominationStatus.WITHDRAWN,
      ).length,
      contesting: nominations.filter(
        (n) => n.status === NominationStatus.CONTESTING,
      ).length,
    };

    // Ward-wise stats
    const wardStatsMap = new Map<
      string,
      {
        wardNo: number;
        wardName: string;
        total: number;
        pending: number;
        approved: number;
        rejected: number;
      }
    >();
    const wards = await db.ward.findMany({
      where: { id: { in: wardIds } },
    });

    for (const ward of wards) {
      wardStatsMap.set(ward.id, {
        wardNo: ward.wardNo,
        wardName: ward.wardName,
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      });
    }

    for (const nom of nominations) {
      const wardStat = wardStatsMap.get(nom.wardId);
      if (wardStat) {
        wardStat.total++;
        if (
          nom.status === NominationStatus.SUBMITTED ||
          nom.status === NominationStatus.RECEIVED
        ) {
          wardStat.pending++;
        } else if (
          nom.status === NominationStatus.ACCEPTED ||
          nom.status === NominationStatus.CONTESTING
        ) {
          wardStat.approved++;
        } else if (nom.status === NominationStatus.REJECTED) {
          wardStat.rejected++;
        }
      }
    }

    // Get election config
    const electionConfig = await db.electionConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    // Build election schedule (no fallback - config required)
    const electionSchedule: ElectionScheduleItem[] = electionConfig
      ? buildElectionSchedule(electionConfig)
      : []; // No static fallback

    // Calculate days remaining (only if config exists)
    const nominationEndDate = electionConfig?.nominationEndDate;
    const today = new Date();
    const daysRemaining = nominationEndDate
      ? Math.max(
          0,
          Math.ceil(
            (nominationEndDate.getTime() - today.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : null;

    const dashboardData: RODashboardData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email || undefined,
        phone: user.phone || undefined,
        role: "RO",
        jurisdiction: {
          district: districtName,
          ulb: ulbName,
          ward: wardNames[0] || undefined,
        },
      },
      jurisdiction: {
        district: districtName,
        ulb: ulbName,
        wards: wardNames,
      },
      stats,
      wardWiseStats: Array.from(wardStatsMap.values()).sort(
        (a, b) => a.wardNo - b.wardNo,
      ),
      recentNominations: nominations.slice(0, 10).map((n) => ({
        id: n.id,
        applicationNo: n.applicationNo,
        candidateName: n.candidateName,
        wardName: n.ward.wardName,
        status: n.status.toLowerCase(),
        submittedAt: n.submittedAt?.toISOString() || "",
      })),
      electionSchedule,
      daysRemaining,
      currentPhase: electionConfig?.currentPhase || "NOMINATION",
    };

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error("RO dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard" },
      { status: 500 },
    );
  }
}

function buildElectionSchedule(config: any): ElectionScheduleItem[] {
  const formatDate = (date: Date) =>
    date
      .toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, ".");

  const getStatus = (date: Date): "completed" | "current" | "upcoming" => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    if (target < today) return "completed";
    if (target.getTime() === today.getTime()) return "current";
    return "upcoming";
  };

  return [
    {
      slNo: "i",
      event: "Issue of Notification",
      date: formatDate(config.notificationDate),
      dateObj: config.notificationDate,
      status: getStatus(config.notificationDate),
    },
    {
      slNo: "ii",
      event: "Last date for making nomination",
      date: formatDate(config.nominationEndDate),
      dateObj: config.nominationEndDate,
      status: getStatus(config.nominationEndDate),
      highlight: true,
    },
    {
      slNo: "iii",
      event: "Date for scrutiny of Nomination",
      date: formatDate(config.scrutinyDate),
      dateObj: config.scrutinyDate,
      status: getStatus(config.scrutinyDate),
    },
    {
      slNo: "iv",
      event: "Last date for withdrawal",
      date: formatDate(config.withdrawalEndDate),
      dateObj: config.withdrawalEndDate,
      status: getStatus(config.withdrawalEndDate),
    },
    {
      slNo: "v",
      event: "Date of Poll (if necessary)",
      date: config.pollDate ? formatDate(config.pollDate) : "TBD",
      dateObj: config.pollDate || new Date(),
      status: config.pollDate ? getStatus(config.pollDate) : "upcoming",
    },
    {
      slNo: "vi",
      event: "Election completion date",
      date: config.resultDate ? formatDate(config.resultDate) : "TBD",
      dateObj: config.resultDate || new Date(),
      status: config.resultDate ? getStatus(config.resultDate) : "upcoming",
    },
    {
      slNo: "-",
      event: "Counting of votes",
      date: config.countingDate ? formatDate(config.countingDate) : "TBD",
      dateObj: config.countingDate || new Date(),
      status: config.countingDate ? getStatus(config.countingDate) : "upcoming",
    },
  ];
}

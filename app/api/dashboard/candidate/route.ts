// Candidate Dashboard API
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { db } from "@/lib/db";
import type {
  CandidateDashboardData,
  ElectionScheduleItem,
} from "@/types/dashboard";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get user details
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        roles: true,
        applicantProfile: {
          include: {
            voterRecord: {
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

    // Get election config
    const electionConfig = await db.electionConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    // Get all nominations for this user
    const nominations = user.applicantProfile
      ? await db.nominationApplication.findMany({
          where: { applicantProfileId: user.applicantProfile.id },
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
            brPayments: {
              orderBy: { submittedAt: "desc" },
              take: 1,
            },
          },
          orderBy: { submittedAt: "desc" },
        })
      : [];

    const maxAllowed = electionConfig?.maxNominationsPerCandidate || 3;
    // Count all nominations (including drafts) for consistency
    const totalCount = nominations.length;
    const submittedCount = nominations.filter(
      (n) => n.status !== "DRAFT",
    ).length;

    // Generate dynamic application ID for the user using last 4 chars + random
    const applicationId = user.applicantProfile
      ? `MC${electionConfig?.year || 2026}-${user.id.slice(-4).toUpperCase()}${Math.random().toString(36).substring(2, 4).toUpperCase()}`
      : undefined;

    // Build election schedule from config (no fallback - config required)
    const electionSchedule: ElectionScheduleItem[] = electionConfig
      ? [
          {
            slNo: "i",
            event: "Issue of Notification",
            date: formatDate(electionConfig.notificationDate),
            dateObj: electionConfig.notificationDate,
            status: getDateStatus(electionConfig.notificationDate),
          },
          {
            slNo: "ii",
            event: "Last date for making nomination",
            date: formatDate(electionConfig.nominationEndDate),
            dateObj: electionConfig.nominationEndDate,
            status: getDateStatus(electionConfig.nominationEndDate),
            highlight: true,
          },
          {
            slNo: "iii",
            event: "Date for scrutiny of Nomination",
            date: formatDate(electionConfig.scrutinyDate),
            dateObj: electionConfig.scrutinyDate,
            status: getDateStatus(electionConfig.scrutinyDate),
          },
          {
            slNo: "iv",
            event: "Last date for withdrawal",
            date: formatDate(electionConfig.withdrawalEndDate),
            dateObj: electionConfig.withdrawalEndDate,
            status: getDateStatus(electionConfig.withdrawalEndDate),
          },
          {
            slNo: "v",
            event: "Date of Poll (if necessary)",
            date: electionConfig.pollDate
              ? formatDate(electionConfig.pollDate)
              : "TBD",
            dateObj: electionConfig.pollDate || new Date(),
            status: electionConfig.pollDate
              ? getDateStatus(electionConfig.pollDate)
              : "upcoming",
          },
          {
            slNo: "vi",
            event: "Election completion date",
            date: electionConfig.resultDate
              ? formatDate(electionConfig.resultDate)
              : "TBD",
            dateObj: electionConfig.resultDate || new Date(),
            status: electionConfig.resultDate
              ? getDateStatus(electionConfig.resultDate)
              : "upcoming",
          },
        ]
      : []; // No fallback - election config required

    // Calculate days remaining (only if election config exists)
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

    // Get latest nomination
    const latestNomination = nominations[0];

    const dashboardData: CandidateDashboardData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email || undefined,
        phone: user.phone || undefined,
        role: "CANDIDATE",
        applicationId,
        jurisdiction: user.applicantProfile?.voterRecord
          ? {
              district:
                user.applicantProfile.voterRecord.ward.ulb.district.name,
              ulb: user.applicantProfile.voterRecord.ward.ulb.name,
              ward: user.applicantProfile.voterRecord.ward.wardName,
            }
          : undefined,
      },
      submissions: {
        count: totalCount, // Use total count for consistency across the app
        submittedCount, // Also include submitted count for reference
        maxAllowed,
        canSubmitMore: totalCount < maxAllowed,
      },
      latestNomination: latestNomination
        ? {
            id: latestNomination.id,
            applicationNo: latestNomination.applicationNo,
            status: latestNomination.status.toLowerCase(),
            submittedAt: latestNomination.submittedAt?.toISOString() || "",
            wardName: latestNomination.ward.wardName,
            ulbName: latestNomination.ward.ulb.name,
            districtName: latestNomination.ward.ulb.district.name,
            reservation: latestNomination.ward.reservationType || "UR",
            brVerificationStatus:
              (
                latestNomination as any
              ).brPayments?.[0]?.status?.toLowerCase() || "pending",
            brNumber:
              (latestNomination as any).brPayments?.[0]?.brNumber || undefined,
            // Remove paymentStatus and paymentAmount as we're using BR verification now
          }
        : undefined,
      allNominations: nominations.map((n) => ({
        id: n.id,
        applicationNo: n.applicationNo,
        status: n.status.toLowerCase(),
        submissionNumber: n.submissionNumber,
        submittedAt: n.submittedAt?.toISOString() || "",
        wardName: n.ward.wardName,
      })),
      electionSchedule,
      daysRemaining,
    };

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error("Candidate dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard" },
      { status: 500 },
    );
  }
}

function formatDate(date: Date): string {
  return date
    .toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, ".");
}

function getDateStatus(date: Date): "completed" | "current" | "upcoming" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  if (targetDate < today) return "completed";
  if (targetDate.getTime() === today.getTime()) return "current";
  return "upcoming";
}

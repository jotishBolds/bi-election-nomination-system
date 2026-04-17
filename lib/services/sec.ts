// SEC (State Election Commission) Service
import "server-only";
import { db } from "@/lib/db";
import { loadJurisdictionDetails } from "./jurisdiction-helper";
import { Role, NominationStatus, ElectionPhase } from "@prisma/client";

interface DashboardFilters {
  stateId?: string;
  districtId?: string;
  ulbId?: string;
  status?: NominationStatus;
  fromDate?: Date;
  toDate?: Date;
}

// Get aggregated statistics for SEC dashboard
export async function getSECDashboardStats(
  userId: string,
  filters?: DashboardFilters,
) {
  // Verify user is SEC
  const userWithoutJurisdictions = await db.user.findUnique({
    where: { id: userId },
    include: {
      roles: true,
      jurisdictions: true, // No direct includes - will load separately
    },
  });

  if (!userWithoutJurisdictions) {
    throw new Error("User not found");
  }

  // Load jurisdiction details using helper
  const user = {
    ...userWithoutJurisdictions,
    jurisdictions: await loadJurisdictionDetails(userWithoutJurisdictions.jurisdictions),
  };

  if (!user || !user.roles.some((r) => r.role === Role.SES)) {
    throw new Error("User is not authorized as SEC");
  }

  // Build jurisdiction filter based on SEC's assigned areas
  // NominationApplication only has ulbId - district/state filtering must go through ulb relation
  const jurisdictionFilter: any = {};
  if (user.jurisdictions.length > 0) {
    const stateIds = user.jurisdictions
      .filter((j) => j.stateId)
      .map((j) => j.stateId);
    const districtIds = user.jurisdictions
      .filter((j) => j.districtId)
      .map((j) => j.districtId);
    const ulbIds = user.jurisdictions
      .filter((j) => j.ulbId)
      .map((j) => j.ulbId);

    if (ulbIds.length > 0 && !ulbIds.includes(null)) {
      jurisdictionFilter.ulbId = { in: ulbIds };
    } else if (districtIds.length > 0 && !districtIds.includes(null)) {
      jurisdictionFilter.ulb = { districtId: { in: districtIds } };
    } else if (stateIds.length > 0 && !stateIds.includes(null)) {
      jurisdictionFilter.ulb = { district: { stateId: { in: stateIds } } };
    }
  }

  // Apply additional filters
  const whereClause: any = { ...jurisdictionFilter };
  if (filters?.ulbId) whereClause.ulbId = filters.ulbId;
  if (filters?.districtId) {
    whereClause.ulb = { ...whereClause.ulb, districtId: filters.districtId };
  }
  if (filters?.stateId) {
    whereClause.ulb = {
      ...whereClause.ulb,
      district: { stateId: filters.stateId },
    };
  }
  if (filters?.status) whereClause.status = filters.status;
  if (filters?.fromDate || filters?.toDate) {
    whereClause.submittedAt = {};
    if (filters.fromDate) whereClause.submittedAt.gte = filters.fromDate;
    if (filters.toDate) whereClause.submittedAt.lte = filters.toDate;
  }

  // Get nomination counts by status
  const statusCounts = await db.nominationApplication.groupBy({
    by: ["status"],
    where: whereClause,
    _count: { status: true },
  });

  // Get nominations by ULB (we'll aggregate to district level from this)
  const ulbCounts = await db.nominationApplication.groupBy({
    by: ["ulbId"],
    where: whereClause,
    _count: { ulbId: true },
  });

  // Get ULB to district mapping
  const ulbs = await db.uLB.findMany({
    where: { id: { in: ulbCounts.map((u) => u.ulbId) } },
    select: { id: true, districtId: true },
  });
  const ulbToDistrict = new Map(ulbs.map((u) => [u.id, u.districtId]));

  // Aggregate to district level
  const districtCountMap = new Map<string, number>();
  for (const ulbCount of ulbCounts) {
    const districtId = ulbToDistrict.get(ulbCount.ulbId);
    if (districtId) {
      districtCountMap.set(
        districtId,
        (districtCountMap.get(districtId) || 0) + ulbCount._count.ulbId,
      );
    }
  }

  // Get nominations by category
  const categoryCounts = await db.nominationApplication.groupBy({
    by: ["category"],
    where: whereClause,
    _count: { category: true },
  });

  // Get total counts
  const totalNominations = await db.nominationApplication.count({
    where: whereClause,
  });

  const totalWards = await db.ward.count({
    where: jurisdictionFilter.ulbId
      ? { ulbId: jurisdictionFilter.ulbId }
      : undefined,
  });

  // Get district details
  const districts = await db.district.findMany({
    select: {
      id: true,
      name: true,
      code: true,
    },
  });

  // Map district IDs to names
  const districtMap = new Map(districts.map((d) => [d.id, d.name]));

  return {
    summary: {
      totalNominations,
      totalWards,
      byStatus: statusCounts.reduce(
        (acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        },
        {} as Record<string, number>,
      ),
    },
    byDistrict: Array.from(districtCountMap.entries()).map(
      ([districtId, count]) => ({
        districtId,
        districtName: districtMap.get(districtId) || "Unknown",
        count,
      }),
    ),
    byUlb: ulbCounts.map((item) => ({
      ulbId: item.ulbId,
      count: item._count.ulbId,
    })),
    byCategory: categoryCounts.reduce(
      (acc, item) => {
        acc[item.category] = item._count.category;
        return acc;
      },
      {} as Record<string, number>,
    ),
  };
}

// Get detailed nomination list for SEC
export async function getSECNominations(
  userId: string,
  options: {
    stateId?: string;
    districtId?: string;
    ulbId?: string;
    wardId?: string;
    status?: NominationStatus;
    page?: number;
    limit?: number;
  },
) {
  const {
    stateId,
    districtId,
    ulbId,
    wardId,
    status,
    page = 1,
    limit = 50,
  } = options;

  // Verify user is SEC
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { roles: true },
  });

  if (!user || !user.roles.some((r) => r.role === Role.SES)) {
    return { success: false, error: "User is not authorized as SEC" };
  }

  const whereClause: any = {};
  if (ulbId) whereClause.ulbId = ulbId;
  if (districtId) whereClause.ulb = { districtId };
  if (stateId) whereClause.ulb = { ...whereClause.ulb, district: { stateId } };
  if (wardId) whereClause.wardId = wardId;
  if (status) whereClause.status = status;

  const [nominations, total] = await Promise.all([
    db.nominationApplication.findMany({
      where: whereClause,
      include: {
        applicantProfile: {
          select: {
            category: true,
            voterRecord: {
              select: {
                name: true,
                fatherHusbandName: true,
                gender: true,
              },
            },
          },
        },
        ward: {
          select: {
            wardName: true,
            wardNo: true,
          },
        },
        ulb: {
          select: {
            name: true,
            type: true,
            district: {
              select: {
                name: true,
              },
            },
          },
        },
        politicalParty: {
          select: {
            name: true,
            abbreviation: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ ulbId: "asc" }, { wardId: "asc" }, { submittedAt: "desc" }],
    }),
    db.nominationApplication.count({ where: whereClause }),
  ]);

  return {
    success: true,
    nominations,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// Get ward-wise summary report
export async function getWardWiseSummary(ulbId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const wards = await db.ward.findMany({
      where: { ulbId, isActive: true },
      include: {
        nominations: {
          select: {
            id: true,
            status: true,
            category: true,
          },
        },
      },
      orderBy: { wardNo: "asc" },
    });

    const summary = wards.map((ward) => {
      const nominations = ward.nominations;
      return {
        wardId: ward.id,
        wardNumber: ward.wardNo,
        wardName: ward.wardName,
        reservationCategory: ward.reservationType,
        totalNominations: nominations.length,
        draft: nominations.filter((n) => n.status === NominationStatus.DRAFT)
          .length,
        submitted: nominations.filter(
          (n) => n.status === NominationStatus.SUBMITTED,
        ).length,
        received: nominations.filter(
          (n) => n.status === NominationStatus.RECEIVED,
        ).length,
        accepted: nominations.filter(
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
    });

    return { success: true, data: summary };
  } catch (error) {
    console.error("Get ward-wise summary error:", error);
    return { success: false, error: "Failed to get ward-wise summary" };
  }
}

// Get payment summary report
export async function getPaymentSummary(filters?: {
  stateId?: string;
  districtId?: string;
  ulbId?: string;
  fromDate?: Date;
  toDate?: Date;
}) {
  const whereClause: any = {
    status: "COMPLETED",
  };

  if (filters?.fromDate || filters?.toDate) {
    whereClause.completedAt = {};
    if (filters.fromDate) whereClause.completedAt.gte = filters.fromDate;
    if (filters.toDate) whereClause.completedAt.lte = filters.toDate;
  }

  // Join with nominations to filter by jurisdiction
  const nominationFilter: any = {};
  if (filters?.stateId) nominationFilter.stateId = filters.stateId;
  if (filters?.districtId) nominationFilter.districtId = filters.districtId;
  if (filters?.ulbId) nominationFilter.ulbId = filters.ulbId;

  if (Object.keys(nominationFilter).length > 0) {
    whereClause.nomination = nominationFilter;
  }

  const payments = await db.payment.aggregate({
    where: whereClause,
    _sum: { amount: true },
    _count: { id: true },
  });

  // Group by ULB
  const paymentsByUlb = await db.payment.groupBy({
    by: ["nominationId"],
    where: whereClause,
    _sum: { amount: true },
    _count: { id: true },
  });

  return {
    totalAmount: payments._sum.amount || 0,
    totalTransactions: payments._count.id,
    byUlb: paymentsByUlb,
  };
}

// Get election progress overview
export async function getElectionProgress() {
  // Get active election config
  const config = await db.electionConfig.findFirst({
    where: { isActive: true },
  });

  if (!config) {
    return { success: false, error: "No active election configuration" };
  }

  // Get day modules for this election
  const dayModules = await db.dayModuleConfig.findMany({
    where: { electionId: config.id },
    orderBy: { dayNumber: "asc" },
  });

  // Calculate current day and phase
  const now = new Date();
  const startDate = new Date(config.nominationStartDate);
  const daysDiff =
    Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) +
    1;

  // Get phase based on day
  let currentPhase = "NOT_STARTED";
  let currentDay = 0;

  if (now < startDate) {
    currentPhase = "NOT_STARTED";
  } else if (daysDiff <= 7) {
    currentPhase = "NOMINATION";
    currentDay = daysDiff;
  } else if (daysDiff === 8) {
    currentPhase = "SCRUTINY";
    currentDay = 8;
  } else if (daysDiff >= 9 && daysDiff <= 10) {
    currentPhase = "WITHDRAWAL";
    currentDay = daysDiff;
  } else {
    currentPhase = "COMPLETED";
    currentDay = daysDiff;
  }

  // Get totals
  const [
    totalNominations,
    totalSubmitted,
    totalReceived,
    totalAccepted,
    totalRejected,
    totalWithdrawn,
    totalContesting,
  ] = await Promise.all([
    db.nominationApplication.count(),
    db.nominationApplication.count({
      where: { status: NominationStatus.SUBMITTED },
    }),
    db.nominationApplication.count({
      where: { status: NominationStatus.RECEIVED },
    }),
    db.nominationApplication.count({
      where: { status: NominationStatus.ACCEPTED },
    }),
    db.nominationApplication.count({
      where: { status: NominationStatus.REJECTED },
    }),
    db.nominationApplication.count({
      where: { status: NominationStatus.WITHDRAWN },
    }),
    db.nominationApplication.count({
      where: { status: NominationStatus.CONTESTING },
    }),
  ]);

  return {
    success: true,
    config: {
      id: config.id,
      name: config.name,
      nominationStartDate: config.nominationStartDate,
      nominationEndDate: config.nominationEndDate,
      scrutinyDate: config.scrutinyDate,
      withdrawalStartDate: config.withdrawalStartDate,
      withdrawalEndDate: config.withdrawalEndDate,
    },
    progress: {
      currentPhase,
      currentDay,
      totalDays: 10,
    },
    statistics: {
      totalNominations,
      totalSubmitted,
      totalReceived,
      totalAccepted,
      totalRejected,
      totalWithdrawn,
      totalContesting,
    },
  };
}

// Get audit trail for SEC
export async function getAuditTrail(options: {
  userId?: string;
  action?: string;
  entityType?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}) {
  const {
    userId,
    action,
    entityType,
    fromDate,
    toDate,
    page = 1,
    limit = 100,
  } = options;

  const whereClause: any = {};
  if (userId) whereClause.userId = userId;
  if (action) whereClause.action = action;
  if (entityType) whereClause.entityType = entityType;
  if (fromDate || toDate) {
    whereClause.timestamp = {};
    if (fromDate) whereClause.timestamp.gte = fromDate;
    if (toDate) whereClause.timestamp.lte = toDate;
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.auditLog.count({ where: whereClause }),
  ]);

  return {
    success: true,
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

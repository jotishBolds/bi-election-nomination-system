// Dashboard Types for all roles

export interface ElectionScheduleItem {
  slNo: string;
  event: string;
  date: string;
  dateObj: Date;
  status: "completed" | "current" | "upcoming";
  highlight?: boolean;
}

export interface UserInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  applicationId?: string; // For candidates: MC2026-XXXX
  jurisdiction?: {
    state?: string;
    district?: string;
    ulb?: string;
    ward?: string;
  };
}

// Candidate Dashboard Types
export interface CandidateDashboardData {
  user: UserInfo;
  submissions: {
    count: number;
    maxAllowed: number;
    canSubmitMore: boolean;
  };
  latestNomination?: {
    id: string;
    applicationNo: string;
    status: string;
    submittedAt: string;
    wardName: string;
    ulbName: string;
    districtName: string;
    reservation: string;
    paymentStatus: string;
    paymentAmount?: number;
  };
  allNominations: Array<{
    id: string;
    applicationNo: string;
    status: string;
    submissionNumber: number;
    submittedAt: string;
    wardName: string;
  }>;
  electionSchedule: ElectionScheduleItem[];
  daysRemaining: number | null;
}

// RO Dashboard Types
export interface RODashboardData {
  user: UserInfo;
  jurisdiction: {
    district: string;
    ulb: string;
    wards: string[];
  };
  stats: {
    totalNominations: number;
    uniqueCandidates: number;
    pendingReceipt: number;
    pendingScrutiny: number;
    approved: number;
    rejected: number;
    withdrawn: number;
    contesting: number;
  };
  wardWiseStats: Array<{
    wardNo: number;
    wardName: string;
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }>;
  recentNominations: Array<{
    id: string;
    applicationNo: string;
    candidateName: string;
    wardName: string;
    status: string;
    submittedAt: string;
  }>;
  electionSchedule: ElectionScheduleItem[];
  daysRemaining: number | null;
  currentPhase: string;
}

// SEC Dashboard Types
export interface SECDashboardData {
  user: UserInfo;
  stats: {
    totalNominations: number;
    uniqueCandidates: number;
    totalWards: number;
    totalULBs: number;
    totalDistricts: number;
    byStatus: Record<string, number>;
  };
  districtWiseStats: Array<{
    districtId: string;
    districtName: string;
    totalNominations: number;
    approved: number;
    rejected: number;
    pending: number;
  }>;
  ulbWiseStats: Array<{
    ulbId: string;
    ulbName: string;
    districtName: string;
    totalNominations: number;
  }>;
  categoryWiseStats: Record<string, number>;
  electionSchedule: ElectionScheduleItem[];
  daysRemaining: number | null;
  currentPhase: string;
}

// Admin Dashboard Types
export interface AdminDashboardData {
  user: UserInfo;
  userStats: {
    total: number;
    byRole: Record<string, number>;
    activeToday: number;
  };
  systemHealth: {
    database: { status: "healthy" | "degraded" | "down"; latency: number };
    redis: { status: "healthy" | "degraded" | "down"; latency: number };
    storage: { status: "healthy" | "degraded" | "down"; usedPercent: number };
  };
  nominationStats: {
    total: number;
    byStatus: Record<string, number>;
  };
  recentUsers: Array<{
    id: string;
    name: string;
    email?: string;
    role: string;
    district?: string;
    status: string;
    lastLoginAt?: string;
  }>;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    userName?: string;
    createdAt: string;
  }>;
  electionConfig?: {
    name: string;
    year: number;
    currentPhase: string;
    nominationStartDate: string;
    nominationEndDate: string;
    scrutinyDate: string;
    withdrawalEndDate: string;
    isLocked: boolean;
  };
  electionSchedule: ElectionScheduleItem[];
  daysRemaining: number | null;
}

export interface DashboardApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

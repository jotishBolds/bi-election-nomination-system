// Service for storing and retrieving nomination form data

import { NominationFormData } from "@/types/nomination";

export type NominationStatus =
  | "draft"
  | "submitted"
  | "received"
  | "under_review"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "contesting"
  | "uncontesting";

export interface StoredNomination {
  id: string;
  formData: NominationFormData;
  submissionNumber: number; // 1, 2, or 3
  submittedAt: string;
  status: NominationStatus;
  paymentStatus: "pending" | "paid" | "failed";
  applicationId: string;
  candidateId: string;
  // Additional fields for tracking
  receivedAt?: string;
  scrutinyDate?: string;
  scrutinyResult?: "accepted" | "rejected";
  scrutinyRemarks?: string;
  withdrawnAt?: string;
  withdrawnReason?: string;
}

export interface NominationStorageData {
  candidateId: string;
  currentDraft: NominationFormData | null;
  submissions: StoredNomination[];
  maxSubmissions: number;
  lastUpdated: string;
}

const STORAGE_KEY = "nomination_storage_data";
const RO_NOMINATIONS_KEY = "ro_nominations_data";
const SES_NOMINATION_TREND_KEY = "ses_nomination_trend";

// Generate unique application ID
export function generateApplicationId(): string {
  return `NOM-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// Generate unique nomination ID
export function generateNominationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Get candidate's nomination data
export function getNominationStorageData(
  candidateId: string,
): NominationStorageData {
  if (typeof window === "undefined") return getDefaultStorageData(candidateId);

  const stored = localStorage.getItem(`${STORAGE_KEY}_${candidateId}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return getDefaultStorageData(candidateId);
    }
  }
  return getDefaultStorageData(candidateId);
}

function getDefaultStorageData(candidateId: string): NominationStorageData {
  return {
    candidateId,
    currentDraft: null,
    submissions: [],
    maxSubmissions: 3,
    lastUpdated: new Date().toISOString(),
  };
}

// Save nomination storage data
export function saveNominationStorageData(data: NominationStorageData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `${STORAGE_KEY}_${data.candidateId}`,
    JSON.stringify(data),
  );
}

// Save draft form data
export function saveDraftFormData(
  candidateId: string,
  formData: NominationFormData,
): void {
  const data = getNominationStorageData(candidateId);
  data.currentDraft = formData;
  data.lastUpdated = new Date().toISOString();
  saveNominationStorageData(data);
}

// Get draft form data
export function getDraftFormData(
  candidateId: string,
): NominationFormData | null {
  const data = getNominationStorageData(candidateId);
  return data.currentDraft;
}

// Submit a nomination (updates existing or creates new)
export function submitNomination(
  candidateId: string,
  formData: NominationFormData,
): StoredNomination | null {
  const data = getNominationStorageData(candidateId);

  if (data.submissions.length >= data.maxSubmissions) {
    return null; // Max submissions reached
  }

  // Get or generate application ID - use the same ID for all submissions of a candidate
  const existingApplicationId =
    data.submissions.length > 0
      ? data.submissions[0].applicationId
      : generateApplicationId();

  const nomination: StoredNomination = {
    id: generateNominationId(),
    formData,
    submissionNumber: data.submissions.length + 1,
    submittedAt: new Date().toISOString(),
    status: "submitted",
    paymentStatus: "paid",
    applicationId: existingApplicationId, // Use same application ID
    candidateId,
  };

  data.submissions.push(nomination);
  data.currentDraft = formData; // Keep as draft for future reference
  data.lastUpdated = new Date().toISOString();
  saveNominationStorageData(data);

  // Also save to RO nominations
  addToRONominations(nomination);

  // Track for SES trend
  trackNominationTrend();

  return nomination;
}

// Get submission count
export function getSubmissionCount(candidateId: string): number {
  const data = getNominationStorageData(candidateId);
  return data.submissions.length;
}

// Check if can submit more
export function canSubmitMore(candidateId: string): boolean {
  const data = getNominationStorageData(candidateId);
  return data.submissions.length < data.maxSubmissions;
}

// Get all submissions for a candidate
export function getCandidateSubmissions(
  candidateId: string,
): StoredNomination[] {
  const data = getNominationStorageData(candidateId);
  return data.submissions;
}

// Get the latest submission
export function getLatestSubmission(
  candidateId: string,
): StoredNomination | null {
  const data = getNominationStorageData(candidateId);
  return data.submissions.length > 0
    ? data.submissions[data.submissions.length - 1]
    : null;
}

// Reset all nomination data for a candidate
export function resetNominationData(candidateId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${STORAGE_KEY}_${candidateId}`);
}

// ==================== RO Nominations Storage ====================

export interface RONominationsData {
  nominations: StoredNomination[];
  lastUpdated: string;
}

// Get all nominations for RO view
export function getRONominations(): StoredNomination[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(RO_NOMINATIONS_KEY);
  if (stored) {
    try {
      const data: RONominationsData = JSON.parse(stored);
      return data.nominations;
    } catch {
      return [];
    }
  }
  return [];
}

// Add a nomination to RO list
export function addToRONominations(nomination: StoredNomination): void {
  if (typeof window === "undefined") return;

  const nominations = getRONominations();
  nominations.push(nomination);

  const data: RONominationsData = {
    nominations,
    lastUpdated: new Date().toISOString(),
  };

  localStorage.setItem(RO_NOMINATIONS_KEY, JSON.stringify(data));
}

// Get unique candidates count (candidates who completed all 3 submissions count as 1)
export function getUniqueCandidatesCount(): number {
  const nominations = getRONominations();
  const uniqueCandidates = new Set(nominations.map((n) => n.candidateId));
  return uniqueCandidates.size;
}

// Get total nominations count
export function getTotalNominationsCount(): number {
  return getRONominations().length;
}

// Get nominations grouped by candidate
export function getNominationsGroupedByCandidate(): Record<
  string,
  StoredNomination[]
> {
  const nominations = getRONominations();
  return nominations.reduce(
    (acc, nomination) => {
      if (!acc[nomination.candidateId]) {
        acc[nomination.candidateId] = [];
      }
      acc[nomination.candidateId].push(nomination);
      return acc;
    },
    {} as Record<string, StoredNomination[]>,
  );
}

// Get unique nominations (grouped by applicationId, showing only latest submission)
export function getUniqueNominations(): StoredNomination[] {
  const nominations = getRONominations();
  const groupedByApplicationId = nominations.reduce(
    (acc, nomination) => {
      const appId = nomination.applicationId;
      if (
        !acc[appId] ||
        nomination.submissionNumber > acc[appId].submissionNumber
      ) {
        acc[appId] = nomination;
      }
      return acc;
    },
    {} as Record<string, StoredNomination>,
  );

  return Object.values(groupedByApplicationId);
}

// Get unique candidate nominations for a specific candidate (latest submission only)
export function getUniqueCandidateNomination(
  candidateId: string,
): StoredNomination | null {
  const data = getNominationStorageData(candidateId);
  if (data.submissions.length === 0) return null;

  // Return the latest submission (highest submission number)
  return data.submissions.reduce((latest, current) =>
    current.submissionNumber > latest.submissionNumber ? current : latest,
  );
}

// Clear all RO nominations (for testing/reset)
export function clearRONominations(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RO_NOMINATIONS_KEY);
}

// Update nomination status
export function updateNominationStatus(
  nominationId: string,
  status: NominationStatus,
  additionalData?: Partial<StoredNomination>,
): boolean {
  if (typeof window === "undefined") return false;

  const nominations = getRONominations();
  const index = nominations.findIndex((n) => n.id === nominationId);

  if (index === -1) return false;

  nominations[index] = {
    ...nominations[index],
    status,
    ...additionalData,
  };

  const data: RONominationsData = {
    nominations,
    lastUpdated: new Date().toISOString(),
  };

  localStorage.setItem(RO_NOMINATIONS_KEY, JSON.stringify(data));

  // Also update the candidate's own storage
  updateCandidateNominationStatus(
    nominations[index].candidateId,
    nominationId,
    status,
    additionalData,
  );

  return true;
}

// Update status in candidate's storage
function updateCandidateNominationStatus(
  candidateId: string,
  nominationId: string,
  status: NominationStatus,
  additionalData?: Partial<StoredNomination>,
): void {
  if (typeof window === "undefined") return;

  const data = getNominationStorageData(candidateId);
  const index = data.submissions.findIndex((s) => s.id === nominationId);

  if (index !== -1) {
    data.submissions[index] = {
      ...data.submissions[index],
      status,
      ...additionalData,
    };
    data.lastUpdated = new Date().toISOString();
    saveNominationStorageData(data);
  }
}

// Get nominations by status
export function getNominationsByStatusFilter(
  status: NominationStatus | NominationStatus[],
): StoredNomination[] {
  const nominations = getRONominations();
  const statusArray = Array.isArray(status) ? status : [status];
  return nominations.filter((n) => statusArray.includes(n.status));
}

// Get nominations by ward
export function getNominationsByWardFilter(
  wardName: string,
): StoredNomination[] {
  const nominations = getRONominations();
  return nominations.filter((n) =>
    n.formData?.municipalWard?.includes(wardName),
  );
}

// Get received nominations (for scrutiny)
export function getReceivedNominations(): StoredNomination[] {
  return getNominationsByStatusFilter("received");
}

// Get accepted nominations (for withdraw and contest)
export function getAcceptedNominations(): StoredNomination[] {
  return getNominationsByStatusFilter("approved");
}

// Get withdrawn nominations
export function getWithdrawnNominations(): StoredNomination[] {
  return getNominationsByStatusFilter("withdrawn");
}

// Get contesting candidates (approved and not withdrawn)
export function getContestingCandidates(): StoredNomination[] {
  return getNominationsByStatusFilter("contesting");
}

// Get uncontesting candidates (wards with only one approved/contesting candidate = auto-elected)
export function getUncontestingCandidates(): StoredNomination[] {
  const nominations = getRONominations();
  // Get all approved/contesting nominations
  const eligibleNominations = nominations.filter(
    (n) =>
      n.status === "approved" ||
      n.status === "contesting" ||
      n.status === "uncontesting",
  );
  // Group by ward
  const byWard: Record<string, StoredNomination[]> = {};
  eligibleNominations.forEach((n) => {
    const ward = n.formData?.municipalWard || "Unknown";
    if (!byWard[ward]) byWard[ward] = [];
    byWard[ward].push(n);
  });
  // Find wards with only one candidate
  const uncontesting: StoredNomination[] = [];
  Object.values(byWard).forEach((wardNoms) => {
    if (wardNoms.length === 1) {
      uncontesting.push(wardNoms[0]);
    }
  });
  return uncontesting;
}

// Get all unique wards from nominations
export function getAllWardsFromNominations(): string[] {
  const nominations = getRONominations();
  const wards = new Set<string>();
  nominations.forEach((n) => {
    if (n.formData?.municipalWard) {
      wards.add(n.formData.municipalWard);
    }
  });
  return Array.from(wards).sort();
}

// ==================== SES (State Election Supervisor) Functions ====================

// Get all nominations state-wide for SES - uses existing RO nominations
export function getAllNominations(): StoredNomination[] {
  return getUniqueNominations();
}

// Get nominations grouped by status
export function getNominationsByStatus(): {
  submitted: number;
  under_review: number;
  approved: number;
  rejected: number;
} {
  const nominations = getRONominations();
  return {
    submitted: nominations.filter((n) => n.status === "submitted").length,
    under_review: nominations.filter((n) => n.status === "under_review").length,
    approved: nominations.filter((n) => n.status === "approved").length,
    rejected: nominations.filter((n) => n.status === "rejected").length,
  };
}

// Get nominations grouped by district
export function getNominationsByDistrict(): Record<string, StoredNomination[]> {
  const nominations = getRONominations();
  return nominations.reduce(
    (acc, nomination) => {
      const district =
        nomination.formData?.district ||
        nomination.formData?.municipality ||
        "Unknown";
      if (!acc[district]) {
        acc[district] = [];
      }
      acc[district].push(nomination);
      return acc;
    },
    {} as Record<string, StoredNomination[]>,
  );
}

// Get district-wise stats for SES
export function getDistrictWiseStats(): Array<{
  district: string;
  totalNominations: number;
  pending: number;
  approved: number;
  rejected: number;
  underReview: number;
}> {
  const byDistrict = getNominationsByDistrict();
  return Object.entries(byDistrict).map(([district, nominations]) => ({
    district,
    totalNominations: nominations.length,
    pending: nominations.filter((n) => n.status === "submitted").length,
    approved: nominations.filter((n) => n.status === "approved").length,
    rejected: nominations.filter((n) => n.status === "rejected").length,
    underReview: nominations.filter((n) => n.status === "under_review").length,
  }));
}

// Get RO performance stats
export function getROPerformanceStats(): Array<{
  district: string;
  processed: number;
  pending: number;
}> {
  const byDistrict = getNominationsByDistrict();
  return Object.entries(byDistrict).map(([district, nominations]) => ({
    district,
    processed: nominations.filter(
      (n) => n.status === "approved" || n.status === "rejected",
    ).length,
    pending: nominations.filter(
      (n) => n.status === "submitted" || n.status === "under_review",
    ).length,
  }));
}

// Track nomination trend (called when a nomination is submitted)
export function trackNominationTrend(): void {
  if (typeof window === "undefined") return;

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const existingData = localStorage.getItem(SES_NOMINATION_TREND_KEY);
  const trendData: Record<string, number> = existingData
    ? JSON.parse(existingData)
    : {};

  trendData[today] = (trendData[today] || 0) + 1;

  localStorage.setItem(SES_NOMINATION_TREND_KEY, JSON.stringify(trendData));
}

// Get nomination trend data for chart
export function getNominationTrend(): Array<{
  date: string;
  nominations: number;
}> {
  if (typeof window === "undefined") return [];

  const existingData = localStorage.getItem(SES_NOMINATION_TREND_KEY);
  if (!existingData) return [];

  const trendData: Record<string, number> = JSON.parse(existingData);
  return Object.entries(trendData)
    .map(([date, count]) => ({ date, nominations: count }))
    .slice(-7); // Last 7 days
}

// Get cumulative nomination trend (running total)
export function getCumulativeNominationTrend(): Array<{
  date: string;
  nominations: number;
}> {
  const trend = getNominationTrend();
  let cumulative = 0;
  return trend.map((item) => {
    cumulative += item.nominations;
    return { date: item.date, nominations: cumulative };
  });
}

// Get pending actions for SES
export function getPendingActions(): Array<{
  id: number;
  type: string;
  ro: string;
  district: string;
  count: number;
  priority: "high" | "medium" | "low";
}> {
  const byDistrict = getNominationsByDistrict();
  const actions: Array<{
    id: number;
    type: string;
    ro: string;
    district: string;
    count: number;
    priority: "high" | "medium" | "low";
  }> = [];

  let id = 1;

  Object.entries(byDistrict).forEach(([district, nominations]) => {
    const pendingApprovals = nominations.filter(
      (n) => n.status === "submitted",
    ).length;
    const underReview = nominations.filter(
      (n) => n.status === "under_review",
    ).length;

    if (pendingApprovals > 0) {
      actions.push({
        id: id++,
        type: "Nomination Approval",
        ro: `RO-${district.toUpperCase().slice(0, 3)}`,
        district,
        count: pendingApprovals,
        priority:
          pendingApprovals > 5
            ? "high"
            : pendingApprovals > 2
              ? "medium"
              : "low",
      });
    }

    if (underReview > 0) {
      actions.push({
        id: id++,
        type: "Document Verification",
        ro: `RO-${district.toUpperCase().slice(0, 3)}`,
        district,
        count: underReview,
        priority: underReview > 3 ? "high" : "medium",
      });
    }
  });

  return actions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// Get total pending actions count
export function getTotalPendingActionsCount(): number {
  const nominations = getRONominations();
  return nominations.filter(
    (n) => n.status === "submitted" || n.status === "under_review",
  ).length;
}

// Get nominations by ULB/Municipality
export function getNominationsByULB(): Record<string, StoredNomination[]> {
  const nominations = getRONominations();
  return nominations.reduce(
    (acc, nomination) => {
      const ulb = nomination.formData?.municipality || "Unknown";
      if (!acc[ulb]) {
        acc[ulb] = [];
      }
      acc[ulb].push(nomination);
      return acc;
    },
    {} as Record<string, StoredNomination[]>,
  );
}

// Get nominations by ward
export function getNominationsByWard(): Record<string, StoredNomination[]> {
  const nominations = getRONominations();
  return nominations.reduce(
    (acc, nomination) => {
      const ward = nomination.formData?.municipalWard || "Unknown";
      if (!acc[ward]) {
        acc[ward] = [];
      }
      acc[ward].push(nomination);
      return acc;
    },
    {} as Record<string, StoredNomination[]>,
  );
}

// Clear SES trend data (for testing/reset)
export function clearSESTrendData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SES_NOMINATION_TREND_KEY);
}

// Clear all data (for testing/reset)
export function clearAllData(): void {
  if (typeof window === "undefined") return;
  clearRONominations();
  clearSESTrendData();
}

// lib/nomination-storage.ts
// Service for storing and retrieving nomination form data

import { NominationFormData } from "@/types/nomination";

export interface StoredNomination {
  id: string;
  formData: NominationFormData;
  submissionNumber: number; // 1, 2, or 3
  submittedAt: string;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected";
  paymentStatus: "pending" | "paid" | "failed";
  applicationId: string;
  candidateId: string;
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
  if (typeof window === "undefined") {
    return getDefaultStorageData(candidateId);
  }

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

// Submit a nomination (adds to submissions array)
export function submitNomination(
  candidateId: string,
  formData: NominationFormData,
): StoredNomination | null {
  const data = getNominationStorageData(candidateId);

  if (data.submissions.length >= data.maxSubmissions) {
    return null; // Max submissions reached
  }

  const nomination: StoredNomination = {
    id: generateNominationId(),
    formData,
    submissionNumber: data.submissions.length + 1,
    submittedAt: new Date().toISOString(),
    status: "submitted",
    paymentStatus: "paid",
    applicationId: generateApplicationId(),
    candidateId,
  };

  data.submissions.push(nomination);
  data.currentDraft = formData; // Keep as draft for future reference
  data.lastUpdated = new Date().toISOString();
  saveNominationStorageData(data);

  // Also save to RO nominations
  addToRONominations(nomination);

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

// ========== RO Nominations Storage ==========

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

// Clear all RO nominations (for testing/reset)
export function clearRONominations(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RO_NOMINATIONS_KEY);
}

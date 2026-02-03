// Nomination types and API helper functions
// All data fetching should be done via API calls

import { NominationFormData } from "@/types/nomination";

export type NominationStatus =
  | "draft"
  | "submitted"
  | "received"
  | "under_review"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "contesting";

export interface StoredNomination {
  id: string;
  formData: NominationFormData;
  submissionNumber: number;
  submittedAt: string;
  status: NominationStatus;
  paymentStatus: "pending" | "paid" | "failed";
  applicationId: string;
  candidateId: string;
  receivedAt?: string;
  scrutinyDate?: string;
  scrutinyResult?: "accepted" | "rejected";
  scrutinyRemarks?: string;
  withdrawnAt?: string;
  withdrawnReason?: string;
}

// Generate unique application ID
export function generateApplicationId(): string {
  return `NOM-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// Generate unique nomination ID
export function generateNominationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// API-based functions - these should call the backend
// For now they return empty/default values - panels should use hooks/API calls

export async function fetchRONominations(): Promise<StoredNomination[]> {
  try {
    const response = await fetch("/api/ro/nominations");
    if (response.ok) {
      const data = await response.json();
      return data.nominations || [];
    }
  } catch (error) {
    console.error("Failed to fetch RO nominations:", error);
  }
  return [];
}

export async function fetchAllNominations(): Promise<StoredNomination[]> {
  try {
    const response = await fetch("/api/nominations/all");
    if (response.ok) {
      const data = await response.json();
      return data.nominations || [];
    }
  } catch (error) {
    console.error("Failed to fetch all nominations:", error);
  }
  return [];
}

// Sync stubs for backward compatibility - these will be replaced with hooks
export function getRONominations(): StoredNomination[] {
  console.warn("[nomination-storage] getRONominations is deprecated - use API");
  return [];
}

export function getUniqueNominations(): StoredNomination[] {
  console.warn(
    "[nomination-storage] getUniqueNominations is deprecated - use API",
  );
  return [];
}

export function getUniqueCandidatesCount(): number {
  console.warn(
    "[nomination-storage] getUniqueCandidatesCount is deprecated - use API",
  );
  return 0;
}

export function getTotalNominationsCount(): number {
  console.warn(
    "[nomination-storage] getTotalNominationsCount is deprecated - use API",
  );
  return 0;
}

export function getAllNominations(): StoredNomination[] {
  console.warn(
    "[nomination-storage] getAllNominations is deprecated - use API",
  );
  return [];
}

export function getNominationsByStatus(): {
  submitted: number;
  under_review: number;
  approved: number;
  rejected: number;
} {
  console.warn(
    "[nomination-storage] getNominationsByStatus is deprecated - use API",
  );
  return { submitted: 0, under_review: 0, approved: 0, rejected: 0 };
}

export function getDistrictWiseStats(): Array<{
  district: string;
  totalNominations: number;
  pending: number;
  approved: number;
  rejected: number;
  underReview: number;
}> {
  console.warn(
    "[nomination-storage] getDistrictWiseStats is deprecated - use API",
  );
  return [];
}

export function getTotalPendingActionsCount(): number {
  console.warn(
    "[nomination-storage] getTotalPendingActionsCount is deprecated - use API",
  );
  return 0;
}

export function getAllWardsFromNominations(): string[] {
  console.warn(
    "[nomination-storage] getAllWardsFromNominations is deprecated - use API",
  );
  return [];
}

export function updateNominationStatus(
  _nominationId: string,
  _status: NominationStatus,
  _additionalData?: Partial<StoredNomination>,
): boolean {
  console.warn(
    "[nomination-storage] updateNominationStatus is deprecated - use API",
  );
  return false;
}

export function getUniqueCandidateNomination(
  _candidateId: string,
): StoredNomination | null {
  console.warn(
    "[nomination-storage] getUniqueCandidateNomination is deprecated - use API",
  );
  return null;
}

// These are no longer needed - data is in database
export function clearRONominations(): void {
  // No-op - data is in database
}

export function clearAllData(): void {
  // No-op - data is in database
}

// app/context/nomination-submission-context.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { NominationFormData } from "@/types/nomination";
import { useSession } from "next-auth/react";

// Types for nomination
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

interface NominationSubmissionData {
  isSubmitted: boolean;
  submissionDate: string | null;
  status: NominationStatus;
  paymentStatus: "pending" | "paid" | "failed";
  applicationFee: number;
  district: string;
  ulb: string;
  wardNumber: string;
  wardName: string;
  reservation: string;
  constituency: string;
  submissionCount: number;
  maxSubmissions: number;
  applicationId: string | null;
  submissions: StoredNomination[];
  lockedPoliticalPartyId: string;
  lockedPartySymbol: string;
  lockedPartySymbolImage: string;
}

interface NominationSubmissionContextType {
  submissionData: NominationSubmissionData;
  submitNomination: (
    data: Partial<NominationSubmissionData>,
    formData: NominationFormData,
  ) => Promise<StoredNomination | null>;
  resetNomination: () => void;
  canSubmitMore: () => boolean;
  getDraftData: () => Promise<NominationFormData | null>;
  saveDraft: (formData: NominationFormData) => Promise<void>;
  candidateId: string | null;
  loadNominationData: () => Promise<void>;
}

const defaultSubmissionData: NominationSubmissionData = {
  isSubmitted: false,
  submissionDate: null,
  status: "draft",
  paymentStatus: "pending",
  applicationFee: 500,
  district: "",
  ulb: "",
  wardNumber: "",
  wardName: "",
  reservation: "",
  constituency: "",
  submissionCount: 0,
  maxSubmissions: 3,
  applicationId: null,
  submissions: [],
  lockedPoliticalPartyId: "",
  lockedPartySymbol: "",
  lockedPartySymbolImage: "",
};

const NominationSubmissionContext = createContext<
  NominationSubmissionContextType | undefined
>(undefined);

export function NominationSubmissionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { data: session } = useSession();
  const [submissionData, setSubmissionData] =
    useState<NominationSubmissionData>(defaultSubmissionData);

  const candidateId = session?.user?.id || null;

  // Load nomination data from API
  const loadNominationData = async () => {
    if (!candidateId) return;

    try {
      const response = await fetch(
        `/api/nominations?candidateId=${candidateId}`,
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.nominations) {
          const submissions = data.nominations;
          const latestSubmission = submissions[submissions.length - 1];
          const firstSubmission = submissions[0];

          setSubmissionData({
            isSubmitted: submissions.length > 0,
            submissionDate: latestSubmission?.submittedAt || null,
            status: latestSubmission?.status || "draft",
            paymentStatus: submissions.length > 0 ? "paid" : "pending",
            applicationFee: 500,
            district: latestSubmission?.formData?.district || "",
            ulb: latestSubmission?.formData?.ulb || "",
            wardNumber: latestSubmission?.formData?.municipalWard || "",
            wardName: latestSubmission?.formData?.wardName || "",
            reservation: latestSubmission?.formData?.reservation || "",
            constituency: latestSubmission?.formData?.constituency || "",
            submissionCount: submissions.length,
            maxSubmissions: 3,
            applicationId: latestSubmission?.applicationId || null,
            submissions,
            lockedPoliticalPartyId:
              firstSubmission?.formData?.politicalPartyId || "",
            lockedPartySymbol: firstSubmission?.formData?.partySymbol || "",
            lockedPartySymbolImage:
              firstSubmission?.formData?.partySymbolImage || "",
          });
        }
      }
    } catch (error) {
      console.error("Failed to load nomination data:", error);
    }
  };

  const submitNomination = async (
    _data: Partial<NominationSubmissionData>,
    formData: NominationFormData,
  ): Promise<StoredNomination | null> => {
    if (!candidateId) return null;

    try {
      const response = await fetch("/api/nominations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, formData }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await loadNominationData();
          return result.nomination;
        }
      }
      return null;
    } catch (error) {
      console.error("Failed to submit nomination:", error);
      return null;
    }
  };

  const resetNomination = () => {
    setSubmissionData(defaultSubmissionData);
  };

  const checkCanSubmitMore = (): boolean => {
    return submissionData.submissionCount < submissionData.maxSubmissions;
  };

  const getDraftData = async (): Promise<NominationFormData | null> => {
    if (!candidateId) return null;

    try {
      const response = await fetch(
        `/api/nominations/draft?candidateId=${candidateId}`,
      );
      if (response.ok) {
        const data = await response.json();
        return data.draft || null;
      }
      return null;
    } catch {
      return null;
    }
  };

  const saveDraft = async (formData: NominationFormData): Promise<void> => {
    if (!candidateId) return;

    try {
      await fetch("/api/nominations/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, formData }),
      });
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  };

  return (
    <NominationSubmissionContext.Provider
      value={{
        submissionData,
        submitNomination,
        resetNomination,
        canSubmitMore: checkCanSubmitMore,
        getDraftData,
        saveDraft,
        candidateId,
        loadNominationData,
      }}
    >
      {children}
    </NominationSubmissionContext.Provider>
  );
}

export const useNominationSubmission = () => {
  const context = useContext(NominationSubmissionContext);
  if (!context)
    throw new Error(
      "useNominationSubmission must be used within NominationSubmissionProvider",
    );
  return context;
};

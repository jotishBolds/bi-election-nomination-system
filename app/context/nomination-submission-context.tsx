// app/context/nomination-submission-context.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { NominationFormData } from "@/types/nomination";
import {
  getNominationStorageData,
  submitNomination as storeNomination,
  saveDraftFormData,
  getDraftFormData,
  getSubmissionCount,
  canSubmitMore,
  getCandidateSubmissions,
  getLatestSubmission,
  resetNominationData,
  StoredNomination,
  clearRONominations,
  NominationStatus,
} from "@/lib/nomination-storage";

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
  // New fields for multiple submissions
  submissionCount: number;
  maxSubmissions: number;
  applicationId: string | null;
  submissions: StoredNomination[];
  // Locked party data from first submission
  lockedPoliticalPartyId: string;
  lockedPartySymbol: string;
  lockedPartySymbolImage: string;
}

interface NominationSubmissionContextType {
  submissionData: NominationSubmissionData;
  submitNomination: (
    data: Partial<NominationSubmissionData>,
    formData: NominationFormData,
  ) => StoredNomination | null;
  resetNomination: () => void;
  canSubmitMore: () => boolean;
  getDraftData: () => NominationFormData | null;
  saveDraft: (formData: NominationFormData) => void;
  candidateId: string;
}

const CANDIDATE_ID = "MC2026-0142"; // This would come from auth in real app

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
  const [submissionData, setSubmissionData] =
    useState<NominationSubmissionData>(defaultSubmissionData);

  // Load data from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      loadStorageData();
    }
  }, []);

  const loadStorageData = () => {
    const storageData = getNominationStorageData(CANDIDATE_ID);
    const submissions = getCandidateSubmissions(CANDIDATE_ID);
    const latestSubmission = getLatestSubmission(CANDIDATE_ID);
    const firstSubmission = submissions.length > 0 ? submissions[0] : null;

    setSubmissionData({
      isSubmitted: submissions.length > 0,
      submissionDate: latestSubmission?.submittedAt || null,
      status: latestSubmission?.status || "draft",
      // Payment is considered "paid" after first submission
      paymentStatus: submissions.length > 0 ? "paid" : "pending",
      applicationFee: 500,
      district: latestSubmission?.formData.district || "",
      ulb: latestSubmission?.formData.ulb || "",
      wardNumber: latestSubmission?.formData.municipalWard || "",
      wardName: latestSubmission?.formData.wardName || "",
      reservation: latestSubmission?.formData.reservation || "",
      constituency: latestSubmission?.formData.constituency || "",
      submissionCount: submissions.length,
      maxSubmissions: 3,
      applicationId: latestSubmission?.applicationId || null,
      submissions,
      // Locked party data from first submission
      lockedPoliticalPartyId: firstSubmission?.formData.politicalPartyId || "",
      lockedPartySymbol: firstSubmission?.formData.partySymbol || "",
      lockedPartySymbolImage: firstSubmission?.formData.partySymbolImage || "",
    });
  };

  const submitNomination = (
    data: Partial<NominationSubmissionData>,
    formData: NominationFormData,
  ): StoredNomination | null => {
    const result = storeNomination(CANDIDATE_ID, formData);

    if (result) {
      loadStorageData(); // Reload all data after submission
    }

    return result;
  };

  const resetNomination = () => {
    resetNominationData(CANDIDATE_ID);
    clearRONominations(); // Clear RO data too for testing
    setSubmissionData(defaultSubmissionData);
  };

  const checkCanSubmitMore = (): boolean => {
    return canSubmitMore(CANDIDATE_ID);
  };

  const getDraftData = (): NominationFormData | null => {
    return getDraftFormData(CANDIDATE_ID);
  };

  const saveDraft = (formData: NominationFormData): void => {
    saveDraftFormData(CANDIDATE_ID, formData);
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
        candidateId: CANDIDATE_ID,
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

// app/context/nomination-submission-context.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { NominationFormData } from "@/types/nomination";
import { useSession } from "next-auth/react";

// Helper function to transform database nomination to formData format
function transformNominationToFormData(nomination: any): NominationFormData {
  return {
    districtId: nomination.ward?.ulb?.district?.id || "",
    district: nomination.ward?.ulb?.district?.name || "",
    ulbId: nomination.ulbId || "",
    ulb: nomination.ward?.ulb?.name || "",
    municipality: nomination.ward?.ulb?.name || "",
    wardId: nomination.wardId || "",
    municipalWard: nomination.ward?.wardNo?.toString() || "",
    wardName: nomination.ward?.wardName || "",
    constituency: nomination.ward?.constituency?.name || "",
    reservation: nomination.ward?.reservationType || "",
    candidateName: nomination.candidateName || "",
    fatherOrHusbandName: nomination.fatherHusbandName || "",
    fullPostalAddress: nomination.address || "",
    sameAsPostalAddress: false,
    correspondingAddress: nomination.address || "",
    serialNoCandidate: nomination.voterSerialNo || "",
    partNoCandidate: nomination.voterPartNo || "",
    category: (nomination.category?.toLowerCase() || "general") as any,
    casteTribeName: nomination.casteTribeName || "",
    casteCertificateFile: "",
    casteCertificateUrl:
      nomination.documents?.find((d: any) => d.type === "CASTE_CERTIFICATE")
        ?.storagePath || "",
    affidavitFile: "",
    affidavitUrl:
      nomination.documents?.find((d: any) => d.type === "AFFIDAVIT")
        ?.storagePath || "",
    addressProofFile: "",
    addressProofUrl:
      nomination.documents?.find((d: any) => d.type === "RESIDENCE_PROOF")
        ?.storagePath || "",
    epicNumber: nomination.applicantProfile?.epicNo || "",
    gender: (nomination.gender || "") as any,
    proposerName: nomination.proposers?.[0]?.name || "",
    proposerSerialNo:
      nomination.proposers?.[0]?.voterSerialNo ||
      nomination.proposers?.[0]?.serialNo ||
      "",
    proposerPartNo:
      nomination.proposers?.[0]?.voterPartNo ||
      nomination.proposers?.[0]?.partNo ||
      "",
    dateOfBirth: nomination.dateOfBirth
      ? new Date(nomination.dateOfBirth).toISOString().split("T")[0]
      : "",
    age: nomination.age?.toString() || "",
    politicalPartyId:
      nomination.politicalPartyId ||
      (nomination.isIndependent ? "independent" : ""),
    politicalParty:
      nomination.politicalParty?.name ||
      (nomination.isIndependent ? "Independent" : ""),
    partySymbol:
      nomination.politicalParty?.symbol?.name ||
      nomination.allocatedSymbol?.name ||
      "",
    partySymbolImage:
      nomination.politicalParty?.symbol?.imagePath ||
      nomination.allocatedSymbol?.imagePath ||
      "",
    symbolPreference1: nomination.symbolPreferences?.[0]?.symbolId || "",
    symbolPreference2: nomination.symbolPreferences?.[1]?.symbolId || "",
    symbolPreference3: nomination.symbolPreferences?.[2]?.symbolId || "",
    shuffleCount: 0,
    shuffledSymbols: [],
  };
}

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
    brData?: { brNumber: string; proofUrl: string; proofPublicId: string },
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

  // Load nomination data when candidate ID becomes available
  useEffect(() => {
    if (candidateId) {
      loadNominationData();
    }
  }, [candidateId]);

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
          const rawSubmissions = data.nominations;

          // Transform each submission to include formData
          const submissions = rawSubmissions.map((nom: any) => ({
            ...nom,
            formData: transformNominationToFormData(nom),
          }));

          const latestSubmission = submissions[submissions.length - 1];
          const firstSubmission = submissions[0];
          const submittedCount = submissions.filter(
            (s: any) => s.status !== "DRAFT",
          ).length;

          // Get formData from the latest submission
          const latestFormData = latestSubmission?.formData;
          const firstFormData = firstSubmission?.formData;

          console.log("Loaded nominations with transformed formData:", {
            count: submissions.length,
            latestFormData: latestFormData?.candidateName,
          });

          setSubmissionData({
            isSubmitted: submissions.length > 0,
            submissionDate: latestSubmission?.submittedAt || null,
            status: latestSubmission?.status || "draft",
            paymentStatus: submittedCount > 0 ? "paid" : "pending",
            applicationFee: 500,
            district: latestFormData?.district || "",
            ulb: latestFormData?.ulb || "",
            wardNumber: latestFormData?.municipalWard || "",
            wardName: latestFormData?.wardName || "",
            reservation: latestFormData?.reservation || "",
            constituency: latestFormData?.constituency || "",
            submissionCount: submissions.length, // Use total count for consistency
            maxSubmissions: 3,
            applicationId: latestSubmission?.applicationNo || null,
            submissions,
            lockedPoliticalPartyId: firstFormData?.politicalPartyId || "",
            lockedPartySymbol: firstFormData?.partySymbol || "",
            lockedPartySymbolImage: firstFormData?.partySymbolImage || "",
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
    brData?: { brNumber: string; proofUrl: string; proofPublicId: string },
  ): Promise<StoredNomination | null> => {
    if (!candidateId) return null;

    try {
      // Use BR payment data passed directly from the payment page
      const brNumber = brData?.brNumber || null;
      const brProofUrl = brData?.proofUrl || null;
      const brProofPublicId = brData?.proofPublicId || null;

      // Check if this is an update (2nd or 3rd submission) vs new nomination (1st submission)
      const isUpdate = submissionData.submissionCount > 0;
      const existingNomination =
        submissionData.submissions?.[submissionData.submissions.length - 1];

      let nominationId: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let createdNomination: any = null;

      if (isUpdate && existingNomination) {
        // Step 1: Update existing nomination
        const updateResponse = await fetch(
          `/api/nominations/${existingNomination.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              candidateId,
              formData,
              // Only include BR data if it's provided (for fresh uploads)
              ...(brData && { brNumber, brProofUrl, brProofPublicId }),
              isUpdate: true,
              submissionNumber: submissionData.submissionCount + 1,
            }),
          },
        );

        const updateResult = await updateResponse.json();

        if (!updateResponse.ok || !updateResult.success) {
          console.error("Failed to update nomination:", updateResult.error);
          return null;
        }

        nominationId = existingNomination.id;
      } else {
        // Step 1: Create new nomination draft (1st submission)
        const createResponse = await fetch("/api/nominations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId,
            formData,
            brNumber,
            brProofUrl,
            brProofPublicId,
            isUpdate: false,
            submissionNumber: 1,
          }),
        });

        const createResult = await createResponse.json();

        if (!createResponse.ok || !createResult.success) {
          console.error("Failed to create nomination:", createResult.error);
          return null;
        }

        nominationId = createResult.nomination?.id;
        createdNomination = createResult.nomination;
        if (!nominationId) {
          console.error("No nomination ID returned");
          return null;
        }
      }

      // Step 2: Submit the nomination (change status from DRAFT to SUBMITTED)
      const submitResponse = await fetch(`/api/nominations/${nominationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          submissionNumber: isUpdate ? submissionData.submissionCount + 1 : 1,
        }),
      });

      const submitResult = await submitResponse.json();

      if (!submitResponse.ok || !submitResult.success) {
        // If submit fails (e.g. missing proposers/payment), the draft is still created/updated
        console.warn(
          isUpdate
            ? "Nomination updated but submission failed:"
            : "Nomination created as draft but submission failed:",
          submitResult.error,
        );
        // Still reload data and return result so the user sees success
        await loadNominationData();
        return isUpdate ? existingNomination : createdNomination || null;
      }

      await loadNominationData();
      return (
        submitResult.nomination ||
        (isUpdate ? existingNomination : createdNomination) ||
        null
      );
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
      // For 2nd/3rd submissions, load the latest submitted nomination data
      if (
        submissionData.submissionCount > 0 &&
        submissionData.submissions.length > 0
      ) {
        const latestSubmission =
          submissionData.submissions[submissionData.submissions.length - 1];
        console.log("Loading previous submission data for update:", {
          submissionCount: submissionData.submissionCount,
          latestSubmission: latestSubmission?.id,
          hasFormData: !!latestSubmission?.formData,
        });
        if (latestSubmission?.formData) {
          return latestSubmission.formData;
        }
      }

      // For first submission, try to get any draft data
      const response = await fetch(
        `/api/nominations/draft?candidateId=${candidateId}`,
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Loading draft data for new submission:", !!data.draft);
        return data.draft || null;
      }
      return null;
    } catch (error) {
      console.error("Error loading draft data:", error);
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

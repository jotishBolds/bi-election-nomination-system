// app/context/nomination-submission-context.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface NominationSubmissionData {
  isSubmitted: boolean;
  submissionDate: string | null;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected";
  paymentStatus: "pending" | "paid" | "failed";
  applicationFee: number;
  district: string;
  ulb: string;
  wardNumber: string;
  wardName: string;
  reservation: string;
  constituency: string;
}

interface NominationSubmissionContextType {
  submissionData: NominationSubmissionData;
  submitNomination: (data: Partial<NominationSubmissionData>) => void;
  resetNomination: () => void;
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
      const stored = localStorage.getItem("nomination_submission_data");
      if (stored) {
        try {
          const parsedData = JSON.parse(stored);
          setSubmissionData(parsedData);
        } catch (error) {
          console.error("Error parsing stored nomination data:", error);
        }
      }
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "nomination_submission_data",
        JSON.stringify(submissionData),
      );
    }
  }, [submissionData]);

  const submitNomination = (data: Partial<NominationSubmissionData>) => {
    setSubmissionData((prev) => ({
      ...prev,
      ...data,
      isSubmitted: true,
      submissionDate: new Date().toISOString(),
      status: "submitted",
      paymentStatus: "paid",
    }));
  };

  const resetNomination = () => {
    setSubmissionData(defaultSubmissionData);
    if (typeof window !== "undefined") {
      localStorage.removeItem("nomination_submission_data");
    }
  };

  return (
    <NominationSubmissionContext.Provider
      value={{
        submissionData,
        submitNomination,
        resetNomination,
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

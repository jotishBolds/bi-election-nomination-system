// components/nomination/nomination-flow.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";

import { StartPage } from "./start-page";
import { ConsentPage } from "./consent-page";
import { StepBasicInfo } from "./form-steps/step-basic-info";
import { StepProposerInfo } from "./form-steps/step-proposer-info";
import { StepDeclaration } from "./form-steps/step-declaration";
import { FormPreview } from "./form-preview";
import { PaymentPage, BRPaymentData } from "./payment-page";
import { SuccessPage } from "./success-page";
import { ProgressTracker } from "./progress-tracker";
import { Card, CardContent } from "@/components/ui/card";
import {
  NominationProvider,
  useNomination,
} from "@/app/context/nomination-context";
import { useNominationSubmission } from "@/app/context/nomination-submission-context";
import { Loader2 } from "lucide-react";

type FlowStep =
  | "start"
  | "consent"
  | "form"
  | "preview"
  | "payment"
  | "success";

const formSteps = ["Applicant Info", "Proposer", "Declaration"];

function NominationFlowContent() {
  const searchParams = useSearchParams();
  const isUpdate = searchParams.get("update") === "true";
  const submissionNumber = parseInt(searchParams.get("submission") || "1");

  const [flowStep, setFlowStep] = useState<FlowStep>(
    isUpdate ? "form" : "start",
  );
  const { currentStep, setCurrentStep, formData, updateFormData } =
    useNomination();
  const {
    submitNomination,
    canSubmitMore,
    getDraftData,
    saveDraft,
    submissionData,
  } = useNominationSubmission();

  // Load previous form data when entering the form flow
  useEffect(() => {
    async function loadDraft() {
      if (flowStep === "consent" || flowStep === "form") {
        const draftData = await getDraftData();
        if (draftData) {
          // Populate form with previous data
          updateFormData(draftData);
        }
      }
    }
    loadDraft();
  }, [flowStep, getDraftData, updateFormData]);

  // For updates, load data immediately on mount - wait for submission data to be loaded first
  useEffect(() => {
    if (isUpdate && submissionData.submissionCount > 0) {
      async function loadUpdateData() {
        const draftData = await getDraftData();
        if (draftData) {
          console.log("Loading update data:", draftData);
          updateFormData(draftData);
        }
      }
      loadUpdateData();
    }
  }, [isUpdate, submissionData.submissionCount, getDraftData, updateFormData]);

  // Save form data as draft whenever it changes
  useEffect(() => {
    if (flowStep === "form" || flowStep === "preview") {
      saveDraft(formData);
    }
  }, [formData, flowStep, saveDraft]);

  const handleFormNext = () => {
    // Save current form data as draft
    saveDraft(formData);

    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      setFlowStep("preview");
    }
  };

  const handlePreviewNext = () => {
    // All submissions go through payment/verification page
    // The PaymentPage component handles whether to show BR upload (1st) or just OTP (2nd/3rd)
    setFlowStep("payment");
  };

  const handleFormBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      setFlowStep("consent");
    }
  };

  const handlePaymentSuccess = async (brData?: BRPaymentData) => {
    // Submit nomination data with full form data to the submission context
    const result = await submitNomination(
      {
        district: formData.district || "GANGTOK",
        ulb: formData.ulb || "Gangtok MC",
        wardNumber: formData.municipalWard || "Ward 2",
        wardName: formData.wardName || "Upper Burtuk",
        reservation: formData.reservation || "UR (General)",
        constituency: formData.constituency || "28-Upper Burtuk",
      },
      formData,
      brData,
    );

    if (result) {
      setFlowStep("success");
    }
  };

  // Check if user can apply
  const handleApplyClick = () => {
    if (!canSubmitMore()) {
      // If max submissions reached, don't proceed
      return;
    }
    // For new submissions (1/3), show consent page first
    // For updates (2/3, 3/3), skip directly to form since consent already given
    setFlowStep(submissionData.submissionCount === 0 ? "consent" : "form");
  };

  return (
    <AnimatePresence mode="wait">
      {flowStep === "start" && <StartPage onApplyClick={handleApplyClick} />}

      {flowStep === "consent" && (
        <ConsentPage
          onAccept={() => setFlowStep("form")}
          onBack={() => setFlowStep("start")}
        />
      )}

      {flowStep === "form" && (
        <motion.div
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gradient-to-br from-primary-light to-white p-4 md:p-8"
        >
          <div className="max-w-4xl mx-auto space-y-2">
            {/* Form Header with Submission Number */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
              <h1 className="text-xl font-bold text-center text-primary">
                {isUpdate
                  ? `Update Nomination Form (${submissionNumber}/${submissionData.maxSubmissions})`
                  : `New Nomination Form (1/${submissionData.maxSubmissions})`}
              </h1>
              <p className="text-sm text-center text-muted-foreground mt-1">
                {isUpdate
                  ? "Update your existing nomination with new information"
                  : "Fill in all required details to submit your nomination"}
              </p>
            </div>

            {/* Progress Tracker */}
            <ProgressTracker steps={formSteps} currentStep={currentStep} />

            <AnimatePresence mode="wait">
              {currentStep === 0 && <StepBasicInfo onNext={handleFormNext} />}
              {currentStep === 1 && (
                <StepProposerInfo
                  onNext={handleFormNext}
                  onBack={handleFormBack}
                />
              )}
              {currentStep === 2 && (
                <StepDeclaration
                  onNext={handleFormNext}
                  onBack={handleFormBack}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {flowStep === "preview" && (
        <motion.div
          key="preview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gradient-to-br from-primary-light to-white p-4 md:p-8"
        >
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
              <h1 className="text-xl font-bold text-center text-primary">
                {isUpdate
                  ? `Preview Nomination Update (${submissionNumber}/${submissionData.maxSubmissions})`
                  : `Preview New Nomination (1/${submissionData.maxSubmissions})`}
              </h1>
              <p className="text-sm text-center text-muted-foreground mt-1">
                Review your nomination details before proceeding
              </p>
            </div>
            <FormPreview
              onProceedToPayment={handlePreviewNext}
              onBack={() => {
                setCurrentStep(2);
                setFlowStep("form");
              }}
            />
          </div>
        </motion.div>
      )}

      {flowStep === "payment" && (
        <motion.div
          key="payment"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gradient-to-br from-primary-light to-white p-4 md:p-8"
        >
          <PaymentPage
            onPaymentSuccess={handlePaymentSuccess}
            onBack={() => setFlowStep("preview")}
            isFirstSubmission={
              !isUpdate && submissionData.submissionCount === 0
            }
            currentSubmissionNumber={isUpdate ? submissionNumber : 1}
            maxSubmissions={submissionData.maxSubmissions}
          />
        </motion.div>
      )}

      {flowStep === "success" && (
        <SuccessPage onGoHome={() => setFlowStep("start")} />
      )}
    </AnimatePresence>
  );
}

function NominationFlowLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading nomination form...</p>
      </div>
    </div>
  );
}

export function NominationFlow() {
  return (
    <NominationProvider>
      <Suspense fallback={<NominationFlowLoading />}>
        <NominationFlowContent />
      </Suspense>
    </NominationProvider>
  );
}

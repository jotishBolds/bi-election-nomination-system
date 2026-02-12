// components/nomination/nomination-flow.tsx
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
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
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  NominationProvider,
  useNomination,
} from "@/app/context/nomination-context";
import { useNominationSubmission } from "@/app/context/nomination-submission-context";
import { Loader2, AlertTriangle, ShieldAlert, Lock } from "lucide-react";
import Link from "next/link";

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

  // Ref to prevent duplicate data loading
  const dataLoadedRef = useRef(false);
  const draftLoadedRef = useRef(false);

  // Determine if form should be locked based on nomination status
  const latestStatus =
    submissionData.submissions?.[submissionData.submissions.length - 1]?.status;
  const isFormLocked =
    isUpdate &&
    latestStatus &&
    [
      "ACCEPTED",
      "APPROVED",
      "REJECTED",
      "WITHDRAWN",
      "CONTESTING",
      "ELECTED_UNOPPOSED",
    ].includes(
      typeof latestStatus === "string" ? latestStatus.toUpperCase() : "",
    );

  // Check if max submissions (3/3) reached
  const isMaxSubmissionsReached =
    submissionData.submissionCount >= submissionData.maxSubmissions;

  // Single consolidated data loading effect for UPDATES
  // Only runs once when submission data is available
  useEffect(() => {
    if (!isUpdate) return;
    if (dataLoadedRef.current) return;
    if (submissionData.submissionCount === 0) return; // Wait for data to load

    dataLoadedRef.current = true;

    async function loadUpdateData() {
      try {
        const draftData = await getDraftData();
        if (draftData) {
          updateFormData(draftData);
        }
      } catch (error) {
        console.error("Failed to load update data:", error);
      }
    }
    loadUpdateData();
  }, [isUpdate, submissionData.submissionCount, getDraftData, updateFormData]);

  // Data loading effect for NEW submissions (draft)
  // Only loads when entering consent or form step for first time
  useEffect(() => {
    if (isUpdate) return;
    if (draftLoadedRef.current) return;
    if (flowStep !== "consent" && flowStep !== "form") return;

    draftLoadedRef.current = true;

    async function loadDraft() {
      try {
        const draftData = await getDraftData();
        if (draftData) {
          updateFormData(draftData);
        }
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
    }
    loadDraft();
  }, [flowStep, isUpdate, getDraftData, updateFormData]);

  // Save form data as draft (only for new submissions, not updates)
  useEffect(() => {
    if (isUpdate) return;
    if (flowStep === "form" || flowStep === "preview") {
      saveDraft(formData);
    }
  }, [formData, flowStep, saveDraft, isUpdate]);

  const handleFormNext = () => {
    if (!isUpdate) {
      saveDraft(formData);
    }

    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      setFlowStep("preview");
    }
  };

  const handlePreviewNext = () => {
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

  const handleApplyClick = () => {
    if (!canSubmitMore()) {
      return;
    }
    setFlowStep(submissionData.submissionCount === 0 ? "consent" : "form");
  };

  // ---- Render locked/blocked states ----

  // Block if max submissions reached (3/3) - for both update and fresh navigation
  if (isMaxSubmissionsReached) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-white p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                <ShieldAlert className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                Form Limit Over
              </h2>
              <p className="text-slate-600">
                You have already submitted {submissionData.submissionCount}/
                {submissionData.maxSubmissions} nominations. You cannot submit
                any further nominations online.
              </p>
              <Alert className="bg-amber-50 border-amber-200 text-left">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">
                  Visit the Returning Officer (RO) Offline
                </AlertTitle>
                <AlertDescription className="text-amber-700">
                  To make any changes or corrections to your nomination, please
                  visit the RO in person at the designated election office with
                  your original documents.
                </AlertDescription>
              </Alert>
              <Link href="/dashboard">
                <Button variant="outline">Return to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Block if form is locked (scrutiny passed, withdrawn, etc.)
  if (isFormLocked) {
    const statusLabel =
      typeof latestStatus === "string"
        ? latestStatus.toUpperCase().replace("_", " ")
        : "PROCESSED";
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-white p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <Lock className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                Nomination Form Locked
              </h2>
              <p className="text-slate-600">
                Your nomination has been <strong>{statusLabel}</strong>. The
                form can no longer be edited online.
              </p>
              <Alert className="bg-blue-50 border-blue-200 text-left">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">
                  What to do next
                </AlertTitle>
                <AlertDescription className="text-blue-700">
                  If you need to make any changes, please contact the Returning
                  Officer (RO) at the designated election office.
                </AlertDescription>
              </Alert>
              <Link href="/dashboard">
                <Button variant="outline">Return to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                  ? `Update Nomination Form (${submissionData.submissionCount + 1}/${submissionData.maxSubmissions})`
                  : `New Nomination Form (${Math.max(1, submissionData.submissionCount + 1)}/${submissionData.maxSubmissions})`}
              </h1>
              <p className="text-sm text-center text-muted-foreground mt-1">
                {isUpdate
                  ? `Updating submission ${submissionData.submissionCount + 1} - Enter updated information`
                  : "Fill in all required details to submit your nomination"}
              </p>

              {/* Submission Progress Indicator */}
              <div className="flex justify-center mt-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full">
                  <span className="text-xs font-medium text-primary">
                    Nomination Progress:{" "}
                    {Math.max(
                      1,
                      submissionData.submissionCount + (isUpdate ? 1 : 0),
                    )}
                    /3
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((num) => (
                      <div
                        key={num}
                        className={`w-2 h-2 rounded-full ${
                          num <=
                          Math.max(
                            1,
                            submissionData.submissionCount + (isUpdate ? 1 : 0),
                          )
                            ? "bg-primary"
                            : "bg-primary/20"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Progress Tracker */}
            <ProgressTracker steps={formSteps} currentStep={currentStep} />

            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <StepBasicInfo onNext={handleFormNext} isUpdate={isUpdate} />
              )}
              {currentStep === 1 && (
                <StepProposerInfo
                  onNext={handleFormNext}
                  onBack={handleFormBack}
                  isUpdate={isUpdate}
                />
              )}
              {currentStep === 2 && (
                <StepDeclaration
                  onNext={handleFormNext}
                  onBack={handleFormBack}
                  isUpdate={isUpdate}
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

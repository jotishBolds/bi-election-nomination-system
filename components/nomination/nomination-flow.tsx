// components/nomination/nomination-flow.tsx
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { StartPage } from "./start-page";
import { ConsentPage } from "./consent-page";
import { StepBasicInfo } from "./form-steps/step-basic-info";
import { StepProposerInfo } from "./form-steps/step-proposer-info";
import { StepDeclaration } from "./form-steps/step-declaration";
import { FormPreview } from "./form-preview";
import { PaymentPage } from "./payment-page";
import { SuccessPage } from "./success-page";
import { ProgressTracker } from "./progress-tracker";
import { Card, CardContent } from "@/components/ui/card";
import {
  NominationProvider,
  useNomination,
} from "@/app/context/nomination-context";
import { useNominationSubmission } from "@/app/context/nomination-submission-context";

type FlowStep =
  | "start"
  | "consent"
  | "form"
  | "preview"
  | "payment"
  | "success";

const formSteps = ["Basic Info", "Proposer", "Declaration"];

function NominationFlowContent() {
  const [flowStep, setFlowStep] = useState<FlowStep>("start");
  const { currentStep, setCurrentStep, formData } = useNomination();
  const { submitNomination } = useNominationSubmission();

  const handleFormNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      setFlowStep("preview");
    }
  };

  const handleFormBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      setFlowStep("consent");
    }
  };

  const handlePaymentSuccess = () => {
    // Submit nomination data to the submission context
    submitNomination({
      district: formData.district || "GANGTOK",
      ulb: formData.ulb || "Gangtok MC",
      wardNumber: formData.municipalWard || "Ward 2",
      wardName: formData.wardName || "Upper Burtuk",
      reservation: formData.reservation || "UR (General)",
      constituency: formData.constituency || "28-Upper Burtuk",
    });
    setFlowStep("success");
  };

  return (
    <AnimatePresence mode="wait">
      {flowStep === "start" && (
        <StartPage onApplyClick={() => setFlowStep("consent")} />
      )}

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
          <div className="max-w-4xl mx-auto space-y-6">
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
            <FormPreview
              onProceedToPayment={() => setFlowStep("payment")}
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
          />
        </motion.div>
      )}

      {flowStep === "success" && (
        <SuccessPage onGoHome={() => setFlowStep("start")} />
      )}
    </AnimatePresence>
  );
}

export function NominationFlow() {
  return (
    <NominationProvider>
      <NominationFlowContent />
    </NominationProvider>
  );
}

// context/nomination-context.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { NominationFormData, NominationContextType } from "@/types/nomination";

const initialFormData: NominationFormData = {
  district: "",
  ulb: "",
  municipality: "",
  municipalWard: "",
  wardName: "",
  constituency: "",
  reservation: "",
  candidateName: "",
  fatherOrHusbandName: "",
  fullPostalAddress: "",
  serialNoCandidate: "",
  partNoCandidate: "",
  proposerName: "",
  proposerSerialNo: "",
  proposerPartNo: "",
  dateOfBirth: "",
  age: "",
  politicalPartyId: "",
  politicalParty: "",
  partySymbol: "",
  partySymbolImage: "",
  symbolPreference1: "",
  symbolPreference2: "",
  symbolPreference3: "",
  shuffleCount: 0,
  category: "general",
  casteTribeName: "",
};

const NominationContext = createContext<NominationContextType | undefined>(
  undefined,
);

export function NominationProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<NominationFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const updateFormData = (data: Partial<NominationFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  return (
    <NominationContext.Provider
      value={{
        formData,
        updateFormData,
        currentStep,
        setCurrentStep,
        consentAccepted,
        setConsentAccepted,
      }}
    >
      {children}
    </NominationContext.Provider>
  );
}

export const useNomination = () => {
  const context = useContext(NominationContext);
  if (!context)
    throw new Error("useNomination must be used within NominationProvider");
  return context;
};

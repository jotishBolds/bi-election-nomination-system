// types/nomination.ts
export interface NominationFormData {
  // Step 1: Basic Info
  municipality: string;
  municipalWard: string;
  candidateName: string;
  fatherOrHusbandName: string;
  fullPostalAddress: string;
  serialNoCandidate: string;
  partNoCandidate: string;

  // Step 2: Proposer Details
  proposerName: string;
  proposerSerialNo: string;
  proposerPartNo: string;

  // Step 3: Candidate Declaration
  age: string;
  politicalParty: string;
  symbolPreference1: string;
  symbolPreference2: string;
  symbolPreference3: string;

  // Step 4: Category Details
  category: "general" | "sc" | "st_bl" | "st_lt" | "obc_central" | "obc_state";
  casteTribeName: string;
}

export interface NominationContextType {
  formData: NominationFormData;
  updateFormData: (data: Partial<NominationFormData>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  consentAccepted: boolean;
  setConsentAccepted: (accepted: boolean) => void;
}

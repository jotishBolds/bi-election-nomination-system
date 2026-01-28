// types/nomination.ts

// Symbol type for storing shuffled symbols
export interface ShuffledSymbol {
  id: string;
  name: string;
  image: string;
}

export interface NominationFormData {
  // Step 1: Basic Info
  district: string;
  ulb: string;
  municipality: string;
  municipalWard: string;
  wardName: string;
  constituency: string;
  reservation: string;
  candidateName: string;
  fatherOrHusbandName: string;
  fullPostalAddress: string;
  serialNoCandidate: string;
  partNoCandidate: string;
  category: "general" | "sc" | "st_bl" | "st_lt" | "obc_central" | "obc_state";
  casteTribeName: string;

  // Step 2: Proposer Details
  proposerName: string;
  proposerSerialNo: string;
  proposerPartNo: string;

  // Step 3: Candidate Declaration
  dateOfBirth: string;
  age: string;
  politicalPartyId: string;
  politicalParty: string;
  partySymbol: string;
  partySymbolImage: string;
  symbolPreference1: string;
  symbolPreference2: string;
  symbolPreference3: string;
  shuffleCount: number;
  shuffledSymbols?: ShuffledSymbol[]; // Store all shuffled symbols for persistence
}

export interface NominationContextType {
  formData: NominationFormData;
  updateFormData: (data: Partial<NominationFormData>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  consentAccepted: boolean;
  setConsentAccepted: (accepted: boolean) => void;
}

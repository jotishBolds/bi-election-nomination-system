// types/nomination.ts

// Symbol type for storing shuffled symbols
export interface ShuffledSymbol {
  id: string;
  name: string;
  image: string;
}

export interface NominationFormData {
  // Step 1: Basic Info
  districtId: string; // Database ID
  district: string; // Display name
  ulbId: string; // Database ID
  ulb: string; // Display name
  municipality: string;
  wardId: string; // Database ID
  municipalWard: string;
  wardName: string;
  constituency: string;
  reservation: string;
  candidateName: string;
  fatherOrHusbandName: string;
  fullPostalAddress: string;
  sameAsPostalAddress: boolean;
  correspondingAddress: string;
  serialNoCandidate: string;
  partNoCandidate: string;
  category: "general" | "sc" | "st_bl" | "st_lt" | "obc_central" | "obc_state";
  casteTribeName: string;

  // Document uploads (file names and Cloudinary URLs)
  casteCertificateFile: string;
  casteCertificateUrl: string;
  affidavitFile: string;
  affidavitUrl: string;
  addressProofFile: string;
  addressProofUrl: string;

  // EPIC number
  epicNumber: string;

  // Gender
  gender: "MALE" | "FEMALE" | "OTHER" | "";

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

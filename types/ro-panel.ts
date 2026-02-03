// Types for RO Panel
export interface RONomination {
  id: string;
  applicationNumber: string;
  candidateName: string;
  status: string;
  submittedAt: string;
  receivedAt?: string;
  scrutinizedAt?: string;
  withdrawnAt?: string;
  applicantProfile?: {
    fullName: string;
    fatherOrHusbandName: string;
    dateOfBirth: string;
    age: number;
    gender: string;
    category: string;
    permanentAddress: string;
    qualification?: string;
    occupation?: string;
    voterRecord?: {
      voterIdNumber: string;
      epicNumber: string;
    };
  };
  ward?: {
    id: string;
    name: string;
    wardNumber: number;
    reservationCategory: string;
  };
  ulb?: {
    id: string;
    name: string;
    type: string;
  };
  district?: {
    id: string;
    name: string;
  };
  politicalParty?: {
    id: string;
    name: string;
    shortName: string;
  };
  symbolPreferences?: Array<{
    preferenceOrder: number;
    symbol: {
      id: string;
      name: string;
      imageUrl: string;
    };
  }>;
  proposers?: Array<{
    serialNumber: number;
    name: string;
    voterIdNumber: string;
    address: string;
  }>;
  documents?: Array<{
    id: string;
    type: string;
    fileName: string;
    status: string;
  }>;
  payment?: {
    id: string;
    transactionId: string;
    amount: number;
    status: string;
    completedAt?: string;
  };
  statusHistory?: Array<{
    status: string;
    changedAt: string;
    changedBy?: string;
    remarks?: string;
  }>;
  category: string;
  isIndependent: boolean;
  paymentCompleted: boolean;
  rejectionReason?: string;
  remarks?: string;
}

export interface RODashboardStats {
  totalSubmitted: number;
  totalReceived: number;
  totalAccepted: number;
  totalRejected: number;
  totalWithdrawn: number;
  totalContesting: number;
  wardInfo: {
    wardNumber: number;
    wardName: string;
    reservationCategory: string;
    ulbName: string;
  };
}

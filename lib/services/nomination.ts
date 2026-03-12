// Nomination Service - Server-side business logic
import "server-only";
import { db } from "@/lib/db";
import {
  NominationStatus,
  PaymentStatus,
  PaymentMode,
  Category,
  Gender,
  AuditAction,
} from "@prisma/client";
import { validateActionAllowed } from "@/lib/services/election-time";

interface CreateNominationInput {
  applicantProfileId: string;
  ulbId: string;
  wardId: string;
  candidateName: string;
  fatherHusbandName: string;
  dateOfBirth?: Date;
  age?: number;
  gender?: Gender;
  category: Category;
  casteTribeName?: string;
  address: string;
  voterSerialNo: string;
  voterPartNo: string;
  politicalPartyId?: string;
  isIndependent: boolean;
  createdBy: string;
  ipAddress: string;
}

interface SubmitNominationInput {
  nominationId: string;
  userId: string;
  ipAddress: string;
}

// Generate unique application number
export function generateApplicationNumber(year: number = 2026): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NOM-${year}-${timestamp}${random}`;
}

// Check if user can submit more nominations
export async function canSubmitMoreNominations(
  applicantProfileId: string,
): Promise<{
  canSubmit: boolean;
  count: number;
  maxAllowed: number;
  reason?: string;
}> {
  const maxAllowed = parseInt(process.env.MAX_NOMINATION_SUBMISSIONS || "3");

  const count = await db.nominationApplication.count({
    where: {
      applicantProfileId,
      status: {
        notIn: [NominationStatus.DRAFT],
      },
    },
  });

  if (count >= maxAllowed) {
    return {
      canSubmit: false,
      count,
      maxAllowed,
      reason: `Maximum ${maxAllowed} nominations allowed per candidate`,
    };
  }

  return { canSubmit: true, count, maxAllowed };
}

// Create a new nomination draft
export async function createNominationDraft(
  input: CreateNominationInput,
): Promise<{ success: boolean; nomination?: any; error?: string }> {
  try {
    // Check if action is allowed (skip in development for testing)
    if (process.env.NODE_ENV !== "development") {
      const actionCheck = await validateActionAllowed("nomination");
      if (!actionCheck.allowed) {
        return { success: false, error: actionCheck.reason };
      }
    }

    // Check submission limit
    const limitCheck = await canSubmitMoreNominations(input.applicantProfileId);
    if (!limitCheck.canSubmit) {
      return { success: false, error: limitCheck.reason };
    }

    // Get next submission number
    const existingCount = await db.nominationApplication.count({
      where: { applicantProfileId: input.applicantProfileId },
    });

    const applicationNo = generateApplicationNumber();

    const nomination = await db.nominationApplication.create({
      data: {
        applicationNo,
        applicantProfileId: input.applicantProfileId,
        ulbId: input.ulbId,
        wardId: input.wardId,
        submissionNumber: existingCount + 1,
        status: NominationStatus.DRAFT,
        candidateName: input.candidateName,
        fatherHusbandName: input.fatherHusbandName,
        dateOfBirth: input.dateOfBirth || null,
        age: input.age || null,
        gender: input.gender || null,
        category: input.category,
        casteTribeName: input.casteTribeName,
        address: input.address,
        voterSerialNo: input.voterSerialNo || "",
        voterPartNo: input.voterPartNo || "",
        politicalPartyId: input.politicalPartyId || null,
        isIndependent: input.isIndependent,
        createdBy: input.createdBy,
      },
      include: {
        ward: {
          include: {
            ulb: {
              include: {
                district: true,
              },
            },
          },
        },
        applicantProfile: {
          include: {
            user: true,
          },
        },
      },
    });

    // Create status history
    await db.nominationStatusHistory.create({
      data: {
        nominationId: nomination.id,
        toStatus: NominationStatus.DRAFT,
        changedBy: input.createdBy,
        ipAddress: input.ipAddress,
        remarks: "Nomination draft created",
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: input.createdBy,
        action: AuditAction.CREATE,
        entityType: "NominationApplication",
        entityId: nomination.id,
        newValues: { applicationNo, status: NominationStatus.DRAFT },
        ipAddress: input.ipAddress,
      },
    });

    return { success: true, nomination };
  } catch (error) {
    console.error("Create nomination error:", error);
    return { success: false, error: "Failed to create nomination" };
  }
}

// Submit nomination (move from draft to submitted)
export async function submitNomination(
  input: SubmitNominationInput,
): Promise<{ success: boolean; nomination?: any; error?: string }> {
  try {
    // Check if action is allowed (skip in development for testing)
    if (process.env.NODE_ENV !== "development") {
      const actionCheck = await validateActionAllowed("nomination");
      if (!actionCheck.allowed) {
        return { success: false, error: actionCheck.reason };
      }
    }

    // Get nomination
    const nomination = await db.nominationApplication.findUnique({
      where: { id: input.nominationId },
      include: {
        brPayments: true,
        documents: true,
        proposers: true,
        applicantProfile: true,
      },
    });

    if (!nomination) {
      return { success: false, error: "Nomination not found" };
    }

    if (nomination.status !== NominationStatus.DRAFT) {
      return { success: false, error: "Nomination is not in draft status" };
    }

    // Validate required fields (relaxed for development)
    const validationErrors: string[] = [];

    // Proposers are optional for now - RO can verify later
    // if (!nomination.proposers.length) {
    //   validationErrors.push("At least one proposer is required");
    // }

    // Check payment for first submission - accept BR payments
    if (nomination.submissionNumber === 1) {
      const hasBRPayment = await db.bRPayment.findFirst({
        where: { nominationId: nomination.id },
      });

      if (!hasBRPayment && process.env.NODE_ENV !== "development") {
        validationErrors.push("Payment is required for first submission");
      }
    }

    if (validationErrors.length > 0) {
      return { success: false, error: validationErrors.join(". ") };
    }

    // Update nomination status
    const updatedNomination = await db.nominationApplication.update({
      where: { id: input.nominationId },
      data: {
        status: NominationStatus.SUBMITTED,
        submittedAt: new Date(),
        submittedIp: input.ipAddress,
      },
      include: {
        ward: {
          include: {
            ulb: {
              include: {
                district: true,
              },
            },
          },
        },
        applicantProfile: {
          include: {
            user: true,
          },
        },
      },
    });

    // Create status history
    await db.nominationStatusHistory.create({
      data: {
        nominationId: nomination.id,
        fromStatus: NominationStatus.DRAFT,
        toStatus: NominationStatus.SUBMITTED,
        changedBy: input.userId,
        ipAddress: input.ipAddress,
        remarks: "Nomination submitted by candidate",
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: input.userId,
        action: AuditAction.NOMINATION_SUBMITTED,
        entityType: "NominationApplication",
        entityId: nomination.id,
        oldValues: { status: NominationStatus.DRAFT },
        newValues: { status: NominationStatus.SUBMITTED },
        ipAddress: input.ipAddress,
      },
    });

    return { success: true, nomination: updatedNomination };
  } catch (error) {
    console.error("Submit nomination error:", error);
    return { success: false, error: "Failed to submit nomination" };
  }
}

// Get nominations for a candidate
export async function getCandidateNominations(applicantProfileId: string) {
  return db.nominationApplication.findMany({
    where: { applicantProfileId },
    include: {
      ward: {
        include: {
          ulb: {
            include: {
              district: true,
            },
          },
        },
      },
      applicantProfile: true,
      politicalParty: {
        include: {
          symbol: true,
        },
      },
      brPayments: true,
      documents: true,
      proposers: true,
      symbolPreferences: {
        include: {
          symbol: true,
        },
        orderBy: { preferenceOrder: "asc" },
      },
      statusHistory: {
        orderBy: { createdAt: "desc" },
      },
      allocatedSymbol: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// Get nomination by ID
export async function getNominationById(nominationId: string) {
  return db.nominationApplication.findUnique({
    where: { id: nominationId },
    include: {
      ward: {
        include: {
          ulb: {
            include: {
              district: true,
            },
          },
          constituency: true,
        },
      },
      applicantProfile: {
        include: {
          user: true,
          voterRecord: true,
        },
      },
      politicalParty: {
        include: {
          symbol: true,
        },
      },
      brPayments: true,
      documents: true,
      proposers: true,
      symbolPreferences: {
        include: {
          symbol: true,
        },
        orderBy: { preferenceOrder: "asc" },
      },
      statusHistory: {
        orderBy: { createdAt: "desc" },
      },
      allocatedSymbol: true,
    },
  });
}

// Update nomination draft
export async function updateNominationDraft(
  nominationId: string,
  data: Partial<CreateNominationInput>,
  userId: string,
  ipAddress: string,
): Promise<{ success: boolean; nomination?: any; error?: string }> {
  try {
    const nomination = await db.nominationApplication.findUnique({
      where: { id: nominationId },
    });

    if (!nomination) {
      return { success: false, error: "Nomination not found" };
    }

    if (nomination.status !== NominationStatus.DRAFT) {
      return { success: false, error: "Can only update draft nominations" };
    }

    const updatedNomination = await db.nominationApplication.update({
      where: { id: nominationId },
      data: {
        candidateName: data.candidateName,
        fatherHusbandName: data.fatherHusbandName,
        dateOfBirth: data.dateOfBirth,
        age: data.age,
        category: data.category,
        casteTribeName: data.casteTribeName,
        address: data.address,
        voterSerialNo: data.voterSerialNo,
        voterPartNo: data.voterPartNo,
        politicalPartyId: data.politicalPartyId,
        isIndependent: data.isIndependent,
        wardId: data.wardId,
        ulbId: data.ulbId,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId,
        action: AuditAction.UPDATE,
        entityType: "NominationApplication",
        entityId: nominationId,
        ipAddress,
      },
    });

    return { success: true, nomination: updatedNomination };
  } catch (error) {
    console.error("Update nomination error:", error);
    return { success: false, error: "Failed to update nomination" };
  }
}

// Add proposer to nomination
export async function addProposer(
  nominationId: string,
  proposerData: {
    name: string;
    voterSerialNo: string;
    voterPartNo: string;
    epicNo?: string;
    address?: string;
  },
  userId: string,
  ipAddress: string,
): Promise<{ success: boolean; proposer?: any; error?: string }> {
  try {
    const nomination = await db.nominationApplication.findUnique({
      where: { id: nominationId },
    });

    if (!nomination) {
      return { success: false, error: "Nomination not found" };
    }

    if (nomination.status !== NominationStatus.DRAFT) {
      return {
        success: false,
        error: "Can only add proposers to draft nominations",
      };
    }

    const proposer = await db.proposer.create({
      data: {
        nominationId,
        ...proposerData,
      },
    });

    return { success: true, proposer };
  } catch (error) {
    console.error("Add proposer error:", error);
    return { success: false, error: "Failed to add proposer" };
  }
}

// Add symbol preferences
export async function addSymbolPreferences(
  nominationId: string,
  symbolIds: string[], // Array of 3 symbol IDs in preference order
  userId: string,
  ipAddress: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const nomination = await db.nominationApplication.findUnique({
      where: { id: nominationId },
    });

    if (!nomination) {
      return { success: false, error: "Nomination not found" };
    }

    if (!nomination.isIndependent) {
      return {
        success: false,
        error: "Symbol preferences only for independent candidates",
      };
    }

    // Delete existing preferences
    await db.symbolPreference.deleteMany({
      where: { nominationId },
    });

    // Create new preferences
    for (let i = 0; i < Math.min(symbolIds.length, 3); i++) {
      await db.symbolPreference.create({
        data: {
          nominationId,
          symbolId: symbolIds[i],
          preferenceOrder: i + 1,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Add symbol preferences error:", error);
    return { success: false, error: "Failed to add symbol preferences" };
  }
}

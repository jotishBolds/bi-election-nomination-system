// Election Configuration Service V2 - Multi-Election Support
import "server-only";
import { db } from "@/lib/db";
import { ElectionType, ElectionScopeType } from "@prisma/client";
import { createElectionSeats } from "./election-seat";

export interface ElectionConfigV2Input {
  name: string;
  year: bigint | number;
  electionType: "PANCHAYAT" | "MUNICIPAL" | "ZPTC";
  scopeType: "FULL" | "PARTIAL" | "BY_ELECTION";
  notificationDate: Date;
  nominationStartDate: Date;
  nominationEndDate: Date;
  scrutinyDate: Date;
  withdrawalStartDate: Date;
  withdrawalEndDate: Date;
  dailyStartTime?: string;
  dailyEndTime?: string;
  nominationFee: number;
  scStFeeDiscount?: number;
  maxNominationsPerCandidate?: number;
  maxProposersRequired?: number;

  // Geographic selection - scope-dependent
  selectedDistricts?: string[]; // Optional - only for PARTIAL/BY_ELECTION

  // Optional - only used for PARTIAL/BY_ELECTION
  selectedULBs?: string[]; // Only for MUNICIPAL
  selectedGPUs?: string[]; // Only for PANCHAYAT
  selectedZPTCs?: string[]; // Only for ZPTC

  // Optional - for fine-grained control
  selectedWards?: string[]; // For MUNICIPAL partial
  selectedPanchayatWards?: string[]; // For PANCHAYAT partial
}

export interface GeographicSelection {
  selectedDistricts?: string[];
  selectedULBs?: string[];
  selectedGPUs?: string[];
  selectedZPTCs?: string[];
  selectedWards?: string[];
  selectedPanchayatWards?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Create a new election with automatic seat creation
 */
export async function createElectionWithSeats(
  input: ElectionConfigV2Input,
  createdBy: string,
) {
  // Validate input first
  const validation = await validateElectionCreation(input);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
  }

  return await db.$transaction(async (tx) => {
    // 1. Create ElectionConfig
    const election = await tx.electionConfig.create({
      data: {
        name: input.name,
        year: Number(input.year),
        electionType: input.electionType,
        scopeType: input.scopeType,
        notificationDate: input.notificationDate,
        nominationStartDate: input.nominationStartDate,
        nominationEndDate: input.nominationEndDate,
        scrutinyDate: input.scrutinyDate,
        withdrawalStartDate: input.withdrawalStartDate,
        withdrawalEndDate: input.withdrawalEndDate,
        dailyStartTime: input.dailyStartTime ?? "09:00",
        dailyEndTime: input.dailyEndTime ?? "15:00",
        nominationFee: input.nominationFee,
        scStFeeDiscount: input.scStFeeDiscount ?? 0,
        maxNominationsPerCandidate: input.maxNominationsPerCandidate ?? 3,
        maxProposersRequired: input.maxProposersRequired ?? 1,
        isActive: true,
        createdBy: createdBy,
      },
    });

    // 2. Create ElectionSeats automatically
    const seatData = {
      selectedDistricts: input.selectedDistricts,
      selectedULBs: input.selectedULBs,
      selectedGPUs: input.selectedGPUs,
      selectedZPTCs: input.selectedZPTCs,
      selectedWards: input.selectedWards,
      selectedPanchayatWards: input.selectedPanchayatWards,
    };

    await createElectionSeats(
      election.id,
      input.electionType as ElectionType,
      input.scopeType as ElectionScopeType,
      seatData,
      tx,
    );

    // 3. Create day modules
    await createDayModules(election.id, input, tx);

    // 4. Log audit trail
    await tx.auditLog.create({
      data: {
        userId: createdBy,
        action: "CREATE",
        entityType: "ElectionConfig",
        entityId: election.id,
        ipAddress: "127.0.0.1", // System-generated
        newValues: {
          name: election.name,
          electionType: election.electionType,
          scopeType: election.scopeType,
          year: election.year,
        },
      },
    });

    return election;
  });
}

/**
 * Validate election creation input
 */
export async function validateElectionCreation(
  input: ElectionConfigV2Input,
): Promise<ValidationResult> {
  const errors: string[] = [];

  // Validate required fields
  if (!input.name?.trim()) {
    errors.push("Election name is required");
  }

  if (!input.year || input.year < new Date().getFullYear()) {
    errors.push("Valid election year is required");
  }

  if (!input.electionType) {
    errors.push("Election type is required");
  }

  // Scope-dependent validation
  if (input.scopeType === "FULL") {
    // FULL scope - no additional selection needed
    // System will automatically select all eligible units
  } else {
    // PARTIAL/BY_ELECTION - require at least one geographic selection
    switch (input.electionType) {
      case "MUNICIPAL":
        if (
          !input.selectedDistricts?.length &&
          !input.selectedULBs?.length &&
          !input.selectedWards?.length
        ) {
          errors.push(
            "MUNICIPAL elections require district, ULB, or ward selection for PARTIAL/BY_ELECTION scope",
          );
        }
        break;
      case "PANCHAYAT":
        if (
          !input.selectedDistricts?.length &&
          !input.selectedGPUs?.length &&
          !input.selectedPanchayatWards?.length
        ) {
          errors.push(
            "PANCHAYAT elections require district, GPU, or panchayat ward selection for PARTIAL/BY_ELECTION scope",
          );
        }
        break;
      case "ZPTC":
        if (
          !input.selectedDistricts?.length &&
          !input.selectedZPTCs?.length
        ) {
          errors.push(
            "ZPTC elections require district or ZPTC selection for PARTIAL/BY_ELECTION scope",
          );
        }
        break;
    }
  }

  // Validate date sequences
  if (input.notificationDate >= input.nominationStartDate) {
    errors.push("Notification date must be before nomination start date");
  }

  if (input.nominationStartDate >= input.nominationEndDate) {
    errors.push("Nomination start date must be before nomination end date");
  }

  if (input.nominationEndDate >= input.scrutinyDate) {
    errors.push("Nomination end date must be before scrutiny date");
  }

  if (input.scrutinyDate >= input.withdrawalStartDate) {
    errors.push("Scrutiny date must be before withdrawal start date");
  }

  if (input.withdrawalStartDate >= input.withdrawalEndDate) {
    errors.push("Withdrawal start date must be before withdrawal end date");
  }

  // Validate fees and limits
  if (input.nominationFee < 0) {
    errors.push("Nomination fee must be non-negative");
  }

  if (input.scStFeeDiscount && input.scStFeeDiscount < 0) {
    errors.push("SC/ST fee discount must be non-negative");
  }

  if (
    input.maxNominationsPerCandidate &&
    input.maxNominationsPerCandidate < 1
  ) {
    errors.push("Max nominations per candidate must be at least 1");
  }

  if (input.maxProposersRequired && input.maxProposersRequired < 1) {
    errors.push("Max proposers required must be at least 1");
  }

  // Check for conflicting elections
  const conflicts = await checkElectionConflicts(input);
  if (conflicts.length > 0) {
    errors.push(`Conflicts with existing elections: ${conflicts.join(", ")}`);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Check for conflicts with existing elections
 */
async function checkElectionConflicts(
  input: ElectionConfigV2Input,
): Promise<string[]> {
  const conflicts = await db.electionConfig.findMany({
    where: {
      isActive: true,
      electionType: input.electionType as ElectionType,
      OR: [
        {
          nominationStartDate: { lte: input.nominationEndDate },
          nominationEndDate: { gte: input.nominationStartDate },
        },
      ],
    },
    include: {
      electionSeats: true,
    },
  });

  const overlappingSeats = [];
  for (const conflict of conflicts) {
    const hasOverlap = await checkGeographicOverlap(conflict, input);
    if (hasOverlap) {
      overlappingSeats.push(conflict.name);
    }
  }

  return overlappingSeats;
}

/**
 * Check geographic overlap between elections
 */
async function checkGeographicOverlap(
  existingElection: any,
  newInput: ElectionConfigV2Input,
): Promise<boolean> {
  // Get existing seats
  const existingSeats = existingElection.electionSeats;

  // Check if any existing seats overlap with new selection
  if (newInput.electionType === "MUNICIPAL") {
    const existingWardIds = existingSeats
      .filter((seat: any) => seat.wardId)
      .map((seat: any) => seat.wardId);

    if (existingWardIds.length === 0) return false;

    // Get the wards that would be created for the new election
    const newWards = await getNewElectionWards(newInput);
    const newWardIds = newWards.map(ward => ward.id);

    // Check for overlap between existing and new wards
    const overlappingWards = existingWardIds.filter(wardId => 
      newWardIds.includes(wardId)
    );

    return overlappingWards.length > 0;
  }

  // Similar logic for PANCHAYAT and ZPTC
  // For now, return false to allow parallel development
  return false;
}

/**
 * Get the wards that would be created for a new election based on selection
 */
async function getNewElectionWards(input: ElectionConfigV2Input): Promise<Array<{ id: string }>> {
  if (input.selectedWards?.length) {
    // Direct ward selection
    return await db.ward.findMany({
      where: {
        id: { in: input.selectedWards },
        isActive: true,
      },
      select: { id: true },
    });
  } else if (input.selectedULBs?.length) {
    // ULB selection - get all wards in those ULBs
    return await db.ward.findMany({
      where: {
        ulbId: { in: input.selectedULBs },
        isActive: true,
      },
      select: { id: true },
    });
  } else if (input.selectedDistricts?.length) {
    // District selection - get all wards in ULBs in those districts
    const districtULBs = await db.uLB.findMany({
      where: {
        districtId: { in: input.selectedDistricts },
        isActive: true,
      },
      select: { id: true },
    });

    return await db.ward.findMany({
      where: {
        ulbId: { in: districtULBs.map(ulb => ulb.id) },
        isActive: true,
      },
      select: { id: true },
    });
  }

  // FULL scope - all wards
  return await db.ward.findMany({
    where: { isActive: true },
    select: { id: true },
  });
}

/**
 * Create day modules for election
 */
async function createDayModules(
  electionId: string,
  input: ElectionConfigV2Input,
  tx: any,
) {
  const dayModules = [];

  // Create nomination days (7 days)
  for (let i = 0; i < 7; i++) {
    const date = new Date(input.nominationStartDate);
    date.setDate(date.getDate() + i);

    dayModules.push({
      electionId,
      dayNumber: i + 1,
      date,
      nominationEnabled: true,
      scrutinyEnabled: false,
      withdrawalEnabled: false,
    });
  }

  // Create scrutiny day
  const scrutinyDate = new Date(input.scrutinyDate);
  dayModules.push({
    electionId,
    dayNumber: 8,
    date: scrutinyDate,
    nominationEnabled: false,
    scrutinyEnabled: true,
    withdrawalEnabled: false,
  });

  // Create withdrawal days (2 days)
  for (let i = 0; i < 2; i++) {
    const date = new Date(input.withdrawalStartDate);
    date.setDate(date.getDate() + i);

    dayModules.push({
      electionId,
      dayNumber: 9 + i,
      date,
      nominationEnabled: false,
      scrutinyEnabled: false,
      withdrawalEnabled: true,
    });
  }

  await tx.dayModuleConfig.createMany({
    data: dayModules,
  });
}

/**
 * Get election with seats
 */
export async function getElectionWithSeats(electionId: string) {
  return await db.electionConfig.findUnique({
    where: { id: electionId },
    include: {
      electionSeats: {
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
          panchayatWard: {
            include: {
              gpu: {
                include: {
                  district: true,
                },
              },
            },
          },
          zptc: {
            include: {
              district: true,
            },
          },
        },
      },
      dayModuleConfigs: {
        orderBy: { dayNumber: "asc" },
      },
    },
  });
}

/**
 * Get all elections with their seat counts
 */
export async function getAllElections() {
  return await db.electionConfig.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          electionSeats: true,
          nominations: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

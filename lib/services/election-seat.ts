// Election Seat Service - Automatic seat creation and management
import "server-only";
import { db } from "@/lib/db";
import { ElectionType, ElectionScopeType } from "@prisma/client";
import { GeographicSelection } from "./election-config-v2";

export interface SeatInput {
  type: 'MUNICIPAL' | 'PANCHAYAT' | 'ZPTC';
  unitId: string; // wardId, panchayatWardId, or zptcId
}

/**
 * Create election seats automatically based on election type, scope type, and geographic selection
 */
export async function createElectionSeats(
  electionId: string,
  electionType: ElectionType,
  scopeType: ElectionScopeType,
  geographicSelection: GeographicSelection,
  tx: any = db
): Promise<void> {
  // Get all eligible seats based on election type, scope type, and selection
  const eligibleSeats = await getEligibleSeats(electionType, scopeType, geographicSelection);
  
  // Apply scope type logic
  const seatsToCreate = applyScopeTypeLogic(eligibleSeats, scopeType);
  
  if (seatsToCreate.length === 0) {
    throw new Error(`No eligible seats found for ${electionType} election with selected geographic areas`);
  }
  
  // Validate no duplicate seats within this election
  await validateSeatUniqueness(electionId, seatsToCreate);
  
  // Create ElectionSeat records
  const seatData = seatsToCreate.map(seat => ({
    electionId,
    wardId: electionType === 'MUNICIPAL' ? seat.unitId : null,
    panchayatWardId: electionType === 'PANCHAYAT' ? seat.unitId : null,
    zptcId: electionType === 'ZPTC' ? seat.unitId : null,
  }));
  
  await tx.electionSeat.createMany({
    data: seatData,
  });
}

/**
 * Get eligible seats based on election type, scope type, and geographic selection
 */
export async function getEligibleSeats(
  electionType: ElectionType,
  scopeType: ElectionScopeType,
  selection: GeographicSelection
): Promise<SeatInput[]> {
  switch (electionType) {
    case 'MUNICIPAL':
      return await getMunicipalSeats(scopeType, selection);
    case 'PANCHAYAT':
      return await getPanchayatSeats(scopeType, selection);
    case 'ZPTC':
      return await getZPTCSeats(scopeType, selection);
    default:
      throw new Error(`Invalid election type: ${electionType}`);
  }
}

/**
 * Get municipal seats (wards) for selection with scope-based logic
 */
async function getMunicipalSeats(
  scopeType: ElectionScopeType,
  selection: GeographicSelection
): Promise<SeatInput[]> {
  switch (scopeType) {
    case 'FULL':
      // Get ALL ULBs and ALL wards - no geographic selection needed
      const allULBs = await db.uLB.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      
      const allWards = await db.ward.findMany({
        where: {
          ulbId: { in: allULBs.map(ulb => ulb.id) },
          isActive: true,
        },
        select: { id: true },
      });

      return allWards.map(ward => ({
        type: 'MUNICIPAL' as const,
        unitId: ward.id,
      }));

    case 'PARTIAL':
    case 'BY_ELECTION':
      // Flexible selection based on what's provided
      if (selection.selectedWards?.length) {
        // Direct ward selection
        const specificWards = await db.ward.findMany({
          where: {
            id: { in: selection.selectedWards },
            isActive: true,
          },
          select: { id: true },
        });

        return specificWards.map(ward => ({
          type: 'MUNICIPAL' as const,
          unitId: ward.id,
        }));
      } else if (selection.selectedULBs?.length) {
        // ULB selection - get all wards in those ULBs
        const ulbWards = await db.ward.findMany({
          where: {
            ulbId: { in: selection.selectedULBs },
            isActive: true,
          },
          select: { id: true },
        });

        return ulbWards.map(ward => ({
          type: 'MUNICIPAL' as const,
          unitId: ward.id,
        }));
      } else if (selection.selectedDistricts?.length) {
        // District selection - get all wards in ULBs in those districts
        const districtULBs = await db.uLB.findMany({
          where: {
            districtId: { in: selection.selectedDistricts },
            isActive: true,
          },
          select: { id: true },
        });

        const districtWards = await db.ward.findMany({
          where: {
            ulbId: { in: districtULBs.map(ulb => ulb.id) },
            isActive: true,
          },
          select: { id: true },
        });

        return districtWards.map(ward => ({
          type: 'MUNICIPAL' as const,
          unitId: ward.id,
        }));
      } else {
        throw new Error("No geographic selection provided for MUNICIPAL election");
      }

    default:
      throw new Error(`Invalid scope type: ${scopeType}`);
  }
}

/**
 * Get panchayat seats (panchayat wards) for selection with scope-based logic
 */
async function getPanchayatSeats(
  scopeType: ElectionScopeType,
  selection: GeographicSelection
): Promise<SeatInput[]> {
  switch (scopeType) {
    case 'FULL':
      // Get ALL GPUs and ALL panchayat wards - no geographic selection needed
      const allGPUs = await db.gPU.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      
      const allPanchayatWards = await db.panchayatWard.findMany({
        where: {
          gpuId: { in: allGPUs.map(gpu => gpu.id) },
          isActive: true,
        },
        select: { id: true },
      });

      return allPanchayatWards.map(ward => ({
        type: 'PANCHAYAT' as const,
        unitId: ward.id,
      }));

    case 'PARTIAL':
    case 'BY_ELECTION':
      // Flexible selection based on what's provided
      if (selection.selectedPanchayatWards?.length) {
        // Direct panchayat ward selection
        const specificWards = await db.panchayatWard.findMany({
          where: {
            id: { in: selection.selectedPanchayatWards },
            isActive: true,
          },
          select: { id: true },
        });

        return specificWards.map(ward => ({
          type: 'PANCHAYAT' as const,
          unitId: ward.id,
        }));
      } else if (selection.selectedGPUs?.length) {
        // GPU selection - get all panchayat wards in those GPUs
        const gpuWards = await db.panchayatWard.findMany({
          where: {
            gpuId: { in: selection.selectedGPUs },
            isActive: true,
          },
          select: { id: true },
        });

        return gpuWards.map(ward => ({
          type: 'PANCHAYAT' as const,
          unitId: ward.id,
        }));
      } else if (selection.selectedDistricts?.length) {
        // District selection - get all panchayat wards in GPUs in those districts
        const districtGPUs = await db.gPU.findMany({
          where: {
            districtId: { in: selection.selectedDistricts },
            isActive: true,
          },
          select: { id: true },
        });

        const districtPanchayatWards = await db.panchayatWard.findMany({
          where: {
            gpuId: { in: districtGPUs.map(gpu => gpu.id) },
            isActive: true,
          },
          select: { id: true },
        });

        return districtPanchayatWards.map(ward => ({
          type: 'PANCHAYAT' as const,
          unitId: ward.id,
        }));
      } else {
        throw new Error("No geographic selection provided for PANCHAYAT election");
      }

    default:
      throw new Error(`Invalid scope type: ${scopeType}`);
  }
}

/**
 * Get ZPTC seats for selection with scope-based logic
 */
async function getZPTCSeats(
  scopeType: ElectionScopeType,
  selection: GeographicSelection
): Promise<SeatInput[]> {
  switch (scopeType) {
    case 'FULL':
      // Get ALL ZPTCs - no geographic selection needed
      const allZptcs = await db.zPTC.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      return allZptcs.map(zptc => ({
        type: 'ZPTC' as const,
        unitId: zptc.id,
      }));

    case 'PARTIAL':
    case 'BY_ELECTION':
      // Flexible selection based on what's provided
      if (selection.selectedZPTCs?.length) {
        // Direct ZPTC selection
        const selectedZptcs = await db.zPTC.findMany({
          where: {
            id: { in: selection.selectedZPTCs },
            isActive: true,
          },
          select: { id: true },
        });

        return selectedZptcs.map(zptc => ({
          type: 'ZPTC' as const,
          unitId: zptc.id,
        }));
      } else if (selection.selectedDistricts?.length) {
        // District selection - get all ZPTCs in those districts
        const districtZptcs = await db.zPTC.findMany({
          where: {
            districtId: { in: selection.selectedDistricts },
            isActive: true,
          },
          select: { id: true },
        });

        return districtZptcs.map(zptc => ({
          type: 'ZPTC' as const,
          unitId: zptc.id,
        }));
      } else {
        throw new Error("No geographic selection provided for ZPTC election");
      }

    default:
      throw new Error(`Invalid scope type: ${scopeType}`);
  }
}

/**
 * Apply scope type logic to determine which seats to create
 */
function applyScopeTypeLogic(
  seats: SeatInput[],
  scopeType: ElectionScopeType
): SeatInput[] {
  switch (scopeType) {
    case 'FULL':
      return seats; // All eligible seats
    case 'PARTIAL':
      // For now, return all seats - admin will filter in UI
      // Future: Add partial selection logic based on admin input
      return seats;
    case 'BY_ELECTION':
      // For now, return all seats - admin will select specific ones
      // Future: Add by-election selection logic
      return seats;
    default:
      return seats;
  }
}

/**
 * Validate that seats don't already exist for this election
 */
async function validateSeatUniqueness(
  electionId: string,
  seatsToCreate: SeatInput[]
): Promise<void> {
  // Check for existing seats that would conflict
  const existingSeats = await db.electionSeat.findMany({
    where: { electionId },
  });

  if (existingSeats.length === 0) return;

  const existingWardIds = existingSeats
    .filter(seat => seat.wardId)
    .map(seat => seat.wardId!);
  
  const existingPanchayatWardIds = existingSeats
    .filter(seat => seat.panchayatWardId)
    .map(seat => seat.panchayatWardId!);
  
  const existingZptcIds = existingSeats
    .filter(seat => seat.zptcId)
    .map(seat => seat.zptcId!);

  const newWardIds = seatsToCreate
    .filter(seat => seat.type === 'MUNICIPAL')
    .map(seat => seat.unitId);
  
  const newPanchayatWardIds = seatsToCreate
    .filter(seat => seat.type === 'PANCHAYAT')
    .map(seat => seat.unitId);
  
  const newZptcIds = seatsToCreate
    .filter(seat => seat.type === 'ZPTC')
    .map(seat => seat.unitId);

  const conflicts = [];
  
  // Check for ward conflicts
  const wardConflicts = newWardIds.filter(id => existingWardIds.includes(id));
  if (wardConflicts.length > 0) {
    conflicts.push(`Wards: ${wardConflicts.join(', ')}`);
  }
  
  // Check for panchayat ward conflicts
  const panchayatConflicts = newPanchayatWardIds.filter(id => existingPanchayatWardIds.includes(id));
  if (panchayatConflicts.length > 0) {
    conflicts.push(`Panchayat Wards: ${panchayatConflicts.join(', ')}`);
  }
  
  // Check for ZPTC conflicts
  const zptcConflicts = newZptcIds.filter(id => existingZptcIds.includes(id));
  if (zptcConflicts.length > 0) {
    conflicts.push(`ZPTCs: ${zptcConflicts.join(', ')}`);
  }

  if (conflicts.length > 0) {
    throw new Error(`Seats already exist for this election: ${conflicts.join(', ')}`);
  }
}

/**
 * Get election seats with full details
 */
export async function getElectionSeats(electionId: string) {
  return await db.electionSeat.findMany({
    where: { electionId },
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
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Delete election seats (for election deletion or updates)
 */
export async function deleteElectionSeats(electionId: string, tx: any = db) {
  return await tx.electionSeat.deleteMany({
    where: { electionId },
  });
}

/**
 * Update election seats (for scope changes)
 */
export async function updateElectionSeats(
  electionId: string,
  electionType: ElectionType,
  scopeType: ElectionScopeType,
  geographicSelection: GeographicSelection
) {
  return await db.$transaction(async (tx) => {
    // Delete existing seats
    await deleteElectionSeats(electionId, tx);
    
    // Create new seats
    await createElectionSeats(electionId, electionType, scopeType, geographicSelection, tx);
  });
}

/**
 * Get seat statistics for an election
 */
export async function getElectionSeatStats(electionId: string) {
  const seats = await db.electionSeat.findMany({
    where: { electionId },
  });

  const stats = {
    total: seats.length,
    municipal: seats.filter(s => s.wardId).length,
    panchayat: seats.filter(s => s.panchayatWardId).length,
    zptc: seats.filter(s => s.zptcId).length,
  };

  return stats;
}

// Jurisdiction Helper Service - Handles polymorphic jurisdiction relationships
import "server-only";
import { db } from "@/lib/db";
import { JurisdictionType } from "@prisma/client";

export interface JurisdictionWithDetails {
  id: string;
  userId: string;
  jurisdictionType: JurisdictionType;
  jurisdictionId: string;
  electionId?: string | null;
  assignedAt: Date;
  assignedBy?: string | null;
  isActive: boolean;
  // Dynamic relations based on type
  district?: {
    id: string;
    code: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  ulb?: {
    id: string;
    code: string;
    name: string;
    type?: string | null;
    districtId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    district?: {
      id: string;
      code: string;
      name: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
  };
  ward?: {
    id: string;
    wardNo: number;
    wardName: string;
    ulbId: string;
    constituencyId?: string | null;
    reservationType?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    ulb?: {
      id: string;
      code: string;
      name: string;
      type?: string | null;
      districtId: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      district?: {
        id: string;
        code: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
      };
    };
  };
  gpu?: {
    id: string;
    name: string;
    districtId: string;
    createdAt: Date;
    district?: {
      id: string;
      code: string;
      name: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
  };
  panchayatWard?: {
    id: string;
    wardNo: number;
    name: string;
    gpuId: string;
    createdAt: Date;
    gpu?: {
      id: string;
      name: string;
      districtId: string;
      createdAt: Date;
      district?: {
        id: string;
        code: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
      };
    };
  };
  zptc?: {
    id: string;
    name: string;
    districtId: string;
    createdAt: Date;
    district?: {
      id: string;
      code: string;
      name: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
  };
}

/**
 * Load jurisdiction details dynamically based on jurisdiction type
 */
export async function loadJurisdictionDetails(
  jurisdictions: Array<{
    id: string;
    userId: string;
    jurisdictionType: JurisdictionType;
    jurisdictionId: string;
    electionId?: string | null;
    assignedAt: Date;
    assignedBy?: string | null;
    isActive: boolean;
  }>
): Promise<JurisdictionWithDetails[]> {
  // Group jurisdiction IDs by type
  const districtIds = jurisdictions
    .filter(j => j.jurisdictionType === 'DISTRICT')
    .map(j => j.jurisdictionId);

  const ulbIds = jurisdictions
    .filter(j => j.jurisdictionType === 'ULB')
    .map(j => j.jurisdictionId);

  const wardIds = jurisdictions
    .filter(j => j.jurisdictionType === 'WARD')
    .map(j => j.jurisdictionId);

  const gpuIds = jurisdictions
    .filter(j => j.jurisdictionType === 'GPU')
    .map(j => j.jurisdictionId);

  const panchayatWardIds = jurisdictions
    .filter(j => j.jurisdictionType === 'PANCHAYAT_WARD')
    .map(j => j.jurisdictionId);

  const zptcIds = jurisdictions
    .filter(j => j.jurisdictionType === 'ZPTC')
    .map(j => j.jurisdictionId);

  // Load each type separately with proper includes
  const [
    districts,
    ulbs,
    wards,
    gpus,
    panchayatWards,
    zptcs
  ] = await Promise.all([
    // Districts
    districtIds.length > 0
      ? db.district.findMany({
          where: { id: { in: districtIds } },
          select: {
            id: true,
            code: true,
            name: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      : [],

    // ULBs with district
    ulbIds.length > 0
      ? db.uLB.findMany({
          where: { id: { in: ulbIds } },
          include: {
            district: {
              select: {
                id: true,
                code: true,
                name: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        })
      : [],

    // Wards with ULB and district
    wardIds.length > 0
      ? db.ward.findMany({
          where: { id: { in: wardIds } },
          include: {
            ulb: {
              include: {
                district: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
              },
            },
          },
        })
      : [],

    // GPUs with district
    gpuIds.length > 0
      ? db.gPU.findMany({
          where: { id: { in: gpuIds } },
          include: {
            district: {
              select: {
                id: true,
                code: true,
                name: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        })
      : [],

    // Panchayat Wards with GPU and district
    panchayatWardIds.length > 0
      ? db.panchayatWard.findMany({
          where: { id: { in: panchayatWardIds } },
          include: {
            gpu: {
              include: {
                district: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
              },
            },
          },
        })
      : [],

    // ZPTCs with district
    zptcIds.length > 0
      ? db.zPTC.findMany({
          where: { id: { in: zptcIds } },
          include: {
            district: {
              select: {
                id: true,
                code: true,
                name: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        })
      : [],
  ]);

  // Create lookup maps for efficient access
  const districtMap = new Map(districts.map(d => [d.id, d]));
  const ulbMap = new Map(ulbs.map(u => [u.id, u]));
  const wardMap = new Map(wards.map(w => [w.id, w]));
  const gpuMap = new Map(gpus.map(g => [g.id, g]));
  const panchayatWardMap = new Map(panchayatWards.map(pw => [pw.id, pw]));
  const zptcMap = new Map(zptcs.map(z => [z.id, z]));

  // Map back to jurisdictions with details
  return jurisdictions.map(jurisdiction => {
    const result: JurisdictionWithDetails = { ...jurisdiction };

    switch (jurisdiction.jurisdictionType) {
      case 'DISTRICT':
        result.district = districtMap.get(jurisdiction.jurisdictionId);
        break;

      case 'ULB':
        result.ulb = ulbMap.get(jurisdiction.jurisdictionId);
        break;

      case 'WARD':
        result.ward = wardMap.get(jurisdiction.jurisdictionId);
        break;

      case 'GPU':
        result.gpu = gpuMap.get(jurisdiction.jurisdictionId);
        break;

      case 'PANCHAYAT_WARD':
        result.panchayatWard = panchayatWardMap.get(jurisdiction.jurisdictionId);
        break;

      case 'ZPTC':
        result.zptc = zptcMap.get(jurisdiction.jurisdictionId);
        break;
    }

    return result;
  });
}

/**
 * Load jurisdiction details for a single user
 */
export async function loadUserJurisdictionDetails(
  userId: string
): Promise<JurisdictionWithDetails[]> {
  const jurisdictions = await db.userJurisdiction.findMany({
    where: { 
      userId,
      isActive: true 
    },
    orderBy: { assignedAt: 'desc' },
  });

  return loadJurisdictionDetails(jurisdictions);
}

/**
 * Get jurisdiction display name for UI
 */
export function getJurisdictionDisplayName(jurisdiction: JurisdictionWithDetails): string {
  switch (jurisdiction.jurisdictionType) {
    case 'DISTRICT':
      return jurisdiction.district?.name || 'Unknown District';
    
    case 'ULB':
      return jurisdiction.ulb?.name || 'Unknown ULB';
    
    case 'WARD':
      return jurisdiction.ward 
        ? `${jurisdiction.ward.wardName} (Ward ${jurisdiction.ward.wardNo})`
        : 'Unknown Ward';
    
    case 'GPU':
      return jurisdiction.gpu?.name || 'Unknown GPU';
    
    case 'PANCHAYAT_WARD':
      return jurisdiction.panchayatWard 
        ? `${jurisdiction.panchayatWard.name} (Panchayat Ward ${jurisdiction.panchayatWard.wardNo})`
        : 'Unknown Panchayat Ward';
    
    case 'ZPTC':
      return jurisdiction.zptc?.name || 'Unknown ZPTC';
    
    default:
      return 'Unknown Jurisdiction';
  }
}

/**
 * Get jurisdiction hierarchy string for display
 */
export function getJurisdictionHierarchy(jurisdiction: JurisdictionWithDetails): string {
  switch (jurisdiction.jurisdictionType) {
    case 'DISTRICT':
      return `District: ${jurisdiction.district?.name || 'Unknown'}`;
    
    case 'ULB':
      return `${jurisdiction.ulb?.district?.name || 'Unknown'} > ${jurisdiction.ulb?.name || 'Unknown'}`;
    
    case 'WARD':
      return jurisdiction.ward?.ulb?.district?.name && jurisdiction.ward?.ulb?.name && jurisdiction.ward?.wardName
        ? `${jurisdiction.ward.ulb.district.name} > ${jurisdiction.ward.ulb.name} > ${jurisdiction.ward.wardName}`
        : 'Unknown Ward';
    
    case 'GPU':
      return `${jurisdiction.gpu?.district?.name || 'Unknown'} > ${jurisdiction.gpu?.name || 'Unknown'}`;
    
    case 'PANCHAYAT_WARD':
      return jurisdiction.panchayatWard?.gpu?.district?.name && jurisdiction.panchayatWard?.gpu?.name && jurisdiction.panchayatWard?.name
        ? `${jurisdiction.panchayatWard.gpu.district.name} > ${jurisdiction.panchayatWard.gpu.name} > ${jurisdiction.panchayatWard.name}`
        : 'Unknown Panchayat Ward';
    
    case 'ZPTC':
      return `${jurisdiction.zptc?.district?.name || 'Unknown'} > ${jurisdiction.zptc?.name || 'Unknown'}`;
    
    default:
      return 'Unknown Jurisdiction';
  }
}

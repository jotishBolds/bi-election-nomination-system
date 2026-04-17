// Geographic Units Service - Provides data for election creation
import "server-only";
import { db } from "@/lib/db";

export interface GeographicHierarchy {
  districts: DistrictWithCounts[];
  ulbs?: ULBWithCounts[];
  gpus?: GPUWithCounts[];
  zptcs?: ZPTCWithCounts[];
}

export interface DistrictWithCounts {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  _count?: {
    ulbs: number;
    gPUs: number;
    zPTCs: number;
  };
}

export interface ULBWithCounts {
  id: string;
  name: string;
  code: string;
  type: string | null;
  districtId: string;
  isActive: boolean;
  district: {
    name: string;
  };
  _count: {
    wards: number;
  };
}

export interface GPUWithCounts {
  id: string;
  name: string;
  districtId: string;
  district: {
    name: string;
  };
  _count: {
    panchayatWards: number;
  };
}

export interface ZPTCWithCounts {
  id: string;
  name: string;
  districtId: string;
  district: {
    name: string;
  };
}

/**
 * Get all districts with counts
 */
export async function getAllDistricts(): Promise<DistrictWithCounts[]> {
  const districts = await db.district.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      isActive: true,
    },
  });

  // Get counts separately to avoid complex type issues
  const [ulbCounts, gpuCounts, zptcCounts] = await Promise.all([
    db.uLB.groupBy({
      by: ['districtId'],
      _count: true,
      where: { isActive: true },
    }),
    db.gPU.groupBy({
      by: ['districtId'],
      _count: true,
    }),
    db.zPTC.groupBy({
      by: ['districtId'],
      _count: true,
    }),
  ]);

  return districts.map(district => ({
    ...district,
    _count: {
      ulbs: ulbCounts.find(c => c.districtId === district.id)?._count || 0,
      gPUs: gpuCounts.find(c => c.districtId === district.id)?._count || 0,
      zPTCs: zptcCounts.find(c => c.districtId === district.id)?._count || 0,
    },
  }));
}

/**
 * Get ULBs by district IDs
 */
export async function getULBsByDistricts(districtIds: string[]): Promise<ULBWithCounts[]> {
  return await db.uLB.findMany({
    where: {
      isActive: true,
      districtId: { in: districtIds },
    },
    include: {
      district: { select: { name: true } },
      _count: { select: { wards: true } },
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Get GPUs by district IDs
 */
export async function getGPUsByDistricts(districtIds: string[]): Promise<GPUWithCounts[]> {
  const gpus = await db.gPU.findMany({
    where: {
      districtId: { in: districtIds },
    },
    include: {
      district: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  // Get panchayat ward counts separately
  const panchayatWardCounts = await db.panchayatWard.groupBy({
    by: ['gpuId'],
    _count: true,
  });

  return gpus.map(gpu => ({
    ...gpu,
    _count: {
      panchayatWards: panchayatWardCounts.find(c => c.gpuId === gpu.id)?._count || 0,
    },
  }));
}

/**
 * Get ZPTCs by district IDs
 */
export async function getZPTCsByDistricts(districtIds: string[]): Promise<ZPTCWithCounts[]> {
  return await db.zPTC.findMany({
    where: {
      districtId: { in: districtIds },
    },
    include: {
      district: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Get complete geographic hierarchy for election type
 */
export async function getGeographicHierarchy(
  electionType: 'MUNICIPAL' | 'PANCHAYAT' | 'ZPTC',
  districtIds?: string[]
): Promise<GeographicHierarchy> {
  const districts = districtIds 
    ? await db.district.findMany({
        where: { 
          id: { in: districtIds },
          isActive: true 
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          code: true,
          isActive: true,
        },
      })
    : await getAllDistricts();

  const hierarchy: GeographicHierarchy = { districts };

  if (electionType === 'MUNICIPAL') {
    hierarchy.ulbs = await getULBsByDistricts(districts.map(d => d.id));
  } else if (electionType === 'PANCHAYAT') {
    hierarchy.gpus = await getGPUsByDistricts(districts.map(d => d.id));
  } else if (electionType === 'ZPTC') {
    hierarchy.zptcs = await getZPTCsByDistricts(districts.map(d => d.id));
  }

  return hierarchy;
}

/**
 * Validate geographic selection for election type
 */
export async function validateGeographicSelection(
  electionType: 'MUNICIPAL' | 'PANCHAYAT' | 'ZPTC',
  selection: {
    districtIds: string[];
    ulbIds?: string[];
    gpuIds?: string[];
    zptcIds?: string[];
  }
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Validate districts exist
  const districts = await db.district.findMany({
    where: { id: { in: selection.districtIds } },
  });
  
  if (districts.length !== selection.districtIds.length) {
    errors.push('One or more selected districts do not exist');
  }

  // Validate election type specific selections
  if (electionType === 'MUNICIPAL') {
    if (!selection.ulbIds?.length) {
      errors.push('MUNICIPAL elections require ULB selection');
    } else {
      const ulbs = await db.uLB.findMany({
        where: { 
          id: { in: selection.ulbIds },
          districtId: { in: selection.districtIds }
        },
      });
      
      if (ulbs.length !== selection.ulbIds.length) {
        errors.push('One or more selected ULBs do not exist or are not in selected districts');
      }
    }
  } else if (electionType === 'PANCHAYAT') {
    if (!selection.gpuIds?.length) {
      errors.push('PANCHAYAT elections require GPU selection');
    } else {
      const gpus = await db.gPU.findMany({
        where: { 
          id: { in: selection.gpuIds },
          districtId: { in: selection.districtIds }
        },
      });
      
      if (gpus.length !== selection.gpuIds.length) {
        errors.push('One or more selected GPUs do not exist or are not in selected districts');
      }
    }
  } else if (electionType === 'ZPTC') {
    if (!selection.zptcIds?.length) {
      errors.push('ZPTC elections require ZPTC selection');
    } else {
      const zptcs = await db.zPTC.findMany({
        where: { 
          id: { in: selection.zptcIds },
          districtId: { in: selection.districtIds }
        },
      });
      
      if (zptcs.length !== selection.zptcIds.length) {
        errors.push('One or more selected ZPTCs do not exist or are not in selected districts');
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Get seat counts for geographic selection
 */
export async function getSeatCounts(
  electionType: 'MUNICIPAL' | 'PANCHAYAT' | 'ZPTC',
  selection: {
    districtIds: string[];
    ulbIds?: string[];
    gpuIds?: string[];
    zptcIds?: string[];
  }
): Promise<number> {
  switch (electionType) {
    case 'MUNICIPAL':
      if (!selection.ulbIds?.length) return 0;
      return await db.ward.count({
        where: {
          ulbId: { in: selection.ulbIds },
          isActive: true,
        },
      });

    case 'PANCHAYAT':
      if (!selection.gpuIds?.length) return 0;
      return await db.panchayatWard.count({
        where: {
          gpuId: { in: selection.gpuIds },
        },
      });

    case 'ZPTC':
      if (!selection.zptcIds?.length) return 0;
      return await db.zPTC.count({
        where: {
          id: { in: selection.zptcIds },
        },
      });

    default:
      return 0;
  }
}

/**
 * Get geographic unit details for display
 */
export async function getGeographicUnitDetails(
  electionType: 'MUNICIPAL' | 'PANCHAYAT' | 'ZPTC',
  unitIds: string[]
) {
  switch (electionType) {
    case 'MUNICIPAL':
      return await db.ward.findMany({
        where: { id: { in: unitIds } },
        include: {
          ulb: {
            include: {
              district: true,
            },
          },
        },
      });

    case 'PANCHAYAT':
      return await db.panchayatWard.findMany({
        where: { id: { in: unitIds } },
        include: {
          gpu: {
            include: {
              district: true,
            },
          },
        },
      });

    case 'ZPTC':
      return await db.zPTC.findMany({
        where: { id: { in: unitIds } },
        include: {
          district: true,
        },
      });

    default:
      return [];
  }
}

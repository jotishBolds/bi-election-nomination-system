// Unified Geographic Service - Standardized CRUD operations for all geographic entities
import "server-only";
import { db } from "@/lib/db";
import { z } from "zod";

// Base interfaces for all entities
export interface BaseGeographicEntity {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isAdmin?: boolean;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// District interfaces
export interface DistrictWithRelations extends BaseGeographicEntity {
  stateId: string;
  state: { id: string; name: string };
  _count?: {
    ulbs: number;
    gpus: number;
    zptcs: number;
  };
}

export interface CreateDistrictInput {
  code: string;
  name: string;
  stateId: string;
}

export interface UpdateDistrictInput {
  code?: string;
  name?: string;
  stateId?: string;
  isActive?: boolean;
}

// ULB interfaces
export interface ULBWithRelations extends BaseGeographicEntity {
  type?: string | null;
  districtId: string;
  district: { id: string; name: string };
  _count?: {
    wards: number;
  };
}

export interface CreateULBInput {
  code: string;
  name: string;
  type?: string;
  districtId: string;
}

export interface UpdateULBInput {
  code?: string;
  name?: string;
  type?: string;
  districtId?: string;
  isActive?: boolean;
}

// GPU interfaces
export interface GPUWithRelations extends BaseGeographicEntity {
  districtId: string;
  district: { id: string; name: string };
  _count?: {
    panchayatWards: number;
  };
}

export interface CreateGPUInput {
  code: string;
  name: string;
  districtId: string;
}

export interface UpdateGPUInput {
  code?: string;
  name?: string;
  districtId?: string;
  isActive?: boolean;
}

// Ward interfaces
export interface WardWithRelations extends BaseGeographicEntity {
  wardNo: number;
  wardName: string;
  ulbId: string;
  constituencyId?: string;
  reservationType?: string;
  ulb: {
    id: string;
    name: string;
    district: { id: string; name: string };
  };
  constituency?: {
    id: string;
    name: string;
  };
}

export interface CreateWardInput {
  wardNo: number;
  wardName: string;
  ulbId: string;
  constituencyId?: string;
  reservationType?: string;
}

export interface UpdateWardInput {
  wardNo?: number;
  wardName?: string;
  ulbId?: string;
  constituencyId?: string;
  reservationType?: string;
  isActive?: boolean;
}

// Panchayat Ward interfaces
export interface PanchayatWardWithRelations {
  id: string;
  wardNo: number;
  name: string;
  reservationType?: string | null;
  isActive: boolean;
  gpuId: string;
  createdAt: Date;
  updatedAt: Date;
  gpu: {
    id: string;
    name: string;
    district: { id: string; name: string };
  };
}

export interface CreatePanchayatWardInput {
  wardNo: number;
  name: string;
  gpuId: string;
  reservationType?: string | null;
}

export interface UpdatePanchayatWardInput {
  wardNo?: number;
  name?: string;
  gpuId?: string;
  reservationType?: string | null;
  isActive?: boolean;
}

// ZPTC interfaces
export interface ZPTCWithRelations {
  id: string;
  code: string;
  name: string;
  districtId: string;
  reservationType?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  district: { id: string; name: string };
}

export interface CreateZPTCInput {
  code: string;
  name: string;
  districtId: string;
  reservationType?: string | null;
}

export interface UpdateZPTCInput {
  code?: string;
  name?: string;
  districtId?: string;
  reservationType?: string | null;
  isActive?: boolean;
}

// Validation schemas
export const createDistrictSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  stateId: z.string().uuid(),
});

export const updateDistrictSchema = z.object({
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(100).optional(),
  stateId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

export const createULBSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  type: z.string().optional(),
  districtId: z.string().uuid(),
});

export const updateULBSchema = z.object({
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(100).optional(),
  type: z.string().optional(),
  districtId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

export const createGPUSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  districtId: z.string().uuid(),
});

export const updateGPUSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(200).optional(),
  districtId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

export const createWardSchema = z.object({
  wardNo: z.number().int().positive(),
  wardName: z.string().min(1).max(100),
  ulbId: z.string().uuid(),
  constituencyId: z.string().uuid().optional(),
  reservationType: z.string().optional(),
});

export const updateWardSchema = z.object({
  wardNo: z.number().int().positive().optional(),
  wardName: z.string().min(1).max(100).optional(),
  ulbId: z.string().uuid().optional(),
  constituencyId: z.string().uuid().optional(),
  reservationType: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createPanchayatWardSchema = z.object({
  wardNo: z.number().int().positive(),
  name: z.string().min(1).max(200),
  gpuId: z.string().uuid(),
  reservationType: z.string().optional(),
});

export const updatePanchayatWardSchema = z.object({
  wardNo: z.number().int().positive().optional(),
  name: z.string().min(1).max(200).optional(),
  gpuId: z.string().uuid().optional(),
  reservationType: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createZPTCSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  districtId: z.string().uuid(),
  reservationType: z.string().optional(),
});

export const updateZPTCSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(200).optional(),
  districtId: z.string().uuid().optional(),
  reservationType: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Base query builder
function buildBaseQuery(params: PaginationParams) {
  const where: any = {};
  
  // For admin users, don't filter by isActive unless explicitly requested
  if (!params.isAdmin && params.isActive !== undefined) {
    where.isActive = params.isActive;
  } else if (params.isAdmin && params.isActive !== undefined) {
    // For admins, only apply isActive filter if explicitly provided
    where.isActive = params.isActive;
  }
  
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { code: { contains: params.search, mode: "insensitive" } },
    ];
  }
  
  return where;
}

function buildOrderClause(sortBy?: string, sortOrder: 'asc' | 'desc' = 'asc') {
  const orderBy: any = {};
  
  if (sortBy) {
    orderBy[sortBy] = sortOrder;
  } else {
    orderBy.name = 'asc';
  }
  
  return orderBy;
}

// District CRUD operations
export async function getDistricts(params: PaginationParams & { stateId?: string }): Promise<PaginationResult<DistrictWithRelations>> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  
  const where = buildBaseQuery(params);
  
  if (params.stateId) {
    where.stateId = params.stateId;
  }
  
  const [districts, total] = await Promise.all([
    db.district.findMany({
      where,
      orderBy: buildOrderClause(params.sortBy, params.sortOrder),
      skip: (page - 1) * limit,
      take: limit,
      include: {
        state: { select: { id: true, name: true } },
      },
    }),
    db.district.count({ where }),
  ]);
  
  // Get counts - for admins, count all, for others, count only active
  const countFilter = params.isAdmin ? {} : { isActive: true };
  const [ulbCounts, gpuCounts, zptcCounts] = await Promise.all([
    db.uLB.groupBy({ by: ['districtId'], _count: true, where: countFilter }),
    db.gPU.groupBy({ by: ['districtId'], _count: true, where: countFilter }),
    db.zPTC.groupBy({ by: ['districtId'], _count: true, where: countFilter }),
  ]);
  
  const districtsWithCounts = districts.map(district => ({
    ...district,
    _count: {
      ulbs: ulbCounts.find(c => c.districtId === district.id)?._count || 0,
      gpus: gpuCounts.find(c => c.districtId === district.id)?._count || 0,
      zptcs: zptcCounts.find(c => c.districtId === district.id)?._count || 0,
    },
  }));
  
  return {
    data: districtsWithCounts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getDistrictById(id: string): Promise<DistrictWithRelations | null> {
  const district = await db.district.findUnique({
    where: { id },
    include: {
      state: { select: { id: true, name: true } },
    },
  });
  
  if (!district) return null;
  
  // Get counts
  const [ulbCount, gpuCount, zptcCount] = await Promise.all([
    db.uLB.count({ where: { districtId: id, isActive: true } }),
    db.gPU.count({ where: { districtId: id, isActive: true } }),
    db.zPTC.count({ where: { districtId: id, isActive: true } }),
  ]);
  
  return {
    ...district,
    _count: {
      ulbs: ulbCount,
      gpus: gpuCount,
      zptcs: zptcCount,
    },
  };
}

export async function createDistrict(data: CreateDistrictInput): Promise<DistrictWithRelations> {
  // Check for duplicate code
  const existingByCode = await db.district.findUnique({
    where: { code: data.code },
  });
  
  if (existingByCode) {
    throw new Error('DUPLICATE_CODE');
  }
  
  // Check for duplicate name in state
  const existingByName = await db.district.findFirst({
    where: { 
      name: data.name,
      stateId: data.stateId,
    },
  });
  
  if (existingByName) {
    throw new Error('DUPLICATE_NAME');
  }
  
  // Verify state exists
  const state = await db.state.findUnique({
    where: { id: data.stateId },
  });
  
  if (!state) {
    throw new Error('FOREIGN_KEY_ERROR');
  }
  
  const district = await db.district.create({
    data,
    include: {
      state: { select: { id: true, name: true } },
    },
  });
  
  return {
    ...district,
    _count: {
      ulbs: 0,
      gpus: 0,
      zptcs: 0,
    },
  };
}

export async function updateDistrict(id: string, data: UpdateDistrictInput): Promise<DistrictWithRelations> {
  const existing = await db.district.findUnique({
    where: { id },
  });
  
  if (!existing) {
    throw new Error('NOT_FOUND');
  }
  
  // Check for duplicate code (if changing)
  if (data.code && data.code !== existing.code) {
    const existingByCode = await db.district.findUnique({
      where: { code: data.code },
    });
    
    if (existingByCode) {
      throw new Error('DUPLICATE_CODE');
    }
  }
  
  // Check for duplicate name in state (if changing)
  if (data.name || data.stateId) {
    const name = data.name || existing.name;
    const stateId = data.stateId || existing.stateId;
    
    if (name !== existing.name || stateId !== existing.stateId) {
      const existingByName = await db.district.findFirst({
        where: { 
          name,
          stateId,
          id: { not: id },
        },
      });
      
      if (existingByName) {
        throw new Error('DUPLICATE_NAME');
      }
    }
  }
  
  // Verify state exists (if changing)
  if (data.stateId && data.stateId !== existing.stateId) {
    const state = await db.state.findUnique({
      where: { id: data.stateId },
    });
    
    if (!state) {
      throw new Error('FOREIGN_KEY_ERROR');
    }
  }
  
  const district = await db.district.update({
    where: { id },
    data,
    include: {
      state: { select: { id: true, name: true } },
    },
  });
  
  // Get counts
  const [ulbCount, gpuCount, zptcCount] = await Promise.all([
    db.uLB.count({ where: { districtId: id, isActive: true } }),
    db.gPU.count({ where: { districtId: id, isActive: true } }),
    db.zPTC.count({ where: { districtId: id, isActive: true } }),
  ]);
  
  return {
    ...district,
    _count: {
      ulbs: ulbCount,
      gpus: gpuCount,
      zptcs: zptcCount,
    },
  };
}

export async function deleteDistrict(id: string): Promise<void> {
  const existing = await db.district.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          ulbs: true,
          gpus: true,
          zptcs: true,
        },
      },
    },
  });
  
  if (!existing) {
    throw new Error('NOT_FOUND');
  }
  
  if (existing._count.ulbs > 0 || existing._count.gpus > 0 || existing._count.zptcs > 0) {
    throw new Error('IN_USE');
  }
  
  await db.district.delete({
    where: { id },
  });
}

// ULB CRUD operations
export async function getULBs(params: PaginationParams & { districtId?: string; districtIds?: string[] }): Promise<PaginationResult<ULBWithRelations>> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  
  const where = buildBaseQuery(params);
  
  if (params.districtId) {
    where.districtId = params.districtId;
  } else if (params.districtIds?.length) {
    where.districtId = { in: params.districtIds };
  }
  
  const orderBy = buildOrderClause(params.sortBy, params.sortOrder);
  
  const [ulbs, total] = await Promise.all([
    db.uLB.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        district: { select: { id: true, name: true } },
        _count: { select: { wards: { where: params.isAdmin ? {} : { isActive: true } } } },
      },
    }),
    db.uLB.count({ where }),
  ]);
  
  return {
    data: ulbs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getULBById(id: string): Promise<ULBWithRelations | null> {
  const ulb = await db.uLB.findUnique({
    where: { id },
    include: {
      district: { select: { id: true, name: true } },
      _count: { select: { wards: true } },
    },
  });
  
  return ulb;
}

export async function createULB(data: CreateULBInput): Promise<ULBWithRelations> {
  // Check for duplicate code
  const existingByCode = await db.uLB.findUnique({
    where: { code: data.code },
  });
  
  if (existingByCode) {
    throw new Error('DUPLICATE_CODE');
  }
  
  // Verify district exists
  const district = await db.district.findUnique({
    where: { id: data.districtId },
  });
  
  if (!district) {
    throw new Error('FOREIGN_KEY_ERROR');
  }
  
  // Validate ULB type if provided
  if (data.type) {
    const validULBTypes = ['MUNICIPAL_CORPORATION', 'MUNICIPALITY', 'NAGAR_PANCHAYAT'];
    if (!validULBTypes.includes(data.type)) {
      throw new Error('INVALID_ULB_TYPE');
    }
  }
  
  const ulb = await db.uLB.create({
    data,
    include: {
      district: { select: { id: true, name: true } },
      _count: { select: { wards: true } },
    },
  });
  
  return ulb;
}

export async function updateULB(id: string, data: UpdateULBInput): Promise<ULBWithRelations> {
  const existing = await db.uLB.findUnique({
    where: { id },
  });
  
  if (!existing) {
    throw new Error('NOT_FOUND');
  }
  
  // Check for duplicate code (if changing)
  if (data.code && data.code !== existing.code) {
    const existingByCode = await db.uLB.findUnique({
      where: { code: data.code },
    });
    
    if (existingByCode) {
      throw new Error('DUPLICATE_CODE');
    }
  }
  
  // Verify district exists (if changing)
  if (data.districtId && data.districtId !== existing.districtId) {
    const district = await db.district.findUnique({
      where: { id: data.districtId },
    });
    
    if (!district) {
      throw new Error('FOREIGN_KEY_ERROR');
    }
  }
  
  // Validate ULB type if provided
  if (data.type) {
    const validULBTypes = ['MUNICIPAL_CORPORATION', 'MUNICIPALITY', 'NAGAR_PANCHAYAT'];
    if (!validULBTypes.includes(data.type)) {
      throw new Error('INVALID_ULB_TYPE');
    }
  }
  
  const ulb = await db.uLB.update({
    where: { id },
    data,
    include: {
      district: { select: { id: true, name: true } },
      _count: { select: { wards: true } },
    },
  });
  
  return ulb;
}

export async function deleteULB(id: string): Promise<void> {
  const existing = await db.uLB.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          wards: true,
        },
      },
    },
  });
  
  if (!existing) {
    throw new Error('NOT_FOUND');
  }
  
  if (existing._count.wards > 0) {
    throw new Error('IN_USE');
  }
  
  await db.uLB.delete({
    where: { id },
  });
}

// GPU CRUD operations
export async function getGPUs(params: PaginationParams & { districtId?: string; districtIds?: string[] }): Promise<PaginationResult<GPUWithRelations>> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  
  const where = buildBaseQuery(params);
  
  if (params.districtId) {
    where.districtId = params.districtId;
  } else if (params.districtIds?.length) {
    where.districtId = { in: params.districtIds };
  }
  
  const orderBy = buildOrderClause(params.sortBy, params.sortOrder);
  
  const [gpus, total] = await Promise.all([
    db.gPU.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        district: { select: { id: true, name: true } },
      },
    }),
    db.gPU.count({ where }),
  ]);
  
  // Get panchayat ward counts - for admins, count all, for others, count only active
  const panchayatWardCounts = await db.panchayatWard.groupBy({
    by: ['gpuId'],
    _count: true,
    where: params.isAdmin ? {} : { isActive: true },
  });
  
  const gpusWithCounts = gpus.map(gpu => ({
    ...gpu,
    _count: {
      panchayatWards: panchayatWardCounts.find(c => c.gpuId === gpu.id)?._count || 0,
    },
  }));
  
  return {
    data: gpusWithCounts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getGPUById(id: string): Promise<GPUWithRelations | null> {
  const gpu = await db.gPU.findUnique({
    where: { id },
    include: {
      district: { select: { id: true, name: true } },
    },
  });
  
  if (!gpu) return null;
  
  const panchayatWardCount = await db.panchayatWard.count({
    where: { gpuId: id, isActive: true },
  });
  
  return {
    ...gpu,
    _count: {
      panchayatWards: panchayatWardCount,
    },
  };
}

export async function createGPU(data: CreateGPUInput): Promise<GPUWithRelations> {
  // Check for duplicate code
  const existingByCode = await db.gPU.findFirst({
    where: { code: data.code },
  });
  
  if (existingByCode) {
    throw new Error('DUPLICATE_CODE');
  }
  
  // Verify district exists
  const district = await db.district.findUnique({
    where: { id: data.districtId },
  });
  
  if (!district) {
    throw new Error('FOREIGN_KEY_ERROR');
  }
  
  const gpu = await db.gPU.create({
    data,
    include: {
      district: { select: { id: true, name: true } },
    },
  });
  
  return {
    ...gpu,
    _count: {
      panchayatWards: 0,
    },
  };
}

export async function updateGPU(id: string, data: UpdateGPUInput): Promise<GPUWithRelations> {
  const existing = await db.gPU.findUnique({
    where: { id },
  });
  
  if (!existing) {
    throw new Error('NOT_FOUND');
  }
  
  // Check for duplicate code (if changing)
  if (data.code && data.code !== existing.code) {
    const existingByCode = await db.gPU.findFirst({
      where: { code: data.code },
    });
    
    if (existingByCode) {
      throw new Error('DUPLICATE_CODE');
    }
  }
  
  // Verify district exists (if changing)
  if (data.districtId && data.districtId !== existing.districtId) {
    const district = await db.district.findUnique({
      where: { id: data.districtId },
    });
    
    if (!district) {
      throw new Error('FOREIGN_KEY_ERROR');
    }
  }
  
  // Only include fields that are actually being updated
  const updateData: any = {};
  if (data.code !== undefined) updateData.code = data.code;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.districtId !== undefined) updateData.districtId = data.districtId;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  const gpu = await db.gPU.update({
    where: { id },
    data: updateData,
    include: {
      district: { select: { id: true, name: true } },
    },
  });
  
  const panchayatWardCount = await db.panchayatWard.count({
    where: { gpuId: id, isActive: true },
  });
  
  return {
    ...gpu,
    _count: {
      panchayatWards: panchayatWardCount,
    },
  };
}

export async function deleteGPU(id: string): Promise<void> {
  const existing = await db.gPU.findUnique({
    where: { id },
  });
  
  if (!existing) {
    throw new Error('NOT_FOUND');
  }
  
  // Check if GPU has associated panchayat wards
  const panchayatWardCount = await db.panchayatWard.count({
    where: { 
      gpuId: id,
      isActive: true 
    }
  });
  
  if (panchayatWardCount > 0) {
    throw new Error('IN_USE');
  }
  
  await db.gPU.delete({
    where: { id },
  });
}

// Ward CRUD operations
export async function getWards(params: PaginationParams & { 
  districtId?: string; 
  districtIds?: string[];
  ulbId?: string;
  ulbIds?: string[];
  constituencyId?: string;
}): Promise<PaginationResult<WardWithRelations>> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  
  const where = buildBaseQuery(params);
  
  // Hierarchical filtering
  if (params.constituencyId) {
    where.constituencyId = params.constituencyId;
  } else if (params.ulbId) {
    where.ulbId = params.ulbId;
  } else if (params.ulbIds?.length) {
    where.ulbId = { in: params.ulbIds };
  } else if (params.districtId) {
    where.ulb = {
      districtId: params.districtId,
      ...(params.isAdmin ? {} : { isActive: true }),
    };
  } else if (params.districtIds?.length) {
    where.ulb = {
      districtId: { in: params.districtIds },
      ...(params.isAdmin ? {} : { isActive: true }),
    };
  }
  
  const orderBy = buildOrderClause(params.sortBy || 'wardNo', params.sortOrder);
  
  const [wards, total] = await Promise.all([
    db.ward.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        ulb: {
          include: {
            district: { select: { id: true, name: true } },
          },
        },
        constituency: { select: { id: true, name: true } },
      },
    }),
    db.ward.count({ where }),
  ]);
  
  return {
    data: wards,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getWardById(id: string): Promise<WardWithRelations | null> {
  const ward = await db.ward.findUnique({
    where: { id },
    include: {
      ulb: {
        include: {
          district: { select: { id: true, name: true } },
        },
      },
      constituency: { select: { id: true, name: true } },
    },
  });
  
  return ward;
}

export async function createWard(data: CreateWardInput): Promise<WardWithRelations> {
  // Verify ULB exists
  const ulb = await db.uLB.findUnique({
    where: { id: data.ulbId },
    include: { district: true },
  });
  
  if (!ulb) {
    throw new Error('FOREIGN_KEY_ERROR');
  }
  
  // Check for duplicate ward number in ULB
  const existingByWardNo = await db.ward.findFirst({
    where: {
      ulbId: data.ulbId,
      wardNo: data.wardNo,
    },
  });
  
  if (existingByWardNo) {
    throw new Error('DUPLICATE_WARD_NO');
  }
  
  // Verify constituency exists (if provided)
  if (data.constituencyId) {
    const constituency = await db.constituency.findUnique({
      where: { id: data.constituencyId },
    });
    
    if (!constituency) {
      throw new Error('FOREIGN_KEY_ERROR');
    }
  }
  
  const ward = await db.ward.create({
    data,
    include: {
      ulb: {
        include: {
          district: { select: { id: true, name: true } },
        },
      },
      constituency: { select: { id: true, name: true } },
    },
  });
  
  return ward;
}

export async function updateWard(id: string, data: UpdateWardInput): Promise<WardWithRelations> {
  const existing = await db.ward.findUnique({
    where: { id },
  });
  
  if (!existing) {
    throw new Error('NOT_FOUND');
  }
  
  // Check for duplicate ward number (if changing)
  if (data.wardNo && data.wardNo !== existing.wardNo) {
    const existingByWardNo = await db.ward.findFirst({
      where: {
        ulbId: data.ulbId || existing.ulbId,
        wardNo: data.wardNo,
        id: { not: id },
      },
    });
    
    if (existingByWardNo) {
      throw new Error('DUPLICATE_WARD_NO');
    }
  }
  
  // Verify ULB exists (if changing)
  if (data.ulbId && data.ulbId !== existing.ulbId) {
    const ulb = await db.uLB.findUnique({
      where: { id: data.ulbId },
    });
    
    if (!ulb) {
      throw new Error('FOREIGN_KEY_ERROR');
    }
  }
  
  // Verify constituency exists (if changing)
  if (data.constituencyId && data.constituencyId !== existing.constituencyId) {
    const constituency = await db.constituency.findUnique({
      where: { id: data.constituencyId },
    });
    
    if (!constituency) {
      throw new Error('FOREIGN_KEY_ERROR');
    }
  }
  
  const ward = await db.ward.update({
    where: { id },
    data,
    include: {
      ulb: {
        include: {
          district: { select: { id: true, name: true } },
        },
      },
      constituency: { select: { id: true, name: true } },
    },
  });
  
  return ward;
}

export async function deleteWard(id: string): Promise<void> {
  const existing = await db.ward.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          electionSeats: true,
        },
      },
    },
  });
  
  if (!existing) {
    throw new Error('NOT_FOUND');
  }
  
  if (existing._count.electionSeats > 0) {
    throw new Error('IN_USE');
  }
  
  await db.ward.delete({
    where: { id },
  });
}

// PanchayatWard CRUD operations
export async function getPanchayatWards(params: PaginationParams & { 
  districtId?: string; 
  districtIds?: string[];
  gpuId?: string;
  gpuIds?: string[];
}): Promise<PaginationResult<PanchayatWardWithRelations>> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  
  const where = buildBaseQuery(params);
  
  // Hierarchical filtering
  if (params.gpuId) {
    where.gpuId = params.gpuId;
  } else if (params.gpuIds?.length) {
    where.gpuId = { in: params.gpuIds };
  } else if (params.districtId) {
    where.gpu = {
      districtId: params.districtId,
      ...(params.isAdmin ? {} : { isActive: true }),
    };
  } else if (params.districtIds?.length) {
    where.gpu = {
      districtId: { in: params.districtIds },
      ...(params.isAdmin ? {} : { isActive: true }),
    };
  }
  
  const orderBy = buildOrderClause(params.sortBy || 'wardNo', params.sortOrder);
  
  const [panchayatWards, total] = await Promise.all([
    db.panchayatWard.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        gpu: {
          include: {
            district: { select: { id: true, name: true } },
          },
        },
      },
    }),
    db.panchayatWard.count({ where }),
  ]);
  
  return {
    data: panchayatWards,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPanchayatWardById(id: string): Promise<PanchayatWardWithRelations | null> {
  const panchayatWard = await db.panchayatWard.findUnique({
    where: { id },
    include: {
      gpu: {
        include: {
          district: { select: { id: true, name: true } },
        },
      },
    },
  });
  
  return panchayatWard;
}

export async function createPanchayatWard(data: CreatePanchayatWardInput): Promise<PanchayatWardWithRelations> {
  // Verify GPU exists
  const gpu = await db.gPU.findUnique({
    where: { id: data.gpuId },
    include: { district: true },
  });
  
  if (!gpu) {
    throw new Error('FOREIGN_KEY_ERROR');
  }
  
  // Check for duplicate ward number in GPU
  const existingByWardNo = await db.panchayatWard.findFirst({
    where: {
      gpuId: data.gpuId,
      wardNo: data.wardNo,
    },
  });
  
  if (existingByWardNo) {
    throw new Error('DUPLICATE_WARD_NO');
  }
  
  const panchayatWard = await db.panchayatWard.create({
    data,
    include: {
      gpu: {
        include: {
          district: { select: { id: true, name: true } },
        },
      },
    },
  });
  
  return panchayatWard;
}

export async function updatePanchayatWard(id: string, data: UpdatePanchayatWardInput): Promise<PanchayatWardWithRelations> {
  const existing = await db.panchayatWard.findUnique({
    where: { id },
  });
  
  if (!existing) {
    throw new Error('NOT_FOUND');
  }
  
  // Check for duplicate ward number (if changing)
  if (data.wardNo && data.wardNo !== existing.wardNo) {
    const existingByWardNo = await db.panchayatWard.findFirst({
      where: {
        gpuId: data.gpuId || existing.gpuId,
        wardNo: data.wardNo,
        id: { not: id },
      },
    });
    
    if (existingByWardNo) {
      throw new Error('DUPLICATE_WARD_NO');
    }
  }
  
  // Verify GPU exists (if changing)
  if (data.gpuId && data.gpuId !== existing.gpuId) {
    const gpu = await db.gPU.findUnique({
      where: { id: data.gpuId },
    });
    
    if (!gpu) {
      throw new Error('FOREIGN_KEY_ERROR');
    }
  }
  
  // Only include fields that are actually being updated
  const updateData: any = {};
  if (data.wardNo !== undefined) updateData.wardNo = data.wardNo;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.gpuId !== undefined) updateData.gpuId = data.gpuId;
  if (data.reservationType !== undefined) updateData.reservationType = data.reservationType;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  const panchayatWard = await db.panchayatWard.update({
    where: { id },
    data: updateData,
    include: {
      gpu: {
        include: {
          district: { select: { id: true, name: true } },
        },
      },
    },
  });
  
  return panchayatWard;
}

export async function deletePanchayatWard(id: string): Promise<void> {
  const existing = await db.panchayatWard.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          electionSeats: true,
        },
      },
    },
  });
  
  if (!existing) {
    throw new Error('NOT_FOUND');
  }
  
  if (existing._count.electionSeats > 0) {
    throw new Error('IN_USE');
  }
  
  await db.panchayatWard.delete({
    where: { id },
  });
}

// ZPTC CRUD operations
export async function getZPTCs(params: PaginationParams & { 
  districtId?: string; 
  districtIds?: string[];
}): Promise<PaginationResult<ZPTCWithRelations>> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  
  const where = buildBaseQuery(params);
  
  if (params.districtId) {
    where.districtId = params.districtId;
  } else if (params.districtIds?.length) {
    where.districtId = { in: params.districtIds };
  }
  
  const orderBy = buildOrderClause(params.sortBy, params.sortOrder);
  
  const [zptcs, total] = await Promise.all([
    db.zPTC.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        district: { select: { id: true, name: true } },
      },
    }),
    db.zPTC.count({ where }),
  ]);
  
  return {
    data: zptcs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getZPTCById(id: string): Promise<ZPTCWithRelations | null> {
  const zptc = await db.zPTC.findUnique({
    where: { id },
    include: {
      district: { select: { id: true, name: true } },
    },
  });
  
  return zptc;
}

export async function createZPTC(data: CreateZPTCInput): Promise<ZPTCWithRelations> {
  // Check for duplicate code
  const existingByCode = await db.zPTC.findFirst({
    where: { code: data.code },
  });
  
  if (existingByCode) {
    throw new Error('DUPLICATE_CODE');
  }
  
  // Verify district exists
  const district = await db.district.findUnique({
    where: { id: data.districtId },
  });
  
  if (!district) {
    throw new Error('FOREIGN_KEY_ERROR');
  }
  
  const zptc = await db.zPTC.create({
    data,
    include: {
      district: { select: { id: true, name: true } },
    },
  });
  
  return zptc;
}

export async function updateZPTC(id: string, data: UpdateZPTCInput): Promise<ZPTCWithRelations> {
  const existing = await db.zPTC.findUnique({
    where: { id },
  });
  
  if (!existing) {
    throw new Error('NOT_FOUND');
  }
  
  // Check for duplicate code (if changing)
  if (data.code && data.code !== existing.code) {
    const existingByCode = await db.zPTC.findFirst({
      where: { code: data.code },
    });
    
    if (existingByCode) {
      throw new Error('DUPLICATE_CODE');
    }
  }
  
  // Verify district exists (if changing)
  if (data.districtId && data.districtId !== existing.districtId) {
    const district = await db.district.findUnique({
      where: { id: data.districtId },
    });
    
    if (!district) {
      throw new Error('FOREIGN_KEY_ERROR');
    }
  }
  
  // Only include fields that are actually being updated
  const updateData: any = {};
  if (data.code !== undefined) updateData.code = data.code;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.districtId !== undefined) updateData.districtId = data.districtId;
  if (data.reservationType !== undefined) updateData.reservationType = data.reservationType;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  const zptc = await db.zPTC.update({
    where: { id },
    data: updateData,
    include: {
      district: { select: { id: true, name: true } },
    },
  });
  
  return zptc;
}

export async function deleteZPTC(id: string): Promise<void> {
  const existing = await db.zPTC.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          electionSeats: true,
        },
      },
    },
  });
  
  if (!existing) {
    throw new Error('NOT_FOUND');
  }
  
  if (existing._count.electionSeats > 0) {
    throw new Error('IN_USE');
  }
  
  await db.zPTC.delete({
    where: { id },
  });
}

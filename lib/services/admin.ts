// Admin Service - System Configuration and User Management
import "server-only";
import { db } from "@/lib/db";
import { Role, ULBType, AuditAction, PaymentStatus } from "@prisma/client";
import { hashPassword } from "@/lib/auth/server-utils";
import crypto from "crypto";

// =====================
// USER MANAGEMENT
// =====================

interface CreateUserInput {
  phone: string;
  email?: string;
  name?: string;
  role: Role;
  jurisdiction?: {
    type: "STATE" | "DISTRICT" | "ULB" | "WARD";
    stateId?: string;
    districtId?: string;
    ulbId?: string;
    wardId?: string;
  };
}

export async function createUser(input: CreateUserInput, createdBy: string) {
  try {
    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await hashPassword(tempPassword);

    const user = await db.user.create({
      data: {
        phone: input.phone,
        email: input.email,
        name: input.name ?? input.phone, // Default to phone if name not provided
        passwordHash: hashedPassword,
        roles: {
          create: {
            role: input.role,
          },
        },
        jurisdictions: input.jurisdiction
          ? {
              create: {
                type: input.jurisdiction.type,
                stateId: input.jurisdiction.stateId,
                districtId: input.jurisdiction.districtId,
                ulbId: input.jurisdiction.ulbId,
                wardId: input.jurisdiction.wardId,
              },
            }
          : undefined,
      },
      include: {
        roles: true,
        jurisdictions: true,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: createdBy,
        action: AuditAction.CREATE,
        entityType: "User",
        entityId: user.id,
        newValues: { phone: user.phone, role: input.role },
        ipAddress: "system",
      },
    });

    return {
      success: true,
      user,
      tempPassword, // To be sent via SMS/email
    };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "User with this phone already exists" };
    }
    console.error("Create user error:", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function getUsers(options: {
  role?: Role;
  stateId?: string;
  districtId?: string;
  ulbId?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const {
    role,
    stateId,
    districtId,
    ulbId,
    page = 1,
    limit = 50,
    search,
  } = options;

  const whereClause: any = {};

  if (role) {
    whereClause.roles = { some: { role } };
  }

  if (stateId || districtId || ulbId) {
    whereClause.jurisdictions = {
      some: {
        ...(stateId && { stateId }),
        ...(districtId && { districtId }),
        ...(ulbId && { ulbId }),
      },
    };
  }

  if (search) {
    whereClause.OR = [
      { phone: { contains: search } },
      { email: { contains: search } },
      { name: { contains: search } },
    ];
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where: whereClause,
      include: {
        roles: true,
        jurisdictions: {
          include: {
            state: { select: { name: true } },
            district: { select: { name: true } },
            ulb: { select: { name: true } },
            ward: { select: { wardName: true, wardNo: true } },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.user.count({ where: whereClause }),
  ]);

  return {
    success: true,
    users: users.map((u) => ({
      ...u,
      passwordHash: undefined, // Don't expose password hash
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateUser(
  userId: string,
  data: { name?: string; email?: string; isActive?: boolean },
  updatedBy: string,
) {
  try {
    const oldUser = await db.user.findUnique({ where: { id: userId } });

    const user = await db.user.update({
      where: { id: userId },
      data,
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: updatedBy,
        action: AuditAction.UPDATE,
        entityType: "User",
        entityId: userId,
        oldValues: oldUser ? JSON.parse(JSON.stringify(oldUser)) : undefined,
        newValues: data,
        ipAddress: "system",
      },
    });

    return { success: true, user };
  } catch (error) {
    console.error("Update user error:", error);
    return { success: false, error: "Failed to update user" };
  }
}

export async function deactivateUser(userId: string, deactivatedBy: string) {
  return updateUser(userId, { isActive: false }, deactivatedBy);
}

// =====================
// JURISDICTION MANAGEMENT
// =====================

export async function createState(
  data: { name: string; code: string },
  createdBy: string,
) {
  try {
    const state = await db.state.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
      },
    });

    await db.auditLog.create({
      data: {
        userId: createdBy,
        action: AuditAction.CREATE,
        entityType: "State",
        entityId: state.id,
        newValues: data,
        ipAddress: "system",
      },
    });

    return { success: true, state };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "State with this code already exists" };
    }
    return { success: false, error: "Failed to create state" };
  }
}

export async function createDistrict(
  data: { stateId: string; name: string; code: string },
  createdBy: string,
) {
  try {
    const district = await db.district.create({
      data: {
        stateId: data.stateId,
        name: data.name,
        code: data.code.toUpperCase(),
      },
    });

    await db.auditLog.create({
      data: {
        userId: createdBy,
        action: AuditAction.CREATE,
        entityType: "District",
        entityId: district.id,
        newValues: data,
        ipAddress: "system",
      },
    });

    return { success: true, district };
  } catch (error: any) {
    if (error.code === "P2002") {
      return {
        success: false,
        error: "District with this code already exists in this state",
      };
    }
    return { success: false, error: "Failed to create district" };
  }
}

export async function createULB(
  data: {
    districtId: string;
    name: string;
    code: string;
    type: string;
  },
  createdBy: string,
) {
  try {
    const ulb = await db.uLB.create({
      data: {
        districtId: data.districtId,
        name: data.name,
        code: data.code.toUpperCase(),
        type: data.type as import("@prisma/client").ULBType,
      },
    });

    await db.auditLog.create({
      data: {
        userId: createdBy,
        action: AuditAction.CREATE,
        entityType: "ULB",
        entityId: ulb.id,
        newValues: data,
        ipAddress: "system",
      },
    });

    return { success: true, ulb };
  } catch (error: any) {
    if (error.code === "P2002") {
      return {
        success: false,
        error: "ULB with this code already exists in this district",
      };
    }
    return { success: false, error: "Failed to create ULB" };
  }
}

export async function createWard(
  data: {
    ulbId: string;
    wardName: string;
    wardNo: number;
    reservationType?: string;
  },
  createdBy: string,
) {
  try {
    const ward = await db.ward.create({
      data: {
        ulbId: data.ulbId,
        wardName: data.wardName,
        wardNo: data.wardNo,
        reservationType: data.reservationType as any,
      },
    });

    await db.auditLog.create({
      data: {
        userId: createdBy,
        action: AuditAction.CREATE,
        entityType: "Ward",
        entityId: ward.id,
        newValues: data,
        ipAddress: "system",
      },
    });

    return { success: true, ward };
  } catch (error: any) {
    if (error.code === "P2002") {
      return {
        success: false,
        error: "Ward number already exists in this ULB",
      };
    }
    return { success: false, error: "Failed to create ward" };
  }
}

export async function getJurisdictions(
  type: "states" | "districts" | "ulbs" | "wards",
  parentId?: string,
) {
  switch (type) {
    case "states":
      return db.state.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: { select: { districts: true } },
        },
      });

    case "districts":
      return db.district.findMany({
        where: parentId ? { stateId: parentId } : undefined,
        orderBy: { name: "asc" },
        include: {
          state: { select: { name: true } },
          _count: { select: { ulbs: true } },
        },
      });

    case "ulbs":
      return db.uLB.findMany({
        where: parentId ? { districtId: parentId } : undefined,
        orderBy: { name: "asc" },
        include: {
          district: { select: { name: true } },
          _count: { select: { wards: true } },
        },
      });

    case "wards":
      return db.ward.findMany({
        where: parentId ? { ulbId: parentId } : undefined,
        orderBy: { wardNo: "asc" },
        include: {
          ulb: { select: { name: true } },
        },
      });

    default:
      return [];
  }
}

// =====================
// ELECTION CONFIGURATION
// =====================

interface ElectionConfigInput {
  name: string;
  year: number;
  type: string;
  notificationDate: Date;
  nominationStartDate: Date;
  nominationEndDate: Date;
  scrutinyDate: Date;
  withdrawalStartDate: Date;
  withdrawalEndDate: Date;
  dailyStartTime?: string; // "09:00"
  dailyEndTime?: string; // "15:00"
  nominationFee: number;
  scStFeeDiscount?: number;
  maxNominationsPerCandidate?: number;
  maxProposersRequired?: number;
}

export async function createElectionConfig(
  input: ElectionConfigInput,
  createdBy: string,
) {
  try {
    // Deactivate all existing configs
    await db.electionConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const config = await db.electionConfig.create({
      data: {
        name: input.name,
        year: input.year,
        type: input.type,
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

    // Create day modules (7 nomination + 1 scrutiny + 2 withdrawal)
    const dayModules = [];
    for (let i = 1; i <= 10; i++) {
      let date: Date;
      let nominationEnabled = false;
      let scrutinyEnabled = false;
      let withdrawalEnabled = false;

      if (i <= 7) {
        nominationEnabled = true;
        date = new Date(input.nominationStartDate);
        date.setDate(date.getDate() + (i - 1));
      } else if (i === 8) {
        scrutinyEnabled = true;
        date = input.scrutinyDate;
      } else {
        withdrawalEnabled = true;
        date = new Date(input.withdrawalStartDate);
        date.setDate(date.getDate() + (i - 9));
      }

      dayModules.push({
        electionId: config.id,
        dayNumber: i,
        date,
        nominationEnabled,
        scrutinyEnabled,
        withdrawalEnabled,
      });
    }

    await db.dayModuleConfig.createMany({
      data: dayModules,
    });

    await db.auditLog.create({
      data: {
        userId: createdBy,
        action: AuditAction.CREATE,
        entityType: "ElectionConfig",
        entityId: config.id,
        newValues: JSON.parse(JSON.stringify(input)),
        ipAddress: "system",
      },
    });

    return { success: true, config };
  } catch (error) {
    console.error("Create election config error:", error);
    return { success: false, error: "Failed to create election configuration" };
  }
}

export async function getElectionConfigs() {
  return db.electionConfig.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function updateElectionConfig(
  configId: string,
  data: Partial<ElectionConfigInput>,
  updatedBy: string,
) {
  try {
    const oldConfig = await db.electionConfig.findUnique({
      where: { id: configId },
    });

    const config = await db.electionConfig.update({
      where: { id: configId },
      data,
    });

    await db.auditLog.create({
      data: {
        userId: updatedBy,
        action: AuditAction.UPDATE,
        entityType: "ElectionConfig",
        entityId: configId,
        oldValues: oldConfig
          ? JSON.parse(JSON.stringify(oldConfig))
          : undefined,
        newValues: JSON.parse(JSON.stringify(data)),
        ipAddress: "system",
      },
    });

    return { success: true, config };
  } catch (error) {
    console.error("Update election config error:", error);
    return { success: false, error: "Failed to update election configuration" };
  }
}

// =====================
// VOTER DATABASE MANAGEMENT
// =====================

interface VoterRecordInput {
  epicNo: string;
  name: string;
  fatherHusbandName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: Date;
  age: number;
  address: string;
  partNo: string;
  serialNo: string;
  ulbId: string;
  wardId: string;
  photo?: string;
  dbVersionId: string;
}

export async function importVoterRecords(
  records: VoterRecordInput[],
  importedBy: string,
): Promise<{ success: boolean; imported: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;

  for (const record of records) {
    try {
      await db.voterRecord.upsert({
        where: { epicNo: record.epicNo },
        update: {
          name: record.name,
          fatherHusbandName: record.fatherHusbandName,
          gender: record.gender,
          dateOfBirth: record.dateOfBirth,
          age: record.age,
          address: record.address,
          partNo: record.partNo,
          serialNo: record.serialNo,
          ulbId: record.ulbId,
          wardId: record.wardId,
          photo: record.photo,
          dbVersionId: record.dbVersionId,
        },
        create: {
          epicNo: record.epicNo,
          name: record.name,
          fatherHusbandName: record.fatherHusbandName,
          gender: record.gender,
          dateOfBirth: record.dateOfBirth,
          age: record.age,
          address: record.address,
          partNo: record.partNo,
          serialNo: record.serialNo,
          ulbId: record.ulbId,
          wardId: record.wardId,
          photo: record.photo,
          dbVersionId: record.dbVersionId,
        },
      });
      imported++;
    } catch (error: any) {
      errors.push(`Failed to import voter ${record.epicNo}: ${error.message}`);
    }
  }

  // Audit log
  await db.auditLog.create({
    data: {
      userId: importedBy,
      action: AuditAction.VOTER_DB_UPLOADED,
      entityType: "VoterRecord",
      newValues: {
        totalRecords: records.length,
        imported,
        errors: errors.length,
      },
      ipAddress: "system",
    },
  });

  return { success: true, imported, errors };
}

export async function getVoterRecordStats(wardId?: string) {
  const whereClause = wardId ? { wardId } : undefined;

  const [total, byWard] = await Promise.all([
    db.voterRecord.count({ where: whereClause }),
    db.voterRecord.groupBy({
      by: ["wardId"],
      where: whereClause,
      _count: { wardId: true },
    }),
  ]);

  return { total, byWard };
}

// =====================
// POLITICAL PARTY & SYMBOL MANAGEMENT
// =====================

export async function createPoliticalParty(
  data: {
    name: string;
    abbreviation: string;
    isRecognized?: boolean;
    isNational?: boolean;
    isState?: boolean;
  },
  createdBy: string,
) {
  try {
    const party = await db.politicalParty.create({ data });

    await db.auditLog.create({
      data: {
        userId: createdBy,
        action: AuditAction.CREATE,
        entityType: "PoliticalParty",
        entityId: party.id,
        newValues: data,
        ipAddress: "system",
      },
    });

    return { success: true, party };
  } catch (error: any) {
    if (error.code === "P2002") {
      return {
        success: false,
        error: "Party with this name or abbreviation already exists",
      };
    }
    return { success: false, error: "Failed to create party" };
  }
}

export async function getPoliticalParties() {
  return db.politicalParty.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createElectionSymbol(
  data: {
    name: string;
    imagePath: string;
    isReserved?: boolean;
    isActive?: boolean;
    displayOrder?: number;
  },
  createdBy: string,
) {
  try {
    const symbol = await db.electionSymbol.create({ data });

    await db.auditLog.create({
      data: {
        userId: createdBy,
        action: AuditAction.CREATE,
        entityType: "ElectionSymbol",
        entityId: symbol.id,
        newValues: data,
        ipAddress: "system",
      },
    });

    return { success: true, symbol };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "Symbol with this name already exists" };
    }
    return { success: false, error: "Failed to create symbol" };
  }
}

export async function getElectionSymbols(options?: {
  isReserved?: boolean;
  isActive?: boolean;
}) {
  const whereClause: any = { isActive: true };
  if (options?.isReserved !== undefined)
    whereClause.isReserved = options.isReserved;
  if (options?.isActive !== undefined) whereClause.isActive = options.isActive;

  return db.electionSymbol.findMany({
    where: whereClause,
    include: {
      parties: { select: { name: true, abbreviation: true } },
    },
    orderBy: { displayOrder: "asc" },
  });
}

// =====================
// SYSTEM HEALTH & STATS
// =====================

export async function getSystemStats() {
  const [
    totalUsers,
    totalROs,
    totalNominations,
    totalPayments,
    totalStates,
    totalDistricts,
    totalULBs,
    totalWards,
    totalVoterRecords,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { roles: { some: { role: Role.RO } } } }),
    db.nominationApplication.count(),
    db.payment.count({ where: { status: PaymentStatus.PAID } }),
    db.state.count(),
    db.district.count(),
    db.uLB.count(),
    db.ward.count(),
    db.voterRecord.count(),
  ]);

  return {
    users: {
      total: totalUsers,
      ros: totalROs,
    },
    nominations: totalNominations,
    payments: totalPayments,
    jurisdictions: {
      states: totalStates,
      districts: totalDistricts,
      ulbs: totalULBs,
      wards: totalWards,
    },
    voterRecords: totalVoterRecords,
  };
}

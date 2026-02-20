/**
 * Unified RO Jurisdiction Service
 */

import "server-only";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

export interface ROJurisdictionData {
  districtIds: string[];
  ulbIds: string[];
  wardIds: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Core: fetch raw jurisdiction data for an RO
// ─────────────────────────────────────────────────────────────────────────────

export async function getROJurisdictions(
  userId: string,
): Promise<ROJurisdictionData> {
  const rows = await db.userJurisdiction.findMany({
    where: { userId, isActive: true },
    select: {
      districtId: true,
      ulbId: true,
      wardId: true,
    },
  });

  if (rows.length === 0) {
    throw new Error("NO_JURISDICTION_ASSIGNED");
  }

  return {
    districtIds: rows
      .filter((r) => r.districtId != null)
      .map((r) => r.districtId as string),
    ulbIds: rows
      .filter((r) => r.ulbId != null)
      .map((r) => r.ulbId as string),
    wardIds: rows
      .filter((r) => r.wardId != null)
      .map((r) => r.wardId as string),
  };
}

/**
 * Returns true if the RO has access to the given ward — either by direct ward
 * assignment, ULB assignment (containing that ward), or district assignment
 * (containing the ULB that contains that ward).
 */
export async function hasAccessToWard(
  userId: string,
  wardId: string,
): Promise<boolean> {
  const { districtIds, ulbIds, wardIds } = await getROJurisdictions(userId);

  // 1. Direct ward assignment
  if (wardIds.includes(wardId)) return true;

  // 2. Check if ward belongs to an assigned ULB or district
  const ward = await db.ward.findUnique({
    where: { id: wardId },
    select: {
      ulb: {
        select: { id: true, districtId: true },
      },
    },
  });

  if (!ward) return false;

  // 3. ULB-level assignment
  if (ulbIds.includes(ward.ulb.id)) return true;

  // 4. District-level assignment
  if (districtIds.includes(ward.ulb.districtId)) return true;

  return false;
}

export interface FilterAccessInput {
  userId: string;
  role: Role;
  districtId?: string;
  ulbId?: string;
  wardId?: string;
}

/**
 * Validates that the requesting user (if RO) is allowed to use the given
 * districtId / ulbId / wardId as query filters.
 * SUPER_ADMIN and SES bypass all checks.
 * Throws error strings that callers map to HTTP 403 responses.
 */
export async function validateFilterAccess({
  userId,
  role,
  districtId,
  ulbId,
  wardId,
}: FilterAccessInput): Promise<void> {
  // Non-RO roles have unrestricted access
  if (role !== Role.RO) return;

  const { districtIds, ulbIds, wardIds } = await getROJurisdictions(userId);

  // District filter check
  if (districtId) {
    if (!districtIds.includes(districtId)) {
      throw new Error("UNAUTHORIZED_DISTRICT_ACCESS");
    }
  }

  // ULB filter check — allow if directly assigned, or if its district is assigned
  if (ulbId) {
    if (ulbIds.includes(ulbId)) return;

    const ulb = await db.uLB.findUnique({
      where: { id: ulbId },
      select: { districtId: true },
    });

    if (!ulb || !districtIds.includes(ulb.districtId)) {
      throw new Error("UNAUTHORIZED_ULB_ACCESS");
    }
  }

  // Ward filter check — allow if directly assigned, or via ULB/district
  if (wardId) {
    if (wardIds.includes(wardId)) return;

    const ward = await db.ward.findUnique({
      where: { id: wardId },
      select: {
        ulb: { select: { id: true, districtId: true } },
      },
    });

    if (!ward) throw new Error("WARD_NOT_FOUND");

    if (
      !ulbIds.includes(ward.ulb.id) &&
      !districtIds.includes(ward.ulb.districtId)
    ) {
      throw new Error("UNAUTHORIZED_WARD_ACCESS");
    }
  }
}

/**
 * Builds a Prisma-compatible `ward` relation filter that restricts a
 * NominationApplication query to only the wards the RO has access to.
 * Returns null if the RO has no jurisdictions (caller should return empty []).
 */
export async function buildJurisdictionFilter(
  userId: string,
): Promise<Record<string, unknown> | null> {
  let jurisdictions: ROJurisdictionData;

  try {
    jurisdictions = await getROJurisdictions(userId);
  } catch (e: any) {
    if (e.message === "NO_JURISDICTION_ASSIGNED") return null;
    throw e;
  }

  const { districtIds, ulbIds, wardIds } = jurisdictions;

  // Nothing assigned at all
  if (
    districtIds.length === 0 &&
    ulbIds.length === 0 &&
    wardIds.length === 0
  ) {
    return null;
  }

  // Build OR clauses for each level that is populated
  const orClauses: Record<string, unknown>[] = [];

  if (wardIds.length > 0) {
    orClauses.push({ id: { in: wardIds } });
  }

  if (ulbIds.length > 0) {
    orClauses.push({ ulbId: { in: ulbIds } });
  }

  if (districtIds.length > 0) {
    orClauses.push({ ulb: { districtId: { in: districtIds } } });
  }

  // If only one clause, no need for OR
  if (orClauses.length === 1) return orClauses[0];

  return { OR: orClauses };
}

/**
 * If explicitly passed, returns `districtId` as-is.
 * If not passed and user is RO, auto-resolves their first assigned districtId.
 * SUPER_ADMIN / SES with no districtId return null (no auto-scoping).
 */
export async function getEffectiveDistrictId(
  userId: string,
  role: Role,
  districtId?: string | null,
): Promise<string | null> {
  if (districtId) return districtId;

  if (role !== Role.RO) return null;

  const { districtIds } = await getROJurisdictions(userId);

  if (districtIds.length === 0) throw new Error("NO_JURISDICTION_ASSIGNED");

  return districtIds[0];
}

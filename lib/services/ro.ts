// RO (Returning Officer) Service - Server-side business logic
import "server-only";
import { db } from "@/lib/db";
import { NominationStatus, AuditAction } from "@prisma/client";
import { validateActionAllowed } from "@/lib/services/election-time";
import {
  sendNotification,
  NotificationTemplates,
} from "@/lib/services/notifications";
import {
  hasAccessToWard,
  buildJurisdictionFilter,
} from "@/lib/services/ro-jurisdiction";
import { generateOTP, hashOTP, getClientIP } from "@/lib/auth/server-utils";
import { storeOTP, verifyOTP } from "@/lib/memory-store";
import { OTPType, OTPStatus } from "@prisma/client";

interface ReceiveNominationInput {
  nominationId: string;
  roUserId: string;
  ipAddress: string;
  otpVerified: boolean;
}

interface ScrutinyInput {
  nominationId: string;
  roUserId: string;
  decision: "ACCEPTED" | "REJECTED";
  remarks?: string;
  rejectionReasons?: string;
  ipAddress: string;
  otpVerified: boolean;
}

interface WithdrawalInput {
  nominationId: string;
  roUserId: string;
  reason: string;
  ipAddress: string;
  otpVerified: boolean;
}

// NOTE: validateROJurisdiction has been replaced by hasAccessToWard()
// from @/lib/services/ro-jurisdiction. All callers below use that directly.

// Get nominations for RO's jurisdiction
export async function getRONominations(
  roUserId: string,
  filters?: {
    status?: NominationStatus[];
    wardId?: string;
    ulbId?: string;
    search?: string;
  },
) {
  const wardFilter = await buildJurisdictionFilter(roUserId);
  if (!wardFilter) return [];

  const where: any = { ward: wardFilter };

  if (filters?.status?.length) {
    where.status = { in: filters.status };
  }

  // Narrow to a specific ward (overrides broader ward filter)
  if (filters?.wardId) {
    where.wardId = filters.wardId;
    delete where.ward;
  }

  if (filters?.ulbId) {
    where.ulbId = filters.ulbId;
  }

  if (filters?.search) {
    where.OR = [
      { applicationNo: { contains: filters.search, mode: "insensitive" } },
      { candidateName: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return db.nominationApplication.findMany({
    where,
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
        },
      },
      brPayments: true,
      documents: true,
      proposers: true,
      symbolPreferences: {
        include: {
          symbol: true,
        },
      },
      statusHistory: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { submittedAt: "desc" },
  });
}

// Receive nomination (confirm receipt with OTP)
export async function receiveNomination(
  input: ReceiveNominationInput,
): Promise<{ success: boolean; nomination?: any; error?: string }> {
  try {
    const nomination = await db.nominationApplication.findUnique({
      where: { id: input.nominationId },
      include: {
        applicantProfile: {
          include: {
            user: true,
          },
        },
        ward: true,
      },
    });

    if (!nomination) {
      return { success: false, error: "Nomination not found" };
    }

    // Will use this later on when we know if the status needs to be strictly in submitted status
    if (nomination.status !== NominationStatus.SUBMITTED) {
      return { success: false, error: "Nomination is not in submitted status" };
    }

    // Validate RO jurisdiction
    const hasJurisdiction = await hasAccessToWard(
      input.roUserId,
      nomination.wardId,
    );
    if (!hasJurisdiction) {
      return {
        success: false,
        error: "You don't have jurisdiction for this ward",
      };
    }

    if (!input.otpVerified) {
      return { success: false, error: "OTP verification required" };
    }

    // Update nomination
    const updatedNomination = await db.nominationApplication.update({
      where: { id: input.nominationId },
      data: {
        status: NominationStatus.RECEIVED,
        receivedAt: new Date(),
        receivedBy: input.roUserId,
        receiptOtpVerified: true,
      },
    });

    // Create status history
    await db.nominationStatusHistory.create({
      data: {
        nominationId: nomination.id,
        fromStatus: NominationStatus.SUBMITTED,
        toStatus: NominationStatus.RECEIVED,
        changedBy: input.roUserId,
        ipAddress: input.ipAddress,
        remarks: "Nomination received by Returning Officer",
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: input.roUserId,
        action: AuditAction.NOMINATION_RECEIVED,
        entityType: "NominationApplication",
        entityId: nomination.id,
        oldValues: { status: NominationStatus.SUBMITTED },
        newValues: { status: NominationStatus.RECEIVED },
        ipAddress: input.ipAddress,
      },
    });

    // Send notification to candidate
    const user = nomination.applicantProfile.user;
    await sendNotification(
      user.phone,
      user.email,
      "Nomination Received",
      NotificationTemplates.NOMINATION_RECEIVED(nomination.applicationNo),
    );

    return { success: true, nomination: updatedNomination };
  } catch (error) {
    console.error("Receive nomination error:", error);
    return { success: false, error: "Failed to receive nomination" };
  }
}

/**
 * Sends an OTP to the RO user to authorize an action (RECEIPT, SCRUTINY, WITHDRAWAL)
 */
export async function sendROOTP(
  nominationId: string,
  roUserId: string,
  ipAddress: string,
  actionType: OTPType,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify nomination existence and status
    const nomination = await db.nominationApplication.findUnique({
      where: { id: nominationId },
      select: { status: true, wardId: true },
    });

    if (!nomination) {
      return { success: false, error: "Nomination not found" };
    }

    // Verify RO jurisdiction
    const hasJurisdiction = await hasAccessToWard(roUserId, nomination.wardId);
    if (!hasJurisdiction) {
      return {
        success: false,
        error: "Access denied - not in your jurisdiction",
      };
    }

    // Get RO phone number and email
    const roUser = await db.user.findUnique({
      where: { id: roUserId },
      select: { phone: true, email: true },
    });

    if (!roUser || !roUser.phone) {
      return {
        success: false,
        error: "RO phone number not found for verification",
      };
    }

    const identifier = roUser.phone.trim();

    // Generate 6-digit OTP
    const otp = generateOTP(6);
    const otpHash = hashOTP(otp);
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || "15");
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Store in Redis for quick verification
    await storeOTP(identifier, otpHash, actionType, expiryMinutes * 60);

    // Create entry in database (OTPLog) for audit
    await db.oTPLog.create({
      data: {
        userId: roUserId,
        phone: identifier,
        email: roUser.email,
        otpHash,
        type: actionType,
        status: OTPStatus.PENDING,
        maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || "3"),
        expiresAt,
        ipAddress,
      },
    });

    // Action name for notification
    const actionName =
      actionType === "RECEIPT_CONFIRMATION"
        ? "Nomination Receipt"
        : actionType === "SCRUTINY"
          ? "Nomination Scrutiny"
          : "Nomination Withdrawal";

    // Send notification to RO
    await sendNotification(
      roUser.phone,
      roUser.email,
      `${actionName} Authorization`,
      NotificationTemplates.OTP(otp, expiryMinutes),
    );

    console.info(
      `[RO-Auth] Sent ${actionType} OTP to RO (${roUser.phone}) for nomination ${nominationId}`,
    );
    if (process.env.NODE_ENV === "development") {
      console.info(`[DEV] RO OTP: ${otp}`);
    }

    return { success: true };
  } catch (error) {
    console.error("sendROOTP error:", error);
    return { success: false, error: "Failed to send authorization OTP" };
  }
}

/**
 * Internal helper to verify RO OTP
 */
async function verifyROOTP(
  identifier: string,
  otp: string,
  roUserId: string,
  actionType: OTPType,
): Promise<{ success: boolean; error?: string }> {
  const otpHash = hashOTP(otp.trim());

  console.info(
    `[RO-Auth] Attempting verification for RO ${roUserId} (${identifier}) as ${actionType}`,
  );

  // Verify OTP via Redis
  const verification = await verifyOTP(identifier, otpHash, actionType);

  if (!verification.valid) {
    console.warn(
      `[RO-Auth] Verification failed for ${identifier}: valid=${verification.valid}, expired=${verification.expired}, maxAttempts=${verification.maxAttemptsReached}`,
    );
    if (verification.expired) return { success: false, error: "OTP expired" };
    if (verification.maxAttemptsReached)
      return { success: false, error: "Maximum attempts reached" };
    return { success: false, error: "Invalid OTP" };
  }

  // Update OTP log in database
  try {
    const otpLog = await db.oTPLog.findFirst({
      where: {
        OR: [{ userId: roUserId }, { phone: identifier }],
        type: actionType,
        status: OTPStatus.PENDING,
      },
      orderBy: { createdAt: "desc" },
    });

    if (otpLog) {
      await db.oTPLog.update({
        where: { id: otpLog.id },
        data: {
          status: OTPStatus.VERIFIED,
          verifiedAt: new Date(),
        },
      });
      console.info(
        `[RO-Auth] OTP verified for RO ${roUserId} (Log ID: ${otpLog.id})`,
      );
    }
  } catch (dbError) {
    console.warn("Failed to update OTP log in database:", dbError);
  }

  return { success: true };
}

/**
 * Legacy wrapper for receipt OTP (can be refactored later if desired)
 */
export async function sendROReceiptOTP(
  nominationId: string,
  roUserId: string,
  ipAddress: string,
): Promise<{ success: boolean; error?: string }> {
  return sendROOTP(
    nominationId,
    roUserId,
    ipAddress,
    OTPType.RECEIPT_CONFIRMATION,
  );
}

/**
 * Verifies RO OTP and marks nomination as RECEIVED
 */
export async function receiveNominationWithROOTP(
  nominationId: string,
  otp: string,
  roUserId: string,
  ipAddress: string,
): Promise<{ success: boolean; nomination?: any; error?: string }> {
  try {
    // Get RO details
    const roUser = await db.user.findUnique({
      where: { id: roUserId },
      select: { phone: true },
    });

    if (!roUser || !roUser.phone) {
      return { success: false, error: "RO user not found or phone missing" };
    }

    const verification = await verifyROOTP(
      roUser.phone.trim(),
      otp,
      roUserId,
      OTPType.RECEIPT_CONFIRMATION,
    );

    if (!verification.success) {
      return { success: false, error: verification.error };
    }

    // Call existing receipt logic
    return receiveNomination({
      nominationId,
      roUserId,
      ipAddress,
      otpVerified: true,
    });
  } catch (error) {
    console.error("receiveNominationWithROOTP error:", error);
    return { success: false, error: "Failed to verify and process receipt" };
  }
}

/**
 * Verifies RO OTP and performs scrutiny
 */
export async function scrutinizeNominationWithROOTP(
  input: Omit<ScrutinyInput, "otpVerified"> & { otp: string },
): Promise<{ success: boolean; nomination?: any; error?: string }> {
  try {
    const rawOtp = input.otp.trim();
    // Get RO details
    const roUser = await db.user.findUnique({
      where: { id: input.roUserId },
      select: { phone: true },
    });

    if (!roUser || !roUser.phone) {
      return { success: false, error: "RO user not found or phone missing" };
    }

    const verification = await verifyROOTP(
      roUser.phone.trim(),
      rawOtp,
      input.roUserId,
      OTPType.SCRUTINY,
    );

    if (!verification.success) {
      return { success: false, error: verification.error };
    }

    return scrutinizeNomination({
      ...input,
      otpVerified: true,
    });
  } catch (error) {
    console.error("scrutinizeNominationWithROOTP error:", error);
    return { success: false, error: "Failed to verify and process scrutiny" };
  }
}

/**
 * Verifies RO OTP and performs withdrawal
 */
export async function processWithdrawalWithROOTP(
  input: Omit<WithdrawalInput, "otpVerified"> & { otp: string },
): Promise<{ success: boolean; nomination?: any; error?: string }> {
  try {
    const rawOtp = input.otp.trim();
    // Get RO details
    const roUser = await db.user.findUnique({
      where: { id: input.roUserId },
      select: { phone: true },
    });

    if (!roUser || !roUser.phone) {
      return { success: false, error: "RO user not found or phone missing" };
    }

    const verification = await verifyROOTP(
      roUser.phone.trim(),
      rawOtp,
      input.roUserId,
      OTPType.WITHDRAWAL,
    );

    if (!verification.success) {
      return { success: false, error: verification.error };
    }

    return processWithdrawal({
      ...input,
      otpVerified: true,
    });
  } catch (error) {
    console.error("processWithdrawalWithROOTP error:", error);
    return { success: false, error: "Failed to verify and process withdrawal" };
  }
}

// Scrutinize nomination
export async function scrutinizeNomination(
  input: ScrutinyInput,
): Promise<{ success: boolean; nomination?: any; error?: string }> {
  try {
    // Check if scrutiny is allowed today
    const actionCheck = await validateActionAllowed("scrutiny");
    if (!actionCheck.allowed) {
      return { success: false, error: actionCheck.reason };
    }

    const nomination = await db.nominationApplication.findUnique({
      where: { id: input.nominationId },
      include: {
        applicantProfile: {
          include: {
            user: true,
          },
        },
        ward: true,
      },
    });

    if (!nomination) {
      return { success: false, error: "Nomination not found" };
    }

    if (nomination.status !== NominationStatus.RECEIVED && nomination.status !== NominationStatus.UNDER_SCRUTINY) {
      return {
        success: false,
        error: "Nomination must be received or under scrutiny before scrutiny",
      };
    }

    // Validate RO jurisdiction
    const hasJurisdiction = await hasAccessToWard(
      input.roUserId,
      nomination.wardId,
    );
    if (!hasJurisdiction) {
      return {
        success: false,
        error: "You don't have jurisdiction for this ward",
      };
    }

    const newStatus =
      input.decision === "ACCEPTED"
        ? NominationStatus.ACCEPTED
        : NominationStatus.REJECTED;

    // Update nomination
    const updatedNomination = await db.nominationApplication.update({
      where: { id: input.nominationId },
      data: {
        status: newStatus,
        scrutinyDate: new Date(),
        scrutinizedBy: input.roUserId,
        scrutinyRemarks: input.remarks,
        rejectionReasons: input.rejectionReasons,
      },
    });

    // Create status history
    await db.nominationStatusHistory.create({
      data: {
        nominationId: nomination.id,
        fromStatus: NominationStatus.RECEIVED,
        toStatus: newStatus,
        changedBy: input.roUserId,
        ipAddress: input.ipAddress,
        remarks: input.remarks || `Nomination ${input.decision.toLowerCase()}`,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: input.roUserId,
        action:
          input.decision === "ACCEPTED"
            ? AuditAction.NOMINATION_ACCEPTED
            : AuditAction.NOMINATION_REJECTED,
        entityType: "NominationApplication",
        entityId: nomination.id,
        oldValues: { status: NominationStatus.RECEIVED },
        newValues: {
          status: newStatus,
          scrutinyRemarks: input.remarks,
          rejectionReasons: input.rejectionReasons,
        },
        ipAddress: input.ipAddress,
      },
    });

    // Send notification to candidate
    const user = nomination.applicantProfile.user;
    if (input.decision === "ACCEPTED") {
      await sendNotification(
        user.phone,
        user.email,
        "Nomination Accepted",
        NotificationTemplates.NOMINATION_ACCEPTED(nomination.applicationNo),
      );
    } else {
      await sendNotification(
        user.phone,
        user.email,
        "Nomination Rejected",
        NotificationTemplates.NOMINATION_REJECTED(
          nomination.applicationNo,
          input.rejectionReasons || "Documents/eligibility not verified",
        ),
      );
    }

    return { success: true, nomination: updatedNomination };
  } catch (error) {
    console.error("Scrutinize nomination error:", error);
    return { success: false, error: "Failed to scrutinize nomination" };
  }
}

// Process withdrawal
export async function processWithdrawal(
  input: WithdrawalInput,
): Promise<{ success: boolean; nomination?: any; error?: string }> {
  try {
    // Check if withdrawal is allowed today
    const actionCheck = await validateActionAllowed("withdrawal");
    if (!actionCheck.allowed) {
      return { success: false, error: actionCheck.reason };
    }

    const nomination = await db.nominationApplication.findUnique({
      where: { id: input.nominationId },
      include: {
        applicantProfile: {
          include: {
            user: true,
          },
        },
        ward: true,
      },
    });

    if (!nomination) {
      return { success: false, error: "Nomination not found" };
    }

    if (nomination.status !== NominationStatus.ACCEPTED) {
      return {
        success: false,
        error: "Only accepted nominations can be withdrawn",
      };
    }

    // Validate RO jurisdiction
    const hasJurisdiction = await hasAccessToWard(
      input.roUserId,
      nomination.wardId,
    );
    if (!hasJurisdiction) {
      return {
        success: false,
        error: "You don't have jurisdiction for this ward",
      };
    }

    if (!input.otpVerified) {
      return { success: false, error: "RO OTP verification required" };
    }

    // Update nomination
    const updatedNomination = await db.nominationApplication.update({
      where: { id: input.nominationId },
      data: {
        status: NominationStatus.WITHDRAWN,
        withdrawnAt: new Date(),
        withdrawalReason: input.reason,
        withdrawalApprovedBy: input.roUserId,
        withdrawalOtpVerified: true,
      },
    });

    // Create status history
    await db.nominationStatusHistory.create({
      data: {
        nominationId: nomination.id,
        fromStatus: NominationStatus.ACCEPTED,
        toStatus: NominationStatus.WITHDRAWN,
        changedBy: input.roUserId,
        ipAddress: input.ipAddress,
        remarks: `Withdrawal: ${input.reason}`,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: input.roUserId,
        action: AuditAction.NOMINATION_WITHDRAWN,
        entityType: "NominationApplication",
        entityId: nomination.id,
        oldValues: { status: NominationStatus.ACCEPTED },
        newValues: { status: NominationStatus.WITHDRAWN, reason: input.reason },
        ipAddress: input.ipAddress,
      },
    });

    // Send notification to candidate
    const user = nomination.applicantProfile.user;
    await sendNotification(
      user.phone,
      user.email,
      "Nomination Withdrawn",
      NotificationTemplates.WITHDRAWAL_CONFIRMED(nomination.applicationNo),
    );

    return { success: true, nomination: updatedNomination };
  } catch (error) {
    console.error("Process withdrawal error:", error);
    return { success: false, error: "Failed to process withdrawal" };
  }
}

// Get statistics for RO dashboard
export async function getRODashboardStats(roUserId: string) {
  const wardFilter = await buildJurisdictionFilter(roUserId);
  const nominationWhere = wardFilter ? { ward: wardFilter } : {};

  // Get counts by status
  const statusCounts = await db.nominationApplication.groupBy({
    by: ["status"],
    where: nominationWhere,
    _count: { id: true },
  });

  const stats = {
    total: 0,
    submitted: 0,
    received: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
    contesting: 0,
    pendingReceipt: 0,
    pendingScrutiny: 0,
  };

  for (const sc of statusCounts) {
    const count = sc._count.id;
    stats.total += count;

    switch (sc.status) {
      case NominationStatus.SUBMITTED:
        stats.submitted = count;
        stats.pendingReceipt = count;
        break;
      case NominationStatus.RECEIVED:
        stats.received = count;
        stats.pendingScrutiny = count;
        break;
      case NominationStatus.ACCEPTED:
        stats.accepted = count;
        break;
      case NominationStatus.REJECTED:
        stats.rejected = count;
        break;
      case NominationStatus.WITHDRAWN:
        stats.withdrawn = count;
        break;
      case NominationStatus.CONTESTING:
        stats.contesting = count;
        break;
    }
  }

  // Get ward-wise breakdown
  const wardStats = await db.nominationApplication.groupBy({
    by: ["wardId", "status"],
    where: nominationWhere,
    _count: { id: true },
  });

  // Count total wards in jurisdiction
  const totalWards = await db.ward.count({
    where: wardFilter ? wardFilter : {},
  });

  return { stats, wardStats, totalWards };
}

// Mark accepted nominations as contesting (after withdrawal period)
export async function finalizeContestingCandidates(
  roUserId: string,
  wardId: string,
  ipAddress: string,
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Validate RO jurisdiction
    const hasJurisdiction = await hasAccessToWard(roUserId, wardId);
    if (!hasJurisdiction) {
      return { success: false, count: 0, error: "No jurisdiction" };
    }

    // Get all accepted nominations for the ward
    const nominations = await db.nominationApplication.findMany({
      where: {
        wardId,
        status: NominationStatus.ACCEPTED,
      },
    });

    // Update all to contesting
    const result = await db.nominationApplication.updateMany({
      where: {
        wardId,
        status: NominationStatus.ACCEPTED,
      },
      data: {
        status: NominationStatus.CONTESTING,
      },
    });

    // Create status history for each
    for (const nom of nominations) {
      await db.nominationStatusHistory.create({
        data: {
          nominationId: nom.id,
          fromStatus: NominationStatus.ACCEPTED,
          toStatus: NominationStatus.CONTESTING,
          changedBy: roUserId,
          ipAddress,
          remarks: "Finalized as contesting candidate",
        },
      });
    }

    return { success: true, count: result.count };
  } catch (error) {
    console.error("Finalize contesting error:", error);
    return { success: false, count: 0, error: "Failed to finalize" };
  }
}

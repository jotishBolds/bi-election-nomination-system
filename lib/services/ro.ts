// RO (Returning Officer) Service - Server-side business logic
import "server-only";
import { db } from "@/lib/db";
import { NominationStatus, AuditAction, Role } from "@prisma/client";
import { validateActionAllowed } from "@/lib/services/election-time";
import {
  sendNotification,
  NotificationTemplates,
} from "@/lib/services/notifications";

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
}

interface WithdrawalInput {
  nominationId: string;
  roUserId: string;
  candidateOtpVerified: boolean;
  reason: string;
  ipAddress: string;
}

// Validate RO jurisdiction
export async function validateROJurisdiction(
  roUserId: string,
  wardId: string,
): Promise<boolean> {
  const jurisdiction = await db.userJurisdiction.findFirst({
    where: {
      userId: roUserId,
      isActive: true,
      OR: [
        { wardId },
        {
          ulb: {
            wards: {
              some: { id: wardId },
            },
          },
        },
        {
          district: {
            ulbs: {
              some: {
                wards: {
                  some: { id: wardId },
                },
              },
            },
          },
        },
      ],
    },
  });

  return !!jurisdiction;
}

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
  // Get RO's jurisdictions
  const jurisdictions = await db.userJurisdiction.findMany({
    where: {
      userId: roUserId,
      isActive: true,
    },
    include: {
      ward: true,
      ulb: {
        include: {
          wards: true,
        },
      },
      district: {
        include: {
          ulbs: {
            include: {
              wards: true,
            },
          },
        },
      },
    },
  });

  // Build ward IDs list
  const wardIds: string[] = [];
  for (const j of jurisdictions) {
    if (j.wardId) {
      wardIds.push(j.wardId);
    } else if (j.ulb) {
      wardIds.push(...j.ulb.wards.map((w) => w.id));
    } else if (j.district) {
      for (const ulb of j.district.ulbs) {
        wardIds.push(...ulb.wards.map((w) => w.id));
      }
    }
  }

  const where: any = {
    wardId: { in: wardIds },
  };

  if (filters?.status?.length) {
    where.status = { in: filters.status };
  }

  if (filters?.wardId) {
    where.wardId = filters.wardId;
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

    if (nomination.status !== NominationStatus.SUBMITTED) {
      return { success: false, error: "Nomination is not in submitted status" };
    }

    // Validate RO jurisdiction
    const hasJurisdiction = await validateROJurisdiction(
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

    if (nomination.status !== NominationStatus.RECEIVED) {
      return {
        success: false,
        error: "Nomination must be received before scrutiny",
      };
    }

    // Validate RO jurisdiction
    const hasJurisdiction = await validateROJurisdiction(
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
    const hasJurisdiction = await validateROJurisdiction(
      input.roUserId,
      nomination.wardId,
    );
    if (!hasJurisdiction) {
      return {
        success: false,
        error: "You don't have jurisdiction for this ward",
      };
    }

    if (!input.candidateOtpVerified) {
      return { success: false, error: "Candidate OTP verification required" };
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
  // Get RO's jurisdictions
  const jurisdictions = await db.userJurisdiction.findMany({
    where: {
      userId: roUserId,
      isActive: true,
    },
    include: {
      ward: true,
      ulb: {
        include: {
          wards: true,
        },
      },
      district: {
        include: {
          ulbs: {
            include: {
              wards: true,
            },
          },
        },
      },
    },
  });

  // Build ward IDs list
  const wardIds: string[] = [];
  for (const j of jurisdictions) {
    if (j.wardId) {
      wardIds.push(j.wardId);
    } else if (j.ulb) {
      wardIds.push(...j.ulb.wards.map((w) => w.id));
    } else if (j.district) {
      for (const ulb of j.district.ulbs) {
        wardIds.push(...ulb.wards.map((w) => w.id));
      }
    }
  }

  // Get counts by status
  const statusCounts = await db.nominationApplication.groupBy({
    by: ["status"],
    where: {
      wardId: { in: wardIds },
    },
    _count: {
      id: true,
    },
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
    where: {
      wardId: { in: wardIds },
    },
    _count: {
      id: true,
    },
  });

  return { stats, wardStats, totalWards: wardIds.length };
}

// Mark accepted nominations as contesting (after withdrawal period)
export async function finalizeContestingCandidates(
  roUserId: string,
  wardId: string,
  ipAddress: string,
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Validate RO jurisdiction
    const hasJurisdiction = await validateROJurisdiction(roUserId, wardId);
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

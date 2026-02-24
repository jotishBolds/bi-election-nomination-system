// Payment Service - BillDesk Integration
import "server-only";
import { db } from "@/lib/db";
import {
  PaymentStatus,
  PaymentMode,
  NominationStatus,
  AuditAction,
} from "@prisma/client";
import crypto from "crypto";

// BillDesk Configuration
const BILLDESK_CONFIG = {
  merchantId: process.env.BILLDESK_MERCHANT_ID || "TEST_MERCHANT",
  securityId: process.env.BILLDESK_SECURITY_ID || "TEST_SECURITY",
  checksumKey: process.env.BILLDESK_CHECKSUM_KEY || "TEST_KEY",
  baseUrl:
    process.env.BILLDESK_BASE_URL ||
    "https://pgi.billdesk.com/pgidsk/PGIMerchantPayment",
  responseUrl:
    process.env.BILLDESK_RESPONSE_URL ||
    "https://localhost:3000/api/payments/callback",
};

// Generate unique transaction ID
function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString("hex");
  return `NMS${timestamp}${random}`.toUpperCase();
}

// Generate BillDesk checksum
function generateChecksum(data: string): string {
  const hmac = crypto.createHmac("sha256", BILLDESK_CONFIG.checksumKey);
  hmac.update(data);
  return hmac.digest("hex").toUpperCase();
}

// Verify BillDesk response checksum
function verifyChecksum(data: string, receivedChecksum: string): boolean {
  const calculatedChecksum = generateChecksum(data);
  return calculatedChecksum === receivedChecksum;
}

interface InitiatePaymentInput {
  nominationId: string;
  userId: string;
  amount: number;
  category: string; // For determining deposit amount
}

// Initiate payment
export async function initiatePayment(input: InitiatePaymentInput): Promise<{
  success: boolean;
  payment?: any;
  paymentUrl?: string;
  error?: string;
}> {
  try {
    // Validate nomination
    const nomination = await db.nominationApplication.findUnique({
      where: { id: input.nominationId },
      include: {
        applicantProfile: true,
        brPayments: true,
      },
    });

    if (!nomination) {
      return { success: false, error: "Nomination not found" };
    }

    // Check if payment already completed
    const existingPayment = nomination.brPayments?.find(
      (p: any) => p.status === PaymentStatus.PAID,
    );
    if (existingPayment) {
      return {
        success: false,
        error: "Payment already completed for this nomination",
      };
    }

    // Get security deposit amount from election config
    const config = await db.electionConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      return { success: false, error: "No active election configuration" };
    }

    // Determine amount based on category
    const isSCST = ["SC", "ST"].includes(input.category.toUpperCase());
    const baseAmount = Number(config.nominationFee);
    const discount = isSCST ? Number(config.scStFeeDiscount) : 0;
    const amount = baseAmount * (1 - discount / 100);

    // Generate transaction ID
    const transactionId = generateTransactionId();

    // Create payment record
    const payment = await db.payment.create({
      data: {
        nominationId: input.nominationId,
        transactionId,
        amount,
        currency: "INR",
        status: PaymentStatus.PENDING,
        mode: PaymentMode.ONLINE,
        paymentGateway: "BillDesk",
        ipAddress: "0.0.0.0", // Will be updated with actual IP
      },
    });

    // Build BillDesk request
    const requestData = [
      BILLDESK_CONFIG.merchantId,
      transactionId,
      "NA", // Customer ID
      amount.toFixed(2),
      "NA", // Account Number
      "NA", // Mode
      "INR",
      "NA", // Item Code
      "NA", // Type Field 1
      BILLDESK_CONFIG.securityId,
      "NA", // Type Field 2
      "NA", // Type Field 3
      "NA", // Type Field 4
      "NA", // Type Field 5
      "NA", // Type Field 6
      BILLDESK_CONFIG.responseUrl,
    ].join("|");

    const checksum = generateChecksum(requestData);
    const finalRequest = `${requestData}|${checksum}`;

    // Payment URL with encoded data
    const paymentUrl = `${BILLDESK_CONFIG.baseUrl}?msg=${encodeURIComponent(finalRequest)}`;

    // Log payment initiation
    await db.auditLog.create({
      data: {
        userId: input.userId,
        action: AuditAction.PAYMENT_INITIATED,
        entityType: "Payment",
        entityId: payment.id,
        newValues: JSON.parse(
          JSON.stringify({ transactionId, amount, status: "INITIATED" }),
        ),
        ipAddress: "0.0.0.0",
      },
    });

    return {
      success: true,
      payment,
      paymentUrl,
    };
  } catch (error) {
    console.error("Initiate payment error:", error);
    return { success: false, error: "Failed to initiate payment" };
  }
}

interface PaymentCallbackData {
  transactionId: string;
  status: "SUCCESS" | "FAILURE" | "PENDING";
  gatewayTransactionId?: string;
  authCode?: string;
  errorCode?: string;
  errorMessage?: string;
  checksum?: string;
  rawResponse?: string;
}

// Process payment callback
export async function processPaymentCallback(
  data: PaymentCallbackData,
): Promise<{
  success: boolean;
  payment?: any;
  error?: string;
}> {
  try {
    // Find payment by transaction ID
    const payment = await db.payment.findUnique({
      where: { transactionId: data.transactionId },
      include: {
        nomination: true,
      },
    });

    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    // Verify checksum if provided
    if (data.checksum && data.rawResponse) {
      const responseWithoutChecksum = data.rawResponse.substring(
        0,
        data.rawResponse.lastIndexOf("|"),
      );
      if (!verifyChecksum(responseWithoutChecksum, data.checksum)) {
        // Log suspected fraud
        await db.auditLog.create({
          data: {
            action: AuditAction.PAYMENT_FAILED,
            entityType: "Payment",
            entityId: payment.id,
            newValues: JSON.parse(
              JSON.stringify({
                error: "Checksum verification failed",
                rawResponse: data.rawResponse,
              }),
            ),
            ipAddress: "system",
          },
        });
        return { success: false, error: "Invalid payment response" };
      }
    }

    // Determine payment status
    let paymentStatus: PaymentStatus;
    switch (data.status) {
      case "SUCCESS":
        paymentStatus = PaymentStatus.PAID;
        break;
      case "FAILURE":
        paymentStatus = PaymentStatus.FAILED;
        break;
      default:
        paymentStatus = PaymentStatus.PENDING;
    }

    // Update payment record
    const updatedPayment = await db.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        gatewayResponse: data.rawResponse
          ? JSON.parse(JSON.stringify({ raw: data.rawResponse }))
          : undefined,
        completedAt:
          paymentStatus === PaymentStatus.PAID ? new Date() : undefined,
      },
    });

    // If payment successful, the nomination's payment is tracked via the payments relation
    // No need to update a separate flag on the nomination

    // Audit log
    await db.auditLog.create({
      data: {
        action: AuditAction.PAYMENT_COMPLETED,
        entityType: "Payment",
        entityId: payment.id,
        oldValues: JSON.parse(JSON.stringify({ status: payment.status })),
        newValues: JSON.parse(
          JSON.stringify({
            status: paymentStatus,
            gatewayTransactionId: data.gatewayTransactionId,
          }),
        ),
        ipAddress: "system",
      },
    });

    return { success: true, payment: updatedPayment };
  } catch (error) {
    console.error("Process payment callback error:", error);
    return { success: false, error: "Failed to process payment" };
  }
}

// Get payment status
export async function getPaymentStatus(
  paymentId?: string,
  transactionId?: string,
): Promise<{
  success: boolean;
  payment?: any;
  error?: string;
}> {
  try {
    let payment;

    if (paymentId) {
      payment = await db.payment.findUnique({
        where: { id: paymentId },
        include: {
          nomination: {
            select: {
              id: true,
              applicationNo: true,
              status: true,
            },
          },
        },
      });
    } else if (transactionId) {
      payment = await db.payment.findUnique({
        where: { transactionId },
        include: {
          nomination: {
            select: {
              id: true,
              applicationNo: true,
              status: true,
            },
          },
        },
      });
    }

    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    return { success: true, payment };
  } catch (error) {
    console.error("Get payment status error:", error);
    return { success: false, error: "Failed to get payment status" };
  }
}

// Get payments for nomination
export async function getNominationPayments(nominationId: string) {
  return db.payment.findMany({
    where: { nominationId },
    orderBy: { initiatedAt: "desc" },
  });
}

// Manual payment entry (for cash/DD payments at RO counter)
export async function recordManualPayment(
  nominationId: string,
  data: {
    amount: number;
    mode: "CASH" | "DD" | "CHEQUE";
    referenceNumber?: string;
    remarks?: string;
  },
  recordedBy: string,
): Promise<{
  success: boolean;
  payment?: any;
  error?: string;
}> {
  try {
    const transactionId = generateTransactionId();

    const payment = await db.payment.create({
      data: {
        nominationId,
        transactionId,
        amount: data.amount,
        currency: "INR",
        status: PaymentStatus.PAID,
        mode: PaymentMode.OFFLINE,
        paymentGateway: "MANUAL",
        challanNo: data.referenceNumber,
        completedAt: new Date(),
        ipAddress: "system",
      },
    });

    // Payment is tracked via the payments relation on nomination

    // Audit log
    await db.auditLog.create({
      data: {
        userId: recordedBy,
        action: AuditAction.PAYMENT_COMPLETED,
        entityType: "Payment",
        entityId: payment.id,
        newValues: JSON.parse(
          JSON.stringify({
            mode: data.mode,
            amount: data.amount,
            referenceNumber: data.referenceNumber,
            remarks: data.remarks,
            recordedManually: true,
          }),
        ),
        ipAddress: "system",
      },
    });

    return { success: true, payment };
  } catch (error) {
    console.error("Record manual payment error:", error);
    return { success: false, error: "Failed to record payment" };
  }
}

// Refund payment (for rejected nominations)
export async function initiateRefund(
  paymentId: string,
  reason: string,
  initiatedBy: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        nomination: true,
      },
    });

    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    if (payment.status !== PaymentStatus.PAID) {
      return { success: false, error: "Can only refund completed payments" };
    }

    // For online payments, initiate refund with gateway
    // For manual payments, just mark for refund

    await db.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
        refundReason: reason,
        refundedAt: new Date(),
        refundAmount: payment.amount,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: initiatedBy,
        action: AuditAction.UPDATE,
        entityType: "Payment",
        entityId: paymentId,
        newValues: JSON.parse(
          JSON.stringify({ action: "REFUND_INITIATED", reason }),
        ),
        ipAddress: "system",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Initiate refund error:", error);
    return { success: false, error: "Failed to initiate refund" };
  }
}

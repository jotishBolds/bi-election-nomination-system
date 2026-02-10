// Notification logging service - uses the NotificationLog schema model
import "server-only";
import { db } from "@/lib/db";

import { type Prisma } from "@prisma/client";

type NotificationType = "SMS" | "EMAIL" | "BOTH";
type NotificationStatus = "PENDING" | "SENT" | "DELIVERED" | "FAILED";

interface LogNotificationInput {
  userId?: string;
  type: NotificationType;
  recipient: string; // Phone number or email
  subject?: string;
  content: string;
  status?: NotificationStatus;
  failureReason?: string;
  retryCount?: number;
  metadata?: Record<string, string | number | boolean | null>;
}

/**
 * Log a notification sent to a user.
 * Uses the NotificationLog schema model to track all SMS/email notifications.
 */
export async function logNotification(
  input: LogNotificationInput,
): Promise<void> {
  try {
    await db.notificationLog.create({
      data: {
        userId: input.userId || null,
        type: input.type,
        recipient: input.recipient,
        subject: input.subject || null,
        content: input.content,
        status: input.status || "PENDING",
        failureReason: input.failureReason || null,
        retryCount: input.retryCount || 0,
        metadata: input.metadata
          ? (input.metadata as Prisma.InputJsonValue)
          : undefined,
        sentAt: input.status === "SENT" ? new Date() : null,
      },
    });
  } catch (error) {
    // Don't throw - notification logging should not break the main flow
    console.error("Failed to log notification:", error);
  }
}

/**
 * Update a notification log entry status (e.g., after delivery confirmation).
 */
export async function updateNotificationStatus(
  notificationId: string,
  status: NotificationStatus,
  failureReason?: string,
): Promise<void> {
  try {
    await db.notificationLog.update({
      where: { id: notificationId },
      data: {
        status,
        failureReason: failureReason || undefined,
        ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
      },
    });
  } catch (error) {
    console.error("Failed to update notification status:", error);
  }
}

/**
 * Get notification history for a user.
 */
export async function getUserNotifications(userId: string, limit: number = 20) {
  return db.notificationLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

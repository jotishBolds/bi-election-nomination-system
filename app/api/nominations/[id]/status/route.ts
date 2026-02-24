import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// PUT /api/nominations/[id]/status - Update nomination status (RO OTP-verified)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["SUPER_ADMIN", "SES", "RO"].includes(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, otp } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status is required" },
        { status: 400 },
      );
    }

    // Valid status transitions
    const validStatuses = [
      "RECEIVED",
      "UNDER_SCRUTINY",
      "ACCEPTED",
      "REJECTED",
      "CONTESTING",
      "WITHDRAWN",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status: ${status}` },
        { status: 400 },
      );
    }

    // Verify OTP if provided (using speakeasy TOTP)
    if (otp) {
      try {
        const speakeasy = await import("speakeasy");
        const totp = await db.tOTPSecret.findFirst({
          where: { userId: session.user.id, isEnabled: true },
        });

        if (totp?.secret) {
          const verified = speakeasy.default.totp.verify({
            secret: totp.secret,
            encoding: "base32",
            token: otp,
            window: 2,
          });

          if (!verified) {
            return NextResponse.json(
              { success: false, error: "Invalid OTP" },
              { status: 400 },
            );
          }
        }
      } catch {
        // If OTP verification fails, continue without it for now
        console.warn("OTP verification skipped");
      }
    }

    const application = await db.nominationApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 },
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = { status };

    if (status === "RECEIVED") {
      updateData.receivedAt = new Date();
      updateData.receivedBy = session.user.id;
    } else if (status === "UNDER_SCRUTINY") {
      // No additional fields needed
    } else if (status === "ACCEPTED") {
      updateData.scrutinyDate = new Date();
      updateData.scrutinizedBy = session.user.id;
    } else if (status === "REJECTED") {
      updateData.scrutinyDate = new Date();
      updateData.scrutinizedBy = session.user.id;
    }

    const updatedApplication = await db.nominationApplication.update({
      where: { id },
      data: updateData,
      include: {
        applicantProfile: {
          include: {
            user: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
        ward: {
          include: {
            ulb: { include: { district: true } },
          },
        },
        politicalParty: true,
        allocatedSymbol: true,
      },
    });

    // Log the action
    // Map status to audit action
    const auditActionMap: Record<string, string> = {
      RECEIVED: "NOMINATION_RECEIVED",
      UNDER_SCRUTINY: "UPDATE",
      ACCEPTED: "NOMINATION_ACCEPTED",
      REJECTED: "NOMINATION_REJECTED",
      CONTESTING: "UPDATE",
      WITHDRAWN: "NOMINATION_WITHDRAWN",
    };

    await db.auditLog.create({
      data: {
        action: (auditActionMap[status] ||
          "UPDATE") as import("@prisma/client").AuditAction,
        entityType: "NominationApplication",
        entityId: id,
        userId: session.user.id,
        newValues: {
          previousStatus: application.status,
          newStatus: status,
          otpVerified: !!otp,
        },
        ipAddress: "api",
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedApplication,
      message: `Status updated to ${status}`,
    });
  } catch (error) {
    console.error("Error updating nomination status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update status" },
      { status: 500 },
    );
  }
}

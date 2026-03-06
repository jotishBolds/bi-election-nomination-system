import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Role, OTPType } from "@prisma/client";
import { requireRoles } from "@/lib/auth/auth-guard";
import { hasAccessToWard } from "@/lib/services/ro-jurisdiction";
import { hashOTP } from "@/lib/auth/server-utils";
import { verifyOTP } from "@/lib/memory-store";

// POST /api/ro/applications/[id]/symbol - Allocate a symbol to an accepted candidate with OTP
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRoles([Role.RO, Role.SES, Role.SUPER_ADMIN]);
    const { id: nominationId } = await params;

    const body = await request.json().catch(() => ({}));
    const { symbolId, otp } = body;

    if (!symbolId || typeof symbolId !== "string") {
      return NextResponse.json(
        { success: false, error: "symbolId is required" },
        { status: 400 },
      );
    }

    if (!otp || typeof otp !== "string" || !/^[0-9]{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, error: "Valid 6-digit OTP is required" },
        { status: 400 },
      );
    }

    // Verify OTP for RO
    if (session.user.role === Role.RO) {
      const roUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { phone: true },
      });

      if (!roUser?.phone) {
        return NextResponse.json(
          { success: false, error: "RO phone not found" },
          { status: 400 },
        );
      }

      const otpHash = hashOTP(otp.trim());
      const verification = await verifyOTP(
        roUser.phone.trim(),
        otpHash,
        OTPType.SCRUTINY,
      );

      if (!verification.valid) {
        if (verification.expired) {
          return NextResponse.json(
            { success: false, error: "OTP expired" },
            { status: 400 },
          );
        }
        if (verification.maxAttemptsReached) {
          return NextResponse.json(
            { success: false, error: "Maximum OTP attempts reached" },
            { status: 400 },
          );
        }
        return NextResponse.json(
          { success: false, error: "Invalid OTP" },
          { status: 400 },
        );
      }
    }

    // Fetch nomination
    const nomination = await db.nominationApplication.findUnique({
      where: { id: nominationId },
    });

    if (!nomination) {
      return NextResponse.json(
        { success: false, error: "Nomination not found" },
        { status: 404 },
      );
    }

    if (!["ACCEPTED", "CONTESTING"].includes(nomination.status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Symbol can only be allocated to accepted nominations",
        },
        { status: 400 },
      );
    }

    // Check RO jurisdiction
    if (session.user.role === Role.RO) {
      const hasAccess = await hasAccessToWard(
        session.user.id,
        nomination.wardId,
      );
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: "Access denied - not in your jurisdiction" },
          { status: 403 },
        );
      }
    }

    // Validate symbol
    const symbol = await db.electionSymbol.findUnique({
      where: { id: symbolId },
      select: { id: true, name: true, isActive: true },
    });

    if (!symbol || !symbol.isActive) {
      return NextResponse.json(
        { success: false, error: "Symbol not found or inactive" },
        { status: 404 },
      );
    }

    // Get election config
    const electionConfig = await db.electionConfig.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    if (!electionConfig) {
      return NextResponse.json(
        { success: false, error: "No active election found" },
        { status: 400 },
      );
    }

    // Transaction-based allocation
    const result = await db.$transaction(async (tx) => {
      // Check for ward-level conflicts
      const existingAllocation = await tx.symbolAllocation.findFirst({
        where: {
          wardId: nomination.wardId,
          symbolId,
          electionId: electionConfig.id,
          NOT: [{ allocatedTo: null }, { allocatedTo: nominationId }],
        },
      });

      if (existingAllocation) {
        throw new Error("SYMBOL_ALREADY_ASSIGNED");
      }

      const currentAllocation = await tx.symbolAllocation.findFirst({
        where: {
          wardId: nomination.wardId,
          symbolId,
          electionId: electionConfig.id,
        },
      });

      let allocation;
      if (currentAllocation) {
        allocation = await tx.symbolAllocation.update({
          where: { id: currentAllocation.id },
          data: {
            allocatedTo: nominationId,
            allocatedBy: session.user.id,
            allocatedAt: new Date(),
          },
        });
      } else {
        allocation = await tx.symbolAllocation.create({
          data: {
            wardId: nomination.wardId,
            symbolId,
            electionId: electionConfig.id,
            allocatedTo: nominationId,
            allocatedBy: session.user.id,
            allocatedAt: new Date(),
          },
        });
      }

      await tx.nominationApplication.update({
        where: { id: nominationId },
        data: { allocatedSymbolId: symbolId },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          entityType: "NominationApplication",
          entityId: nominationId,
          newValues: {
            symbolId,
            symbolName: symbol.name,
            wardId: nomination.wardId,
            allocationType: "SYMBOL_ALLOCATED",
          },
          ipAddress: "api",
        },
      });

      return allocation;
    });

    return NextResponse.json({
      success: true,
      message: "Symbol allocated successfully",
      data: {
        applicationId: nominationId,
        symbolId: result.symbolId,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        );
      }
      if (
        error.message === "FORBIDDEN" ||
        error.message.startsWith("UNAUTHORIZED_")
      ) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 },
        );
      }
      if (error.message === "SYMBOL_ALREADY_ASSIGNED") {
        return NextResponse.json(
          { success: false, error: "Symbol already assigned" },
          { status: 409 },
        );
      }
    }
    console.error("Symbol allocation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to allocate symbol" },
      { status: 500 },
    );
  }
}

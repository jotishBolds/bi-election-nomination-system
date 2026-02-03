// Payment API - Initiate and Check Status
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import {
  initiatePayment,
  getPaymentStatus,
  recordManualPayment,
} from "@/lib/services/payment";
import { checkPortalTimeWindow } from "@/lib/services/election-time";

// GET - Get payment status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId") || undefined;
    const transactionId = searchParams.get("transactionId") || undefined;

    if (!paymentId && !transactionId) {
      return NextResponse.json(
        { success: false, error: "Payment ID or Transaction ID is required" },
        { status: 400 },
      );
    }

    const result = await getPaymentStatus(paymentId, transactionId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, payment: result.payment });
  } catch (error) {
    console.error("Payment GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Initiate payment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check portal time window
    const timeCheck = await checkPortalTimeWindow();
    if (!timeCheck.isOpen) {
      return NextResponse.json(
        { success: false, error: timeCheck.message },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { nominationId, category, action } = body;

    if (!nominationId) {
      return NextResponse.json(
        { success: false, error: "Nomination ID is required" },
        { status: 400 },
      );
    }

    // Handle manual payment recording by RO
    if (action === "record-manual" && session.user.role === "RO") {
      const { amount, mode, referenceNumber, remarks } = body;
      if (!amount || !mode) {
        return NextResponse.json(
          {
            success: false,
            error: "Amount and mode are required for manual payment",
          },
          { status: 400 },
        );
      }

      const result = await recordManualPayment(
        nominationId,
        { amount, mode, referenceNumber, remarks },
        session.user.id,
      );

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 },
        );
      }

      return NextResponse.json({ success: true, payment: result.payment });
    }

    // Initiate online payment
    const result = await initiatePayment({
      nominationId,
      userId: session.user.id,
      amount: 0, // Will be determined by service based on category
      category: category || "GENERAL",
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      payment: result.payment,
      paymentUrl: result.paymentUrl,
    });
  } catch (error) {
    console.error("Payment POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

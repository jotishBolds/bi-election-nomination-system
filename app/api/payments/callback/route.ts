// Payment Callback API - BillDesk Response Handler
import { NextRequest, NextResponse } from "next/server";
import { processPaymentCallback } from "@/lib/services/payment";

// POST - Handle BillDesk callback
export async function POST(request: NextRequest) {
  try {
    // BillDesk sends response as form-urlencoded
    const contentType = request.headers.get("content-type");
    let responseData: string;

    if (contentType?.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      responseData = formData.get("msg") as string;
    } else {
      const body = await request.json();
      responseData = body.msg || body.response;
    }

    if (!responseData) {
      console.error("Payment callback: No response data received");
      return NextResponse.redirect(
        new URL(
          "/nomination?payment=error&message=Invalid+response",
          request.url,
        ),
      );
    }

    // Parse BillDesk response
    // Format: MerchantID|CustomerID|TxnRefNo|Amount|TxnDate|AuthStatus|SettlementType|AdditionalInfo1|AdditionalInfo2|AdditionalInfo3|AdditionalInfo4|AdditionalInfo5|AdditionalInfo6|AdditionalInfo7|ErrorStatus|ErrorDescription|Checksum
    const parts = responseData.split("|");

    if (parts.length < 17) {
      console.error("Payment callback: Invalid response format");
      return NextResponse.redirect(
        new URL(
          "/nomination?payment=error&message=Invalid+response+format",
          request.url,
        ),
      );
    }

    const [
      _merchantId,
      _customerId,
      transactionId,
      _amount,
      _txnDate,
      authStatus,
      _settlementType,
      _addInfo1,
      _addInfo2,
      _addInfo3,
      _addInfo4,
      _addInfo5,
      _addInfo6,
      gatewayTransactionId,
      errorCode,
      errorMessage,
      checksum,
    ] = parts;

    // Map BillDesk auth status to our status
    let status: "SUCCESS" | "FAILURE" | "PENDING";
    switch (authStatus) {
      case "0300":
        status = "SUCCESS";
        break;
      case "0399":
        status = "FAILURE";
        break;
      default:
        status = "PENDING";
    }

    // Process the callback
    const result = await processPaymentCallback({
      transactionId,
      status,
      gatewayTransactionId: gatewayTransactionId || undefined,
      errorCode: errorCode !== "NA" ? errorCode : undefined,
      errorMessage: errorMessage !== "NA" ? errorMessage : undefined,
      checksum,
      rawResponse: responseData,
    });

    if (!result.success) {
      console.error("Payment callback processing failed:", result.error);
      return NextResponse.redirect(
        new URL(
          `/nomination?payment=error&message=${encodeURIComponent(result.error || "Processing failed")}`,
          request.url,
        ),
      );
    }

    // Redirect based on payment status
    if (status === "SUCCESS") {
      return NextResponse.redirect(
        new URL(
          `/nomination?payment=success&transactionId=${transactionId}`,
          request.url,
        ),
      );
    } else {
      return NextResponse.redirect(
        new URL(
          `/nomination?payment=failed&transactionId=${transactionId}&message=${encodeURIComponent(errorMessage || "Payment failed")}`,
          request.url,
        ),
      );
    }
  } catch (error) {
    console.error("Payment callback error:", error);
    return NextResponse.redirect(
      new URL("/nomination?payment=error&message=Internal+error", request.url),
    );
  }
}

// GET - Handle redirect back from BillDesk (some gateways use GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const msg = searchParams.get("msg");

  if (msg) {
    // Create a mock POST request with the msg parameter
    const mockRequest = new NextRequest(request.url, {
      method: "POST",
      body: JSON.stringify({ msg }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return POST(mockRequest);
  }

  return NextResponse.redirect(
    new URL("/nomination?payment=error&message=Missing+response", request.url),
  );
}

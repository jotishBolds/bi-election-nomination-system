import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/next-auth";

// GET /api/candidate/my-nominations - Get candidate's own nominations
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
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      createdBy: session.user.id,
    };

    if (status && status !== "all") {
      where.status = status;
    }

    const nominations = await db.nominationApplication.findMany({
      where,
      include: {
        ward: {
          include: {
            ulb: {
              include: {
                district: true,
              },
            },
          },
        },
        politicalParty: true,
        allocatedSymbol: true,
        brPayments: {
          orderBy: { submittedAt: "desc" },
          take: 1,
        },
        documents: true,
        scrutinizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate summary
    const summary = {
      total: nominations.length,
      draft: nominations.filter((n) => n.status === "DRAFT").length,
      submitted: nominations.filter((n) =>
        ["SUBMITTED", "RECEIVED", "UNDER_SCRUTINY"].includes(n.status),
      ).length,
      accepted: nominations.filter((n) => n.status === "ACCEPTED").length,
      rejected: nominations.filter((n) => n.status === "REJECTED").length,
      withdrawn: nominations.filter((n) => n.status === "WITHDRAWN").length,
      contesting: nominations.filter((n) =>
        ["CONTESTING", "ELECTED_UNOPPOSED"].includes(n.status),
      ).length,
    };

    return NextResponse.json({
      success: true,
      data: nominations,
      summary,
    });
  } catch (error) {
    console.error("Error fetching candidate nominations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch nominations" },
      { status: 500 },
    );
  }
}

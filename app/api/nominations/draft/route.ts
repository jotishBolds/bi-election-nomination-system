// Draft Nomination API Routes
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { db } from "@/lib/db";
import { NominationStatus } from "@prisma/client";

// GET - Get current draft data for the logged-in candidate
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get applicant profile
    const profile = await db.applicantProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({
        success: true,
        draft: null,
        message: "No profile found",
      });
    }

    // Find the latest draft nomination
    const draft = await db.nominationApplication.findFirst({
      where: {
        applicantProfileId: profile.id,
        status: NominationStatus.DRAFT,
      },
      orderBy: { updatedAt: "desc" },
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
        proposers: true,
        symbolPreferences: {
          include: { symbol: true },
          orderBy: { preferenceOrder: "asc" },
        },
        politicalParty: {
          include: { symbol: true },
        },
      },
    });

    if (!draft) {
      return NextResponse.json({
        success: true,
        draft: null,
      });
    }

    // Transform draft to NominationFormData format for the frontend
    const formData = {
      districtId: draft.ward?.ulb?.districtId || "",
      district: draft.ward?.ulb?.district?.name || "",
      ulbId: draft.ulbId || "",
      ulb: draft.ward?.ulb?.name || "",
      municipality: draft.ward?.ulb?.name || "",
      wardId: draft.wardId || "",
      municipalWard: draft.ward
        ? `${draft.ward.wardNo}-${draft.ward.wardName}`
        : "",
      wardName: draft.ward?.wardName || "",
      constituency: draft.ward?.constituency?.name || "",
      reservation: draft.ward?.reservationType || "",
      candidateName: draft.candidateName || "",
      fatherOrHusbandName: draft.fatherHusbandName || "",
      fullPostalAddress: draft.address || "",
      sameAsPostalAddress: false,
      correspondingAddress: "",
      serialNoCandidate: draft.voterSerialNo || "",
      partNoCandidate: draft.voterPartNo || "",
      category:
        (draft.category?.toLowerCase() as
          | "general"
          | "sc"
          | "st_bl"
          | "st_lt"
          | "obc_central"
          | "obc_state") || "general",
      casteTribeName: draft.casteTribeName || "",
      proposerName: draft.proposers?.[0]?.name || "",
      proposerSerialNo: draft.proposers?.[0]?.voterSerialNo || "",
      proposerPartNo: draft.proposers?.[0]?.voterPartNo || "",
      dateOfBirth: draft.dateOfBirth?.toISOString().split("T")[0] || "",
      age: draft.age?.toString() || "",
      politicalPartyId: draft.isIndependent
        ? "independent"
        : draft.politicalPartyId || "",
      politicalParty: draft.isIndependent
        ? "Independent"
        : draft.politicalParty?.name || "",
      partySymbol: draft.isIndependent
        ? draft.symbolPreferences?.[0]?.symbol?.name || ""
        : draft.politicalParty?.symbol?.name || "",
      partySymbolImage: draft.isIndependent
        ? draft.symbolPreferences?.[0]?.symbol?.imagePath || ""
        : draft.politicalParty?.symbol?.imagePath || "",
      symbolPreference1: draft.symbolPreferences?.[0]?.symbol?.name || "",
      symbolPreference2: draft.symbolPreferences?.[1]?.symbol?.name || "",
      symbolPreference3: draft.symbolPreferences?.[2]?.symbol?.name || "",
      shuffleCount: 0,
    };

    return NextResponse.json({
      success: true,
      draft: formData,
    });
  } catch (error) {
    console.error("Get draft error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch draft" },
      { status: 500 },
    );
  }
}

// POST - Save draft data (creates or updates a draft nomination)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { formData: clientFormData } = body;

    if (!clientFormData) {
      return NextResponse.json(
        { success: false, error: "No form data provided" },
        { status: 400 },
      );
    }

    // Get applicant profile
    const profile = await db.applicantProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({
        success: true,
        message: "Draft saved locally (no profile yet)",
      });
    }

    // Check for existing draft
    const existingDraft = await db.nominationApplication.findFirst({
      where: {
        applicantProfileId: profile.id,
        status: NominationStatus.DRAFT,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Map category to uppercase enum
    const categoryMap: Record<string, string> = {
      general: "GENERAL",
      sc: "SC",
      st_bl: "ST_BL",
      st_lt: "ST_LT",
      obc_central: "OBC_CENTRAL",
      obc_state: "OBC_STATE",
    };

    const categoryValue = categoryMap[clientFormData.category] || "GENERAL";

    // Only save to DB if we have enough data (at least wardId and ulbId)
    if (clientFormData.wardId && clientFormData.ulbId) {
      const nominationData = {
        candidateName: clientFormData.candidateName || "",
        fatherHusbandName: clientFormData.fatherOrHusbandName || "",
        address: clientFormData.fullPostalAddress || "",
        voterSerialNo: clientFormData.serialNoCandidate || "",
        voterPartNo: clientFormData.partNoCandidate || "",
        category: categoryValue as any,
        casteTribeName: clientFormData.casteTribeName || null,
        wardId: clientFormData.wardId,
        ulbId: clientFormData.ulbId,
        isIndependent:
          clientFormData.politicalPartyId === "independent" ||
          !clientFormData.politicalPartyId,
        politicalPartyId:
          clientFormData.politicalPartyId &&
          clientFormData.politicalPartyId !== "independent"
            ? clientFormData.politicalPartyId
            : null,
      };

      if (existingDraft) {
        await db.nominationApplication.update({
          where: { id: existingDraft.id },
          data: nominationData,
        });
      }
      // Don't create new draft here - that's done by the main POST /api/nominations
    }

    return NextResponse.json({
      success: true,
      message: "Draft saved",
    });
  } catch (error) {
    console.error("Save draft error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save draft" },
      { status: 500 },
    );
  }
}

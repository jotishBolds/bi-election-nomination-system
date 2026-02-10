// Single Nomination API Routes
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { getClientIP } from "@/lib/auth/server-utils";
import {
  getNominationById,
  updateNominationDraft,
  submitNomination,
} from "@/lib/services/nomination";
import { db } from "@/lib/db";
import { z } from "zod";
import { Category, Gender } from "@prisma/client";

const updateNominationSchema = z.object({
  candidateName: z.string().min(2).max(200).optional(),
  fatherHusbandName: z.string().min(2).max(200).optional(),
  dateOfBirth: z
    .string()
    .transform((s) => new Date(s))
    .optional(),
  age: z.number().int().min(21).max(120).optional(),
  gender: z.nativeEnum(Gender).optional(),
  category: z.nativeEnum(Category).optional(),
  casteTribeName: z.string().optional(),
  address: z.string().min(10).optional(),
  voterSerialNo: z.string().max(10).optional(),
  voterPartNo: z.string().max(10).optional(),
  politicalPartyId: z.string().uuid().nullable().optional(),
  isIndependent: z.boolean().optional(),
  wardId: z.string().uuid().optional(),
  ulbId: z.string().uuid().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single nomination
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const nomination = await getNominationById(id);

    if (!nomination) {
      return NextResponse.json(
        { success: false, error: "Nomination not found" },
        { status: 404 },
      );
    }

    // Check authorization - candidate can only see their own nominations
    if (
      session.user.role === "CANDIDATE" &&
      nomination.applicantProfile.userId !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      nomination,
    });
  } catch (error) {
    console.error("Get nomination error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch nomination" },
      { status: 500 },
    );
  }
}

// PATCH - Update nomination draft
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validatedData = updateNominationSchema.parse(body);

    // Convert null to undefined for optional fields
    const cleanedData = {
      ...validatedData,
      politicalPartyId: validatedData.politicalPartyId ?? undefined,
    };

    const clientIp = getClientIP(request);

    // Verify ownership
    const nomination = await getNominationById(id);
    if (!nomination) {
      return NextResponse.json(
        { success: false, error: "Nomination not found" },
        { status: 404 },
      );
    }

    if (nomination.applicantProfile.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const result = await updateNominationDraft(
      id,
      cleanedData,
      session.user.id,
      clientIp,
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      nomination: result.nomination,
    });
  } catch (error) {
    console.error("Update nomination error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update nomination" },
      { status: 500 },
    );
  }
}

// PUT - Update nomination with full form data (for 2nd/3rd submissions)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      formData,
      isUpdate,
      submissionNumber,
      brNumber,
      brProofUrl,
      brProofPublicId,
    } = body;

    if (!formData || !isUpdate) {
      return NextResponse.json(
        { success: false, error: "Invalid request format" },
        { status: 400 },
      );
    }

    const clientIp = getClientIP(request);

    // Verify ownership
    const nomination = await getNominationById(id);
    if (!nomination) {
      return NextResponse.json(
        { success: false, error: "Nomination not found" },
        { status: 404 },
      );
    }

    if (nomination.applicantProfile.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    // Update nomination with new form data
    const updatedNomination = await db.nominationApplication.update({
      where: { id },
      data: {
        candidateName: formData.candidateName || nomination.candidateName,
        fatherHusbandName:
          formData.fatherOrHusbandName ||
          formData.fatherHusbandName ||
          nomination.fatherHusbandName,
        address:
          formData.fullPostalAddress || formData.address || nomination.address,
        voterSerialNo:
          formData.serialNoCandidate ||
          formData.voterSerialNo ||
          nomination.voterSerialNo,
        voterPartNo:
          formData.partNoCandidate ||
          formData.voterPartNo ||
          nomination.voterPartNo,
        submissionNumber: submissionNumber || nomination.submissionNumber,
        updatedAt: new Date(),
        // Update dates if provided
        ...(formData.dateOfBirth && {
          dateOfBirth: new Date(formData.dateOfBirth),
        }),
        ...(formData.age && { age: parseInt(formData.age, 10) }),
      },
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
        applicantProfile: {
          include: {
            user: true,
          },
        },
        brPayments: true,
      },
    });

    // If BR data provided, create new BR payment record
    if (brNumber && brProofUrl && brProofPublicId) {
      await db.bRPayment.create({
        data: {
          nominationId: id,
          brNumber,
          proofImageUrl: brProofUrl,
          proofPublicId: brProofPublicId,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json({
      success: true,
      nomination: updatedNomination,
      message: "Nomination updated successfully",
    });
  } catch (error) {
    console.error("Update nomination with form data error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update nomination" },
      { status: 500 },
    );
  }
}

// POST - Submit nomination (special action)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const action = body.action;

    const clientIp = getClientIP(request);

    // Verify ownership
    const nomination = await getNominationById(id);
    if (!nomination) {
      return NextResponse.json(
        { success: false, error: "Nomination not found" },
        { status: 404 },
      );
    }

    if (nomination.applicantProfile.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    if (action === "submit") {
      const result = await submitNomination({
        nominationId: id,
        userId: session.user.id,
        ipAddress: clientIp,
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        nomination: result.nomination,
        message: "Nomination submitted successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Nomination action error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process action" },
      { status: 500 },
    );
  }
}

// Nomination API Routes
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { getClientIP } from "@/lib/auth/server-utils";
import {
  createNominationDraft,
  getCandidateNominations,
  canSubmitMoreNominations,
} from "@/lib/services/nomination";
import { db } from "@/lib/db";
import { z } from "zod";
import { Category, Gender } from "@prisma/client";

const createNominationSchema = z.object({
  ulbId: z.string().uuid(),
  wardId: z.string().uuid(),
  candidateName: z.string().min(2).max(200),
  fatherHusbandName: z.string().min(2).max(200),
  dateOfBirth: z.string().transform((s) => new Date(s)),
  age: z.number().int().min(21).max(120),
  gender: z.nativeEnum(Gender),
  category: z.nativeEnum(Category),
  casteTribeName: z.string().optional(),
  address: z.string().min(10),
  voterSerialNo: z.string().max(10),
  voterPartNo: z.string().max(10),
  politicalPartyId: z.string().uuid().optional(),
  isIndependent: z.boolean().default(true),
});

// GET - List candidate's nominations
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
        nominations: [],
        canSubmit: false,
        message: "Please complete your profile first",
      });
    }

    const nominations = await getCandidateNominations(profile.id);
    const submitStatus = await canSubmitMoreNominations(profile.id);

    return NextResponse.json({
      success: true,
      nominations,
      canSubmit: submitStatus.canSubmit,
      count: submitStatus.count,
      maxAllowed: submitStatus.maxAllowed,
    });
  } catch (error) {
    console.error("Get nominations error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch nominations" },
      { status: 500 },
    );
  }
}

// POST - Create new nomination draft
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
    const validatedData = createNominationSchema.parse(body);

    // Get applicant profile
    const profile = await db.applicantProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Please complete your profile first" },
        { status: 400 },
      );
    }

    const clientIp = getClientIP(request);

    const result = await createNominationDraft({
      applicantProfileId: profile.id,
      ulbId: validatedData.ulbId,
      wardId: validatedData.wardId,
      candidateName: validatedData.candidateName,
      fatherHusbandName: validatedData.fatherHusbandName,
      dateOfBirth: validatedData.dateOfBirth,
      age: validatedData.age,
      gender: validatedData.gender,
      category: validatedData.category,
      casteTribeName: validatedData.casteTribeName,
      address: validatedData.address,
      voterSerialNo: validatedData.voterSerialNo,
      voterPartNo: validatedData.voterPartNo,
      politicalPartyId: validatedData.politicalPartyId,
      isIndependent: validatedData.isIndependent,
      createdBy: session.user.id,
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
    });
  } catch (error) {
    console.error("Create nomination error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create nomination" },
      { status: 500 },
    );
  }
}

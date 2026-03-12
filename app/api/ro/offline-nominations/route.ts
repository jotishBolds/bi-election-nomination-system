import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { Role } from "@prisma/client";
import { createOfflineNomination } from "@/lib/services/ro-offline-nomination";
import { getClientIP } from "@/lib/auth/server-utils";
import { hasAccessToWard } from "@/lib/services/ro-jurisdiction";
import { z } from "zod";

// Request validation schema
const offlineNominationSchema = z.object({
  candidateInfo: z.object({
    epicNo: z.string().min(1, "EPIC number is required"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number").optional(),
    email: z.string().email("Invalid email address").optional(),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    category: z.enum(["general", "sc", "st_bl", "st_lt", "obc_central", "obc_state"]),
    casteTribeName: z.string().optional(),
  }),
  nominationData: z.object({
    wardId: z.string().uuid("Invalid ward ID"),
    ulbId: z.string().uuid("Invalid ULB ID"),
    candidateName: z.string().min(2, "Candidate name is required"),
    fatherHusbandName: z.string().min(2, "Father/Husband name is required"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    correspondingAddress: z.string().max(500, "Corresponding address must be less than 500 characters").optional(),
    voterSerialNo: z.string().max(10, "Voter serial number too long"),
    voterPartNo: z.string().max(10, "Voter part number too long"),
    politicalPartyId: z.string().uuid().nullable().optional(),
    isIndependent: z.boolean(),
    symbolPreferences: z.array(z.string()).max(3, "Maximum 3 symbol preferences allowed").optional(),
  }),
  proposers: z.array(z.object({
    name: z.string().min(2, "Proposer name is required"),
    voterSerialNo: z.string().max(10, "Voter serial number too long"),
    voterPartNo: z.string().max(10, "Voter part number too long"),
    epicNo: z.string().optional(),
    address: z.string().optional(),
  })).min(1, "At least one proposer is required"),
  documents: z.array(z.object({
    type: z.enum(["casteCertificate", "affidavit", "addressProof", "photo", "ageProof", "partyAuthorization", "form2a", "form2b", "other"]),
    url: z.string().url("Invalid document URL"),
    documentId: z.string().min(1, "Document ID is required"),
    fileName: z.string().min(1, "File name is required"),
  })).optional(),
  paymentInfo: z.object({
    brNumber: z.string().min(1, "BR number is required"),
    proofUrl: z.string().url("Invalid proof URL"),
    proofPublicId: z.string().min(1, "Proof public ID is required"),
  }).optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // RO authentication
    const session = await auth();
    if (!session?.user || !["RO", "SES", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate request
    const body = await request.json();
    const validatedData = offlineNominationSchema.parse(body);

    // Validate RO has access to the ward
    const hasWardAccess = await hasAccessToWard(
      session.user.id, 
      validatedData.nominationData.wardId
    );
    
    if (!hasWardAccess) {
      return NextResponse.json(
        { 
          success: false, 
          error: "You don't have permission to create nominations for this ward" 
        },
        { status: 403 }
      );
    }

    // Create offline nomination
    const result = await createOfflineNomination(
      validatedData,
      session.user.id,
      getClientIP(request)
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          details: result.details 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      nomination: result.nomination,
      createdUser: result.createdUser,
      message: "Offline nomination created successfully"
    });

  } catch (error) {
    console.error("Offline nomination error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create offline nomination" },
      { status: 500 }
    );
  }
}

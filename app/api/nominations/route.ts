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
import { Category, Gender, DocumentType } from "@prisma/client";

// Schema for direct API calls with flat fields
const createNominationSchema = z.object({
  ulbId: z.string().uuid(),
  wardId: z.string().uuid(),
  candidateName: z.string().min(2).max(200),
  fatherHusbandName: z.string().min(2).max(200),
  dateOfBirth: z
    .string()
    .transform((s) => new Date(s))
    .optional(),
  age: z.number().int().min(18).max(120).optional(),
  gender: z.nativeEnum(Gender).optional(),
  category: z.nativeEnum(Category),
  casteTribeName: z.string().optional(),
  address: z.string().min(5),
  voterSerialNo: z.string().max(10).optional().default(""),
  voterPartNo: z.string().max(10).optional().default(""),
  politicalPartyId: z.string().uuid().optional(),
  isIndependent: z.boolean().default(true),
});

// Map lowercase category strings from frontend to enum values
function mapCategory(cat: string): Category {
  const map: Record<string, Category> = {
    general: Category.GENERAL,
    sc: Category.SC,
    st_bl: Category.ST_BL,
    st_lt: Category.ST_LT,
    obc_central: Category.OBC_CENTRAL,
    obc_state: Category.OBC_STATE,
    GENERAL: Category.GENERAL,
    SC: Category.SC,
    ST_BL: Category.ST_BL,
    ST_LT: Category.ST_LT,
    OBC_CENTRAL: Category.OBC_CENTRAL,
    OBC_STATE: Category.OBC_STATE,
  };
  return map[cat] || Category.GENERAL;
}

// Transform frontend formData to flat API shape
function transformFormData(formData: any): any {
  return {
    ulbId: formData.ulbId,
    wardId: formData.wardId,
    candidateName: formData.candidateName || "",
    fatherHusbandName:
      formData.fatherOrHusbandName || formData.fatherHusbandName || "",
    dateOfBirth: formData.dateOfBirth || undefined,
    age: formData.age ? parseInt(formData.age, 10) : undefined,
    gender: formData.gender || undefined,
    category: mapCategory(formData.category || "general"),
    casteTribeName: formData.casteTribeName || undefined,
    address: formData.fullPostalAddress || formData.address || "",
    voterSerialNo: formData.serialNoCandidate || formData.voterSerialNo || "",
    voterPartNo: formData.partNoCandidate || formData.voterPartNo || "",
    politicalPartyId:
      formData.politicalPartyId && formData.politicalPartyId !== "independent"
        ? formData.politicalPartyId
        : undefined,
    isIndependent:
      formData.politicalPartyId === "independent" || !formData.politicalPartyId,
  };
}

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

    // Support both flat API shape and nested { formData } from frontend
    let dataToValidate: any;
    if (body.formData) {
      dataToValidate = transformFormData(body.formData);
    } else {
      dataToValidate = body;
    }

    const validatedData = createNominationSchema.parse(dataToValidate);

    // Get or auto-create applicant profile
    let profile = await db.applicantProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      // Try to find a voter record for this user to auto-create profile
      const user = await db.user.findUnique({
        where: { id: session.user.id },
      });

      // Look up voter record by matching fields from form data or user data
      let voterRecord = null;

      // Try matching by EPIC number from body if provided
      const epicNo = body.formData?.epicNumber || body.epicNo;
      if (epicNo) {
        voterRecord = await db.voterRecord.findUnique({
          where: { epicNo },
        });
      }

      // If no voter record found, try to find any matching voter in the same ward
      if (!voterRecord && validatedData.wardId) {
        voterRecord = await db.voterRecord.findFirst({
          where: {
            wardId: validatedData.wardId,
            name: {
              contains: validatedData.candidateName.split(" ")[0],
              mode: "insensitive",
            },
          },
        });
      }

      // If still no voter record, create a placeholder voter record
      if (!voterRecord) {
        // Get the first active voter db version
        let dbVersion = await db.voterDBVersion.findFirst({
          where: { isActive: true },
        });

        if (!dbVersion) {
          // Create a default DB version if none exists
          dbVersion = await db.voterDBVersion.create({
            data: {
              version: "1.0",
              uploadedBy: session.user.id,
              recordCount: 0,
              fileHash: "placeholder",
              isActive: true,
            },
          });
        }

        voterRecord = await db.voterRecord.create({
          data: {
            epicNo: epicNo || `TEMP-${Date.now()}`,
            name: validatedData.candidateName,
            fatherHusbandName: validatedData.fatherHusbandName,
            gender: validatedData.gender || Gender.MALE,
            dateOfBirth: validatedData.dateOfBirth || new Date("1990-01-01"),
            age: validatedData.age || 30,
            address: validatedData.address,
            partNo: validatedData.voterPartNo || "0",
            serialNo: validatedData.voterSerialNo || "0",
            ulbId: validatedData.ulbId,
            wardId: validatedData.wardId,
            dbVersionId: dbVersion.id,
          },
        });
      }

      // Create ApplicantProfile
      profile = await db.applicantProfile.create({
        data: {
          userId: session.user.id,
          voterRecordId: voterRecord.id,
          epicNo: voterRecord.epicNo,
          category: validatedData.category,
          casteTribeName: validatedData.casteTribeName || null,
          consentAccepted: true,
          consentAcceptedAt: new Date(),
        },
      });
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
      gender: validatedData.gender || Gender.MALE,
      category: validatedData.category,
      casteTribeName: validatedData.casteTribeName,
      address: validatedData.address,
      voterSerialNo: validatedData.voterSerialNo || "",
      voterPartNo: validatedData.voterPartNo || "",
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

    const nominationId = result.nomination?.id;
    const rawFormData = body.formData || body;

    // Save documents linked to this nomination (Cloudinary URLs)
    if (nominationId) {
      const docTypes: { key: string; type: DocumentType }[] = [
        { key: "casteCertificateUrl", type: DocumentType.CASTE_CERTIFICATE },
        { key: "affidavitUrl", type: DocumentType.AFFIDAVIT },
        { key: "addressProofUrl", type: DocumentType.RESIDENCE_PROOF },
      ];
      for (const dt of docTypes) {
        const url = rawFormData?.[dt.key];
        if (url && typeof url === "string" && url.startsWith("http")) {
          await db.document.create({
            data: {
              nominationId,
              type: dt.type,
              fileName: dt.key.replace("Url", ""),
              originalName: dt.key.replace("Url", ""),
              mimeType: "application/octet-stream",
              fileSize: 0,
              storagePath: url,
              checksum: "cloudinary-upload",
            },
          });
        }
      }

      // Save proposer data if provided
      const proposerName = rawFormData?.proposerName;
      if (proposerName && proposerName.trim() !== "") {
        await db.proposer.create({
          data: {
            nominationId,
            name: proposerName,
            voterSerialNo: rawFormData?.proposerSerialNo || "",
            voterPartNo: rawFormData?.proposerPartNo || "",
          },
        });
      }

      // Save symbol preferences if provided
      const symbolPrefs = [
        { name: rawFormData?.symbolPreference1, order: 1 },
        { name: rawFormData?.symbolPreference2, order: 2 },
        { name: rawFormData?.symbolPreference3, order: 3 },
      ].filter((p) => p.name && p.name.trim() !== "");

      for (const pref of symbolPrefs) {
        const symbol = await db.electionSymbol.findFirst({
          where: { name: pref.name },
        });
        if (symbol) {
          await db.symbolPreference.create({
            data: {
              nominationId,
              symbolId: symbol.id,
              preferenceOrder: pref.order,
            },
          });
        }
      }

      // Link BR payment from sessionStorage data passed in request
      const brNumber = rawFormData?.brNumber || body.brNumber;
      const brProofUrl = rawFormData?.brProofUrl || body.brProofUrl;
      if (brNumber) {
        await db.bRPayment.create({
          data: {
            nominationId,
            brNumber,
            proofImageUrl: brProofUrl || "pending-upload",
            proofPublicId:
              rawFormData?.brProofPublicId || body.brProofPublicId || null,
          },
        });
      }
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

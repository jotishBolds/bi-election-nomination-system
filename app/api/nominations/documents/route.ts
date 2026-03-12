// Document Upload API Route - Upload nomination documents to Cloudinary
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { auth } from "@/lib/auth/next-auth";
import { DocumentType, DocumentStatus } from "@prisma/client";
import crypto from "crypto";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "application/pdf",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const DOC_TYPE_MAP: Record<string, DocumentType> = {
  casteCertificate: DocumentType.CASTE_CERTIFICATE,
  affidavit: DocumentType.AFFIDAVIT,
  addressProof: DocumentType.RESIDENCE_PROOF,
  photo: DocumentType.PHOTO,
  ageProof: DocumentType.AGE_PROOF,
  partyAuthorization: DocumentType.PARTY_AUTHORIZATION,
  form2a: DocumentType.FORM_2A,
  form2b: DocumentType.FORM_2B,
  other: DocumentType.OTHER,
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["CANDIDATE", "RO", "SES", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const docType = formData.get("type") as string;
    const nominationId = formData.get("nominationId") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File is required" },
        { status: 400 },
      );
    }

    if (!docType) {
      return NextResponse.json(
        { success: false, error: "Document type is required" },
        { status: 400 },
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Accepted: JPG, PNG, WebP, PDF",
        },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File size must be less than 5MB" },
        { status: 400 },
      );
    }

    // Map document type
    const documentType = DOC_TYPE_MAP[docType] || DocumentType.OTHER;

    // Upload to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    const folder = `nomination-documents/${session.user.id}`;
    const { url, publicId } = await uploadToCloudinary(buffer, folder);

    // If nominationId is provided and valid, create document record
    const isValidUUID =
      nominationId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        nominationId,
      );

    let document = null;
    if (isValidUUID) {
      document = await db.document.create({
        data: {
          nominationId: nominationId!,
          type: documentType,
          fileName: publicId,
          originalName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          storagePath: url,
          checksum,
          status: DocumentStatus.PENDING,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        url,
        publicId,
        documentId: document?.id,
        type: docType,
        originalName: file.name,
      },
    });
  } catch (err: unknown) {
    console.error("Document upload error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to upload document" },
      { status: 500 },
    );
  }
}

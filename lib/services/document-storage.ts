// Document Storage Service - S3/MinIO
import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { db } from "@/lib/db";
import { DocumentType, DocumentStatus } from "@prisma/client";

// Initialize S3 client
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
  },
  forcePathStyle: true, // Required for MinIO
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "election-documents";

// Allowed file types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface UploadDocumentInput {
  nominationId: string;
  type: DocumentType;
  file: Buffer;
  originalName: string;
  mimeType: string;
}

// Generate checksum for file
function generateChecksum(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// Generate unique file name
function generateFileName(originalName: string, nominationId: string): string {
  const ext = originalName.split(".").pop() || "bin";
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex");
  return `nominations/${nominationId}/${timestamp}-${random}.${ext}`;
}

// Upload document
export async function uploadDocument(
  input: UploadDocumentInput,
): Promise<{ success: boolean; document?: any; error?: string }> {
  try {
    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
      return {
        success: false,
        error: "Invalid file type. Allowed: JPEG, PNG, PDF",
      };
    }

    // Validate file size
    if (input.file.length > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "File size exceeds 5MB limit",
      };
    }

    // Generate checksum
    const checksum = generateChecksum(input.file);

    // Generate storage path
    const storagePath = generateFileName(
      input.originalName,
      input.nominationId,
    );
    const fileName = storagePath.split("/").pop() || input.originalName;

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: storagePath,
        Body: input.file,
        ContentType: input.mimeType,
        Metadata: {
          originalName: input.originalName,
          nominationId: input.nominationId,
          documentType: input.type,
          checksum,
        },
      }),
    );

    // Save to database
    const document = await db.document.create({
      data: {
        nominationId: input.nominationId,
        type: input.type,
        fileName,
        originalName: input.originalName,
        mimeType: input.mimeType,
        fileSize: input.file.length,
        storagePath,
        checksum,
        status: DocumentStatus.PENDING,
      },
    });

    return { success: true, document };
  } catch (error) {
    console.error("Upload document error:", error);
    return { success: false, error: "Failed to upload document" };
  }
}

// Get signed URL for document access
export async function getDocumentUrl(
  documentId: string,
  expiresIn: number = 3600, // 1 hour default
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const document = await db.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return { success: false, error: "Document not found" };
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: document.storagePath,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return { success: true, url };
  } catch (error) {
    console.error("Get document URL error:", error);
    return { success: false, error: "Failed to get document URL" };
  }
}

// Delete document
export async function deleteDocument(
  documentId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const document = await db.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return { success: false, error: "Document not found" };
    }

    // Delete from S3
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: document.storagePath,
      }),
    );

    // Delete from database
    await db.document.delete({
      where: { id: documentId },
    });

    return { success: true };
  } catch (error) {
    console.error("Delete document error:", error);
    return { success: false, error: "Failed to delete document" };
  }
}

// Verify document (by RO)
export async function verifyDocument(
  documentId: string,
  verifiedBy: string,
  status: "VERIFIED" | "REJECTED",
  rejectionNote?: string,
): Promise<{ success: boolean; document?: any; error?: string }> {
  try {
    const document = await db.document.update({
      where: { id: documentId },
      data: {
        status:
          status === "VERIFIED"
            ? DocumentStatus.VERIFIED
            : DocumentStatus.REJECTED,
        verifiedBy,
        verifiedAt: new Date(),
        rejectionNote,
      },
    });

    return { success: true, document };
  } catch (error) {
    console.error("Verify document error:", error);
    return { success: false, error: "Failed to verify document" };
  }
}

// Get all documents for a nomination
export async function getNominationDocuments(nominationId: string) {
  return db.document.findMany({
    where: { nominationId },
    orderBy: { uploadedAt: "desc" },
  });
}

// Validate document integrity
export async function validateDocumentIntegrity(
  documentId: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const document = await db.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return { valid: false, error: "Document not found" };
    }

    // Get file from S3
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: document.storagePath,
      }),
    );

    if (!response.Body) {
      return { valid: false, error: "Failed to retrieve file" };
    }

    // Read file content
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Verify checksum
    const currentChecksum = generateChecksum(buffer);
    if (currentChecksum !== document.checksum) {
      return {
        valid: false,
        error: "Document checksum mismatch - file may be corrupted",
      };
    }

    return { valid: true };
  } catch (error) {
    console.error("Validate document integrity error:", error);
    return { valid: false, error: "Failed to validate document" };
  }
}

// Get upload presigned URL (for client-side direct upload)
export async function getUploadPresignedUrl(
  nominationId: string,
  fileName: string,
  mimeType: string,
): Promise<{ success: boolean; url?: string; key?: string; error?: string }> {
  try {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return {
        success: false,
        error: "Invalid file type. Allowed: JPEG, PNG, PDF",
      };
    }

    const key = generateFileName(fileName, nominationId);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: mimeType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return { success: true, url, key };
  } catch (error) {
    console.error("Get upload presigned URL error:", error);
    return { success: false, error: "Failed to generate upload URL" };
  }
}

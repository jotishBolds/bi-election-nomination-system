import "server-only";
import { db } from "@/lib/db";
import { Role, Category, Gender, DocumentType, DocumentStatus } from "@prisma/client";
import { hashPassword } from "@/lib/auth/server-utils";
import { validateActionAllowed } from "@/lib/services/election-time";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { hasAccessToWard } from "@/lib/services/ro-jurisdiction";
import * as crypto from "crypto";

interface OfflineNominationRequest {
  candidateInfo: {
    epicNo: string;
    name: string;
    phone?: string;
    email?: string;
    dateOfBirth: string;
    gender: "MALE" | "FEMALE" | "OTHER";
    category: "general" | "sc" | "st_bl" | "st_lt" | "obc_central" | "obc_state";
    casteTribeName?: string;
  };
  nominationData: {
    wardId: string;
    ulbId: string;
    candidateName: string;
    fatherHusbandName: string;
    address: string;
    correspondingAddress?: string;
    voterSerialNo: string;
    voterPartNo: string;
    politicalPartyId?: string | null;
    isIndependent: boolean;
    symbolPreferences?: string[];
  };
  proposers: Array<{
    name: string;
    voterSerialNo: string;
    voterPartNo: string;
    epicNo?: string;
    address?: string;
  }>;
  documents?: Array<{
    type: "casteCertificate" | "affidavit" | "addressProof" | "photo" | "ageProof" | "partyAuthorization" | "form2a" | "form2b" | "other";
    url: string;
    documentId: string;
    fileName: string;
  }>;
  paymentInfo?: {
    brNumber: string;
    proofUrl: string;
    proofPublicId: string;
  };
  notes?: string;
}

// Category mapping
const categoryMap: Record<string, Category> = {
  general: Category.GENERAL,
  sc: Category.SC,
  st_bl: Category.ST_BL,
  st_lt: Category.ST_LT,
  obc_central: Category.OBC_CENTRAL,
  obc_state: Category.OBC_STATE,
};

// Document type mapping
const docTypeMap: Record<string, DocumentType> = {
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

// Helper function to validate symbol names exist in database
async function validateSymbolNames(symbolNames: string[]): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  try {
    // Check if all symbol names exist in the database
    const existingSymbols = await db.electionSymbol.findMany({
      where: {
        name: { in: symbolNames.map(name => name.trim()) },
        isActive: true
      },
      select: { name: true }
    });
    
    const existingSymbolNames = existingSymbols.map(s => s.name.toLowerCase().trim());
    
    for (const symbolName of symbolNames) {
      const trimmedName = symbolName.trim().toLowerCase();
      if (!existingSymbolNames.includes(trimmedName)) {
        errors.push(`Symbol "${symbolName}" does not exist or is not active`);
      }
    }
    
    // Check for duplicates
    const uniqueNames = new Set(symbolNames.map(name => name.trim().toLowerCase()));
    if (uniqueNames.size !== symbolNames.length) {
      errors.push("Duplicate symbol preferences are not allowed");
    }
    
  } catch (error) {
    console.error("Error validating symbol names:", error);
    errors.push("Failed to validate symbol preferences");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function to validate input data
async function validateOfflineNominationInput(data: OfflineNominationRequest): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Validate candidate info
  if (!data.candidateInfo.epicNo || data.candidateInfo.epicNo.trim().length === 0) {
    errors.push("EPIC number is required");
  }
  if (!data.candidateInfo.name || data.candidateInfo.name.trim().length === 0) {
    errors.push("Candidate name is required");
  }
  if (!data.candidateInfo.dateOfBirth) {
    errors.push("Date of birth is required");
  }
  if (!data.candidateInfo.gender) {
    errors.push("Gender is required");
  }
  if (!data.candidateInfo.category) {
    errors.push("Category is required");
  }

  // Validate nomination data
  if (!data.nominationData.wardId) {
    errors.push("Ward ID is required");
  }
  if (!data.nominationData.ulbId) {
    errors.push("ULB ID is required");
  }
  if (!data.nominationData.candidateName || data.nominationData.candidateName.trim().length === 0) {
    errors.push("Nomination candidate name is required");
  }
  if (!data.nominationData.address || data.nominationData.address.trim().length === 0) {
    errors.push("Address is required");
  }
  
  // Validate correspondence address (optional)
  if (data.nominationData.correspondingAddress && data.nominationData.correspondingAddress.trim().length > 500) {
    errors.push("Corresponding address must be less than 500 characters");
  }

  // Validate proposers
  if (!data.proposers || data.proposers.length === 0) {
    errors.push("At least one proposer is required");
  } else {
    data.proposers.forEach((proposer, index) => {
      if (!proposer.name || proposer.name.trim().length === 0) {
        errors.push(`Proposer ${index + 1} name is required`);
      }
      if (!proposer.epicNo || proposer.epicNo.trim().length === 0) {
        errors.push(`Proposer ${index + 1} EPIC number is required`);
      }
      if (!proposer.address || proposer.address.trim().length === 0) {
        errors.push(`Proposer ${index + 1} address is required`);
      }
    });
  }

  // Validate documents
  if (data.documents && data.documents.length > 0) {
    data.documents.forEach((doc, index) => {
      if (!doc.type || doc.type.trim().length === 0) {
        errors.push(`Document ${index + 1} type is required`);
      }
      if (!doc.url || doc.url.trim().length === 0) {
        errors.push(`Document ${index + 1} URL is required`);
      }
      if (!doc.documentId || doc.documentId.trim().length === 0) {
        errors.push(`Document ${index + 1} document ID is required`);
      }
      if (!doc.fileName || doc.fileName.trim().length === 0) {
        errors.push(`Document ${index + 1} filename is required`);
      }
    });
  }

  // Validate payment info
  if (data.paymentInfo) {
    if (!data.paymentInfo.brNumber || data.paymentInfo.brNumber.trim().length === 0) {
      errors.push("BR number is required");
    }
    if (!data.paymentInfo.proofUrl || data.paymentInfo.proofUrl.trim().length === 0) {
      errors.push("Payment proof URL is required");
    }
  }

  // Validate independent candidate requirements
  if (data.nominationData.isIndependent) {
    if (!data.nominationData.symbolPreferences || data.nominationData.symbolPreferences.length === 0) {
      errors.push("Independent candidates must provide symbol preferences");
    } else {
      if (data.nominationData.symbolPreferences.length < 3) {
        errors.push("Independent candidates must provide at least 3 symbol preferences");
      }
      if (data.nominationData.symbolPreferences.length > 3) {
        errors.push("Maximum 3 symbol preferences allowed");
      }
      
      // Validate symbol names exist in database
      const symbolValidation = await validateSymbolNames(data.nominationData.symbolPreferences);
      if (!symbolValidation.isValid) {
        errors.push(...symbolValidation.errors);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function createOfflineNomination(
  data: OfflineNominationRequest,
  createdBy: string,
  ipAddress: string
): Promise<{ success: boolean; nomination?: any; createdUser?: any; error?: string; details?: any }> {
  const cleanupFiles = async () => {
    console.log("Starting cleanup of uploaded files...");
    console.log("Documents to cleanup:", data.documents);
    console.log("Payment info to cleanup:", data.paymentInfo);
    
    const filesToDelete: string[] = [];
    
    // Extract public IDs from documents
    for (const file of data.documents || []) {
      if (file.documentId) {
        // Use the documentId directly as it's the publicId from upload
        console.log(`Found document with documentId: ${file.documentId}`);
        if (!filesToDelete.includes(file.documentId)) {
          filesToDelete.push(file.documentId);
        }
      } else if (file.url && file.url.includes("cloudinary")) {
        // Fallback: Extract publicId from Cloudinary URL
        const url = new URL(file.url);
        const pathParts = url.pathname.split('/');
        // Remove /image/upload/ and version, then join the rest
        const uploadIndex = pathParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < pathParts.length) {
          const publicId = pathParts.slice(uploadIndex + 2).join('/');
          console.log(`Extracted publicId from URL: ${publicId}`);
          if (publicId && !filesToDelete.includes(publicId)) {
            filesToDelete.push(publicId);
          }
        }
      }
    }
    
    // Also track payment proof
    if (data.paymentInfo?.proofPublicId) {
      // Use proofPublicId directly if available
      console.log(`Found payment with proofPublicId: ${data.paymentInfo.proofPublicId}`);
      if (!filesToDelete.includes(data.paymentInfo.proofPublicId)) {
        filesToDelete.push(data.paymentInfo.proofPublicId);
      }
    } else if (data.paymentInfo?.proofUrl && data.paymentInfo.proofUrl.includes("cloudinary")) {
      // Fallback: Extract from URL
      const url = new URL(data.paymentInfo.proofUrl);
      const pathParts = url.pathname.split('/');
      const uploadIndex = pathParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1 && uploadIndex + 2 < pathParts.length) {
        const publicId = pathParts.slice(uploadIndex + 2).join('/');
        console.log(`Extracted payment publicId from URL: ${publicId}`);
        if (publicId && !filesToDelete.includes(publicId)) {
          filesToDelete.push(publicId);
        }
      }
    }
    
    console.log("Files to delete from Cloudinary:", filesToDelete);
    
    // Delete files from Cloudinary
    for (const publicId of filesToDelete) {
      try {
        const result = await deleteFromCloudinary(publicId);
        console.log(`Deletion result for ${publicId}:`, result);
      } catch (error) {
        console.error("Failed to cleanup file:", publicId, error);
      }
    }
  };

  try {
    // Step 1: Validate election time and permissions
    const actionCheck = await validateActionAllowed("nomination");
    console.log(actionCheck);
    if (!actionCheck.allowed) {
      return { 
        success: false, 
        error: "Election phase validation failed",
        details: { reason: actionCheck.reason }
      };
    }

    // Step 2: Validate RO has access to the ward
    const hasWardAccess = await hasAccessToWard(createdBy, data.nominationData.wardId);
    if (!hasWardAccess) {
      return { 
        success: false, 
        error: "You don't have permission to create nominations for this ward",
        details: { type: "WARD_ACCESS_DENIED", wardId: data.nominationData.wardId }
      };
    }

    // Step 3: Validate input data
    const validationResult = await validateOfflineNominationInput(data);
    if (!validationResult.isValid) {
      return { 
        success: false, 
        error: "Invalid input data",
        details: validationResult.errors 
      };
    }

    // Step 3: Execute all operations in a single transaction
    const result = await db.$transaction(async (tx) => {
      // Create or find candidate user
      const userResult = await createOfflineCandidateUserInTransaction(
        tx,
        {
          epicNo: data.candidateInfo.epicNo,
          name: data.candidateInfo.name,
          phone: data.candidateInfo.phone,
          email: data.candidateInfo.email,
        },
        createdBy
      );

      if (!userResult.success) {
        throw new Error(`User creation failed: ${userResult.error}`);
      }

      // Create nomination draft
      const nominationResult = await createNominationDraftInTransaction(
        tx,
        {
          applicantProfileId: userResult.user.applicantProfiles[0].id,
          ulbId: data.nominationData.ulbId,
          wardId: data.nominationData.wardId,
          candidateName: data.nominationData.candidateName,
          fatherHusbandName: data.nominationData.fatherHusbandName,
          dateOfBirth: new Date(data.candidateInfo.dateOfBirth),
          age: calculateAge(data.candidateInfo.dateOfBirth),
          gender: data.candidateInfo.gender as Gender,
          category: categoryMap[data.candidateInfo.category],
          casteTribeName: data.candidateInfo.casteTribeName,
          address: data.nominationData.address,
          correspondingAddress: data.nominationData.correspondingAddress || null,
          voterSerialNo: data.nominationData.voterSerialNo,
          voterPartNo: data.nominationData.voterPartNo,
          politicalPartyId: data.nominationData.politicalPartyId,
          isIndependent: data.nominationData.isIndependent,
          createdBy: createdBy,
          ipAddress: ipAddress,
        }
      );

      if (!nominationResult.success) {
        throw new Error(`Nomination creation failed: ${nominationResult.error}`);
      }

      const nomination = nominationResult.nomination;

      // Add proposers
      for (const proposer of data.proposers) {
        const proposerResult = await addProposerInTransaction(
          tx,
          nomination.id,
          {
            name: proposer.name,
            voterSerialNo: proposer.voterSerialNo,
            voterPartNo: proposer.voterPartNo,
            epicNo: proposer.epicNo,
            address: proposer.address,
          },
          createdBy,
          ipAddress
        );

        if (!proposerResult.success) {
          throw new Error(`Failed to add proposer ${proposer.name}: ${proposerResult.error}`);
        }
      }

      // Handle documents inside transaction
      if (data.documents && data.documents.length > 0) {
        for (const doc of data.documents) {
          await tx.document.create({
            data: {
              nominationId: nomination.id,
              type: docTypeMap[doc.type] || DocumentType.OTHER,
              fileName: doc.documentId,  // Use documentId from upload API
              originalName: doc.fileName,
              mimeType: "application/pdf", // Could be enhanced to detect from file
              fileSize: 0, // Could be fetched from upload API if needed
              storagePath: doc.url,      // Use URL from upload API
              checksum: crypto.createHash("sha256").update(doc.url).digest("hex"),
              status: DocumentStatus.PENDING,
            },
          });
        }
      }

      // Handle payment info
      if (data.paymentInfo) {
        await tx.bRPayment.create({
          data: {
            nominationId: nomination.id,
            brNumber: data.paymentInfo.brNumber,
            proofImageUrl: data.paymentInfo.proofUrl,
            proofPublicId: data.paymentInfo.proofPublicId,
            status: "PENDING",
          },
        });
      }

      // Add symbol preferences for independent candidates
      if (data.nominationData.isIndependent && data.nominationData.symbolPreferences) {
        const symbolIds = await getSymbolIdsFromNamesInTransaction(tx, data.nominationData.symbolPreferences);
        if (symbolIds.length > 0) {
          const symbolResult = await addSymbolPreferencesInTransaction(
            tx,
            nomination.id,
            symbolIds,
            createdBy,
            ipAddress
          );
          if (!symbolResult.success) {
            throw new Error(`Failed to add symbol preferences: ${symbolResult.error}`);
          }
        }
      }

      // Submit nomination immediately (offline nominations are ready)
      const submitResult = await submitNominationInTransaction(
        tx,
        {
          nominationId: nomination.id,
          userId: createdBy,
          ipAddress: ipAddress,
        }
      );

      if (!submitResult.success) {
        throw new Error(`Failed to submit nomination: ${submitResult.error}`);
      }

      // Log offline creation
      await tx.auditLog.create({
        data: {
          userId: createdBy,
          action: "CREATE",
          entityType: "NominationApplication",
          entityId: nomination.id,
          newValues: {
            applicationNo: nomination.applicationNo,
            candidateName: data.nominationData.candidateName,
            epicNo: data.candidateInfo.epicNo,
            isOffline: true,
            notes: data.notes,
          },
          ipAddress: ipAddress,
          metadata: {
            createdFor: "offline_candidate",
            createdBy: createdBy,
            documentsCount: data.documents?.length || 0,
            proposersCount: data.proposers.length,
          },
        },
      });

      return {
        nomination: submitResult.nomination,
        createdUser: {
          id: userResult.user.id,
          email: userResult.user.email,
          phone: userResult.user.phone,
          tempPassword: userResult.tempPassword,
        }
      };

    }, {
      timeout: 30000, // 30 second timeout for transaction
    });

    return {
      success: true,
      nomination: result.nomination,
      createdUser: result.createdUser,
    };

  } catch (error) {
    console.error("Create offline nomination error:", error);
    
    // Clean up uploaded files on failure
    await cleanupFiles();
    
    // Handle different types of errors
    if (error instanceof Error) {
      // Transaction timeout
      if (error.message.includes('Transaction')) {
        return { 
          success: false, 
          error: "Transaction timeout. Please try again.",
          details: { type: "TRANSACTION_TIMEOUT" }
        };
      }
      
      // Validation errors
      if (error.message.includes('validation') || error.message.includes('Invalid')) {
        return { 
          success: false, 
          error: "Validation failed",
          details: { type: "VALIDATION_ERROR", message: error.message }
        };
      }
      
      // Database errors
      if (error.message.includes('database') || error.message.includes('constraint')) {
        return { 
          success: false, 
          error: "Database operation failed",
          details: { type: "DATABASE_ERROR", message: "Data integrity violation" }
        };
      }
      
      // Network/External service errors
      if (error.message.includes('network') || error.message.includes('upload')) {
        return { 
          success: false, 
          error: "External service unavailable",
          details: { type: "EXTERNAL_SERVICE_ERROR", message: "Please try again later" }
        };
      }
      
      // Known business logic errors
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        return { 
          success: false, 
          error: "Duplicate record detected",
          details: { type: "DUPLICATE_ERROR", message: "Candidate or nomination already exists" }
        };
      }
    }
    
    // Generic error
    return { 
      success: false, 
      error: "Failed to create offline nomination",
      details: { 
        type: "UNKNOWN_ERROR",
        message: process.env.NODE_ENV === 'development' ? String(error) : "Internal server error"
      }
    };
  }
}

// Transaction-specific helper functions

async function createOfflineCandidateUserInTransaction(
  tx: any,
  candidateData: {
    epicNo: string;
    name: string;
    phone?: string;
    email?: string;
  },
  createdBy: string
): Promise<{ success: boolean; user?: any; tempPassword?: string; error?: string }> {
  try {
    // Check for existing user
    const existingUser = await tx.user.findFirst({
      where: {
        OR: [
          ...(candidateData.phone ? [{ phone: candidateData.phone }] : []),
          ...(candidateData.email ? [{ email: candidateData.email?.toLowerCase() }] : []),
        ],
      },
    });

    if (existingUser) {
      // Check if user has applicant profile
      const existingProfile = await tx.applicantProfile.findFirst({
        where: { userId: existingUser.id }
      });

      if (existingProfile) {
        return { success: false, error: "Candidate already exists in system" };
      }

      // Create applicant profile for existing user
      const profile = await tx.applicantProfile.create({
        data: {
          userId: existingUser.id,
          epicNo: candidateData.epicNo,
          voterRecordId: (await getOrCreateVoterRecordInTransaction(tx, candidateData.epicNo)).id,
          category: Category.GENERAL, // Default category
          consentAccepted: true,
        },
      });

      return { success: true, user: { ...existingUser, applicantProfiles: [profile] } };
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await hashPassword(tempPassword);

    // Create new user without OTP verification
    const user = await tx.user.create({
      data: {
        phone: candidateData.phone || null,
        email: candidateData.email?.toLowerCase() || null,
        name: candidateData.name,
        passwordHash: hashedPassword,
        isActive: true,
        isPhoneVerified: false, // No OTP verification for offline
        isEmailVerified: false,
        roles: {
          create: {
            role: Role.CANDIDATE,
            isActive: true,
          },
        },
      },
      include: {
        roles: true,
      },
    });

    // Create applicant profile
    const profile = await tx.applicantProfile.create({
      data: {
        userId: user.id,
        epicNo: candidateData.epicNo,
        voterRecordId: (await getOrCreateVoterRecordInTransaction(tx, candidateData.epicNo)).id,
        category: Category.GENERAL, // Default category
        consentAccepted: true, // RO consent on behalf
      },
    });

    // Audit logging
    await tx.auditLog.create({
      data: {
        userId: createdBy,
        action: "USER_CREATED",
        entityType: "User",
        entityId: user.id,
        newValues: {
          phone: candidateData.phone,
          email: candidateData.email,
          epicNo: candidateData.epicNo,
          isPhoneVerified: false,
        },
        ipAddress: "ro-offline-creation",
      },
    });

    return { 
      success: true, 
      user: { ...user, applicantProfiles: [profile] }, 
      tempPassword: candidateData.phone ? tempPassword : undefined 
    };

  } catch (error) {
    console.error("Create offline user error:", error);
    return { success: false, error: "Failed to create user" };
  }
}

async function createNominationDraftInTransaction(
  tx: any,
  input: any
): Promise<{ success: boolean; nomination?: any; error?: string }> {
  try {
    // Check existing nominations for this applicant
    const existingCount = await tx.nominationApplication.count({
      where: { applicantProfileId: input.applicantProfileId },
    });

    const applicationNo = generateApplicationNumber();

    const nomination = await tx.nominationApplication.create({
      data: {
        applicationNo,
        applicantProfileId: input.applicantProfileId,
        ulbId: input.ulbId,
        wardId: input.wardId,
        submissionNumber: existingCount + 1,
        status: "DRAFT",
        candidateName: input.candidateName,
        fatherHusbandName: input.fatherHusbandName,
        dateOfBirth: input.dateOfBirth || null,
        age: input.age || null,
        gender: input.gender || Gender.MALE,
        category: input.category,
        casteTribeName: input.casteTribeName,
        address: input.address,
        correspondingAddress: input.correspondingAddress || null,
        voterSerialNo: input.voterSerialNo || "",
        voterPartNo: input.voterPartNo || "",
        politicalPartyId: input.politicalPartyId || null,
        isIndependent: input.isIndependent,
        createdBy: input.createdBy,
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
      },
    });

    // Create status history
    await tx.nominationStatusHistory.create({
      data: {
        nominationId: nomination.id,
        toStatus: "DRAFT",
        changedBy: input.createdBy,
        ipAddress: input.ipAddress,
        remarks: "Nomination draft created",
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: input.createdBy,
        action: "CREATE",
        entityType: "NominationApplication",
        entityId: nomination.id,
        newValues: { applicationNo, status: "DRAFT" },
        ipAddress: input.ipAddress,
      },
    });

    return { success: true, nomination };
  } catch (error) {
    console.error("Create nomination error:", error);
    return { success: false, error: "Failed to create nomination" };
  }
}

async function addProposerInTransaction(
  tx: any,
  nominationId: string,
  proposerData: any,
  createdBy: string,
  ipAddress: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await tx.proposer.create({
      data: {
        nominationId,
        name: proposerData.name,
        voterSerialNo: proposerData.voterSerialNo,
        voterPartNo: proposerData.voterPartNo,
        epicNo: proposerData.epicNo,
        address: proposerData.address,
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: createdBy,
        action: "CREATE",
        entityType: "Proposer",
        entityId: nominationId,
        newValues: proposerData,
        ipAddress: ipAddress,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Add proposer error:", error);
    return { success: false, error: "Failed to add proposer" };
  }
}

async function processOfflineDocumentInTransaction(
  tx: any,
  nominationId: string,
  document: {
    type: string;
    file: string;
    fileName: string;
  },
  createdBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(document.file, 'base64');
    
    // Validate file size (5MB limit)
    if (buffer.length > 5 * 1024 * 1024) {
      return { success: false, error: "File size exceeds 5MB limit" };
    }

    // TODO: Upload to Cloudinary (commented out for testing)
    // const folder = `offline-nominations/${nominationId}`;
    // const { url, publicId } = await uploadToCloudinary(buffer, folder);
    
    // Mock Cloudinary response for testing
    const mockUrl = `https://mock-cloudinary.com/offline-nominations/${nominationId}/${document.fileName}`;
    const mockPublicId = `offline-nominations/${nominationId}/${document.fileName}`;
    
    // Create document record
    await tx.document.create({
      data: {
        nominationId,
        type: docTypeMap[document.type] || DocumentType.OTHER,
        fileName: mockPublicId,
        originalName: document.fileName,
        mimeType: "application/pdf", // Assume PDF for offline
        fileSize: buffer.length,
        storagePath: mockUrl,
        checksum: crypto.createHash("sha256").update(buffer).digest("hex"),
        status: DocumentStatus.PENDING,
      },
    });

    return { success: true };

  } catch (error) {
    console.error("Process offline document error:", error);
    return { success: false, error: "Failed to process document" };
  }
}

async function getSymbolIdsFromNamesInTransaction(tx: any, symbolNames: string[]): Promise<string[]> {
  const symbolIds: string[] = [];
  
  for (const name of symbolNames) {
    const symbol = await tx.electionSymbol.findFirst({
      where: { name: name.trim() }
    });
    if (symbol) {
      symbolIds.push(symbol.id);
    }
  }
  
  return symbolIds;
}

async function addSymbolPreferencesInTransaction(
  tx: any,
  nominationId: string,
  symbolIds: string[],
  createdBy: string,
  ipAddress: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete existing symbol preferences
    await tx.symbolPreference.deleteMany({
      where: { nominationId }
    });

    // Create new symbol preferences
    for (const symbolId of symbolIds) {
      await tx.symbolPreference.create({
        data: {
          nominationId,
          symbolId,
          preferenceOrder: symbolIds.indexOf(symbolId) + 1,
        },
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: createdBy,
        action: "CREATE",
        entityType: "SymbolPreference",
        entityId: nominationId,
        newValues: { symbolIds, preferenceOrder: symbolIds.map((_, i) => i + 1) },
        ipAddress: ipAddress,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Add symbol preferences error:", error);
    return { success: false, error: "Failed to add symbol preferences" };
  }
}

async function submitNominationInTransaction(
  tx: any,
  input: {
    nominationId: string;
    userId: string;
    ipAddress: string;
  }
): Promise<{ success: boolean; nomination?: any; error?: string }> {
  try {
    // Get nomination
    const nomination = await tx.nominationApplication.findUnique({
      where: { id: input.nominationId },
      include: {
        brPayments: true,
        documents: true,
        proposers: true,
        applicantProfile: true,
      },
    });

    if (!nomination) {
      return { success: false, error: "Nomination not found" };
    }

    if (nomination.status !== "DRAFT") {
      return { success: false, error: "Nomination is not in draft status" };
    }

    // Check required documents
    if (nomination.documents.length === 0) {
      return { success: false, error: "At least one document is required" };
    }

    // Check proposers
    if (nomination.proposers.length === 0) {
      return { success: false, error: "At least one proposer is required" };
    }

    // Update nomination status
    const updatedNomination = await tx.nominationApplication.update({
      where: { id: input.nominationId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    // Create status history
    await tx.nominationStatusHistory.create({
      data: {
        nominationId: input.nominationId,
        fromStatus: "DRAFT",
        toStatus: "SUBMITTED",
        changedBy: input.userId,
        ipAddress: input.ipAddress,
        remarks: "Nomination submitted",
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: input.userId,
        action: "CREATE",
        entityType: "NominationApplication",
        entityId: input.nominationId,
        newValues: { status: "SUBMITTED", submittedAt: new Date() },
        ipAddress: input.ipAddress,
      },
    });

    return { success: true, nomination: updatedNomination };
  } catch (error) {
    console.error("Submit nomination error:", error);
    return { success: false, error: "Failed to submit nomination" };
  }
}

async function getOrCreateVoterRecordInTransaction(tx: any, epicNo: string, wardId?: string, ulbId?: string) {
  // Try to find existing voter record
  let voterRecord = await tx.voterRecord.findUnique({
    where: { epicNo }
  });

  if (!voterRecord) {
    // Get default ULB and Ward if not provided
    let defaultWard = null;
    if (wardId) {
      defaultWard = await tx.ward.findUnique({ where: { id: wardId } });
    } else {
      // Get first available ward
      defaultWard = await tx.ward.findFirst();
    }

    if (!defaultWard) {
      throw new Error("No ward available for voter record creation");
    }

    // Create a placeholder voter record
    const dbVersion = await tx.voterDBVersion.findFirst({
      where: { isActive: true }
    });

    voterRecord = await tx.voterRecord.create({
      data: {
        epicNo,
        name: "Offline Candidate",
        fatherHusbandName: "Father/Husband",
        gender: Gender.MALE,
        dateOfBirth: new Date("1990-01-01"),
        age: 30,
        address: "Address to be updated",
        partNo: "0",
        serialNo: "0",
        ulbId: defaultWard.ulbId,
        wardId: defaultWard.id,
        dbVersionId: dbVersion?.id || "",
      }
    });
  }

  return voterRecord;
}

// Helper function to generate application number
function generateApplicationNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `APP${timestamp}${random}`;
}

function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'SES', 'RO', 'CANDIDATE');

-- CreateEnum
CREATE TYPE "JurisdictionType" AS ENUM ('STATE', 'DISTRICT', 'ULB', 'WARD');

-- CreateEnum
CREATE TYPE "ULBType" AS ENUM ('MUNICIPAL_CORPORATION', 'MUNICIPALITY', 'NAGAR_PANCHAYAT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('GENERAL', 'SC', 'ST_BL', 'ST_LT', 'OBC_CENTRAL', 'OBC_STATE');

-- CreateEnum
CREATE TYPE "ReservationType" AS ENUM ('UR', 'UR_W', 'SC', 'SC_W', 'ST', 'ST_W', 'ST_BL', 'ST_BL_W', 'ST_LT', 'ST_LT_W', 'OBC_C', 'OBC_C_W', 'OBC_S', 'OBC_S_W');

-- CreateEnum
CREATE TYPE "NominationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'RECEIVED', 'UNDER_SCRUTINY', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'CONTESTING', 'ELECTED_UNOPPOSED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'INITIATED', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('ONLINE', 'OFFLINE', 'EXEMPTED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PHOTO', 'AGE_PROOF', 'CASTE_CERTIFICATE', 'RESIDENCE_PROOF', 'PARTY_AUTHORIZATION', 'AFFIDAVIT', 'FORM_2A', 'FORM_2B', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OTPType" AS ENUM ('LOGIN', 'REGISTRATION', 'RECEIPT_CONFIRMATION', 'WITHDRAWAL', 'DATA_CORRECTION');

-- CreateEnum
CREATE TYPE "OTPStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'OTP_SENT', 'OTP_VERIFIED', 'OTP_FAILED', 'NOMINATION_SUBMITTED', 'NOMINATION_RECEIVED', 'NOMINATION_ACCEPTED', 'NOMINATION_REJECTED', 'NOMINATION_WITHDRAWN', 'PAYMENT_INITIATED', 'PAYMENT_COMPLETED', 'PAYMENT_FAILED', 'DOCUMENT_UPLOADED', 'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED', 'PDF_GENERATED', 'CONFIG_CHANGED', 'USER_CREATED', 'USER_UPDATED', 'USER_DEACTIVATED', 'VOTER_DB_UPLOADED');

-- CreateEnum
CREATE TYPE "ElectionPhase" AS ENUM ('PRE_NOTIFICATION', 'NOTIFICATION', 'NOMINATION', 'SCRUTINY', 'WITHDRAWAL', 'SYMBOL_ALLOTMENT', 'CAMPAIGN', 'POLLING', 'COUNTING', 'RESULTS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SMS', 'EMAIL', 'BOTH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');

-- CreateTable
CREATE TABLE "states" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "stateId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ulbs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "ULBType",
    "districtId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ulbs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wardNo" INTEGER NOT NULL,
    "wardName" VARCHAR(100) NOT NULL,
    "ulbId" UUID NOT NULL,
    "constituencyId" UUID,
    "reservationType" "ReservationType",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "constituencies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "constituencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255),
    "phone" VARCHAR(15),
    "passwordHash" VARCHAR(255),
    "name" VARCHAR(200) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" VARCHAR(45),
    "passwordChangedAt" TIMESTAMP(3),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" UUID,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_jurisdictions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "type" "JurisdictionType" NOT NULL,
    "stateId" UUID,
    "districtId" UUID,
    "ulbId" UUID,
    "wardId" UUID,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_jurisdictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "totp_secrets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "secret" VARCHAR(255) NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "totp_secrets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "sessionToken" VARCHAR(255) NOT NULL,
    "ipAddress" VARCHAR(45) NOT NULL,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID,
    "phone" VARCHAR(15),
    "email" VARCHAR(255),
    "otpHash" VARCHAR(255) NOT NULL,
    "type" "OTPType" NOT NULL,
    "status" "OTPStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "ipAddress" VARCHAR(45) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voter_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "epicNo" VARCHAR(20) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "fatherHusbandName" VARCHAR(200) NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "age" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "partNo" VARCHAR(10) NOT NULL,
    "serialNo" VARCHAR(10) NOT NULL,
    "ulbId" UUID NOT NULL,
    "wardId" UUID NOT NULL,
    "photo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dbVersionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voter_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voter_db_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "version" VARCHAR(50) NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" UUID NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "fileHash" VARCHAR(64) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "activatedAt" TIMESTAMP(3),
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "voter_db_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicant_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "voterRecordId" UUID NOT NULL,
    "epicNo" VARCHAR(20) NOT NULL,
    "category" "Category" NOT NULL,
    "casteTribeName" VARCHAR(100),
    "occupation" VARCHAR(100),
    "educationLevel" VARCHAR(100),
    "isConvicted" BOOLEAN NOT NULL DEFAULT false,
    "convictionDetails" TEXT,
    "isInsolvent" BOOLEAN NOT NULL DEFAULT false,
    "insolvencyDetails" TEXT,
    "hasGovernmentContract" BOOLEAN NOT NULL DEFAULT false,
    "contractDetails" TEXT,
    "consentAccepted" BOOLEAN NOT NULL DEFAULT false,
    "consentAcceptedAt" TIMESTAMP(3),
    "videoWatched" BOOLEAN NOT NULL DEFAULT false,
    "videoWatchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applicant_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nomination_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "applicationNo" VARCHAR(30) NOT NULL,
    "applicantProfileId" UUID NOT NULL,
    "ulbId" UUID NOT NULL,
    "wardId" UUID NOT NULL,
    "submissionNumber" INTEGER NOT NULL DEFAULT 1,
    "status" "NominationStatus" NOT NULL DEFAULT 'DRAFT',
    "candidateName" VARCHAR(200) NOT NULL,
    "fatherHusbandName" VARCHAR(200) NOT NULL,
    "dateOfBirth" DATE,
    "age" INTEGER,
    "gender" "Gender",
    "category" "Category" NOT NULL,
    "casteTribeName" VARCHAR(100),
    "address" TEXT NOT NULL,
    "voterSerialNo" VARCHAR(10) NOT NULL,
    "voterPartNo" VARCHAR(10) NOT NULL,
    "politicalPartyId" UUID,
    "isIndependent" BOOLEAN NOT NULL DEFAULT true,
    "submittedAt" TIMESTAMP(3),
    "submittedIp" VARCHAR(45),
    "createdBy" UUID NOT NULL,
    "receivedAt" TIMESTAMP(3),
    "receivedBy" UUID,
    "receiptOtpVerified" BOOLEAN NOT NULL DEFAULT false,
    "scrutinyDate" TIMESTAMP(3),
    "scrutinizedBy" UUID,
    "scrutinyRemarks" TEXT,
    "rejectionReasons" TEXT,
    "withdrawnAt" TIMESTAMP(3),
    "withdrawalReason" TEXT,
    "withdrawalApprovedBy" UUID,
    "withdrawalOtpVerified" BOOLEAN NOT NULL DEFAULT false,
    "allocatedSymbolId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nomination_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nomination_status_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nominationId" UUID NOT NULL,
    "fromStatus" "NominationStatus",
    "toStatus" "NominationStatus" NOT NULL,
    "changedBy" UUID NOT NULL,
    "remarks" TEXT,
    "ipAddress" VARCHAR(45) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nomination_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nominationId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "voterSerialNo" VARCHAR(10) NOT NULL,
    "voterPartNo" VARCHAR(10) NOT NULL,
    "epicNo" VARCHAR(20),
    "address" TEXT,
    "signatureImage" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verificationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "political_parties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "abbreviation" VARCHAR(20) NOT NULL,
    "symbolId" UUID,
    "isRecognized" BOOLEAN NOT NULL DEFAULT false,
    "isNational" BOOLEAN NOT NULL DEFAULT false,
    "isState" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "political_parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "election_symbols" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "imagePath" VARCHAR(500) NOT NULL,
    "isReserved" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "election_symbols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symbol_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nominationId" UUID NOT NULL,
    "symbolId" UUID NOT NULL,
    "preferenceOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "symbol_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symbol_allocations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wardId" UUID NOT NULL,
    "symbolId" UUID NOT NULL,
    "allocatedTo" UUID,
    "electionId" UUID NOT NULL,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "allocatedBy" UUID NOT NULL,

    CONSTRAINT "symbol_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nominationId" UUID NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storagePath" VARCHAR(500) NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedBy" UUID,
    "verifiedAt" TIMESTAMP(3),
    "rejectionNote" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "election_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "year" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "notificationDate" DATE NOT NULL,
    "nominationStartDate" DATE NOT NULL,
    "nominationEndDate" DATE NOT NULL,
    "scrutinyDate" DATE NOT NULL,
    "withdrawalStartDate" DATE NOT NULL,
    "withdrawalEndDate" DATE NOT NULL,
    "symbolAllotmentDate" DATE,
    "pollDate" DATE,
    "countingDate" DATE,
    "resultDate" DATE,
    "dailyStartTime" VARCHAR(5) NOT NULL DEFAULT '09:00',
    "dailyEndTime" VARCHAR(5) NOT NULL DEFAULT '15:00',
    "nominationFee" DECIMAL(10,2) NOT NULL,
    "scStFeeDiscount" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "maxNominationsPerCandidate" INTEGER NOT NULL DEFAULT 3,
    "maxProposersRequired" INTEGER NOT NULL DEFAULT 1,
    "currentPhase" "ElectionPhase" NOT NULL DEFAULT 'PRE_NOTIFICATION',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID NOT NULL,

    CONSTRAINT "election_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "day_module_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "electionId" UUID NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "nominationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "scrutinyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "withdrawalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "offlineEntryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "day_module_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID,
    "action" "AuditAction" NOT NULL,
    "entityType" VARCHAR(100) NOT NULL,
    "entityId" UUID,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" VARCHAR(45) NOT NULL,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID,
    "type" "NotificationType" NOT NULL,
    "recipient" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255),
    "content" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_pdfs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "formType" VARCHAR(20) NOT NULL,
    "nominationId" UUID,
    "wardId" UUID,
    "fileName" VARCHAR(255) NOT NULL,
    "storagePath" VARCHAR(500) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "generatedBy" UUID NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "generated_pdfs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voter_roll_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "epicNumber" VARCHAR(20) NOT NULL,
    "fullName" VARCHAR(200) NOT NULL,
    "relationType" VARCHAR(20) NOT NULL,
    "relationName" VARCHAR(200) NOT NULL,
    "postalAddress" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voter_roll_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "br_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nominationId" UUID NOT NULL,
    "brNumber" VARCHAR(100) NOT NULL,
    "proofImageUrl" VARCHAR(500) NOT NULL,
    "proofPublicId" VARCHAR(255),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedBy" UUID,
    "verifiedAt" TIMESTAMP(3),
    "rejectionNote" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "br_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "states_code_key" ON "states"("code");

-- CreateIndex
CREATE UNIQUE INDEX "districts_code_key" ON "districts"("code");

-- CreateIndex
CREATE INDEX "districts_stateId_idx" ON "districts"("stateId");

-- CreateIndex
CREATE UNIQUE INDEX "ulbs_code_key" ON "ulbs"("code");

-- CreateIndex
CREATE INDEX "ulbs_districtId_idx" ON "ulbs"("districtId");

-- CreateIndex
CREATE INDEX "wards_ulbId_idx" ON "wards"("ulbId");

-- CreateIndex
CREATE INDEX "wards_constituencyId_idx" ON "wards"("constituencyId");

-- CreateIndex
CREATE UNIQUE INDEX "wards_ulbId_wardNo_key" ON "wards"("ulbId", "wardNo");

-- CreateIndex
CREATE UNIQUE INDEX "constituencies_code_key" ON "constituencies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "user_roles_userId_idx" ON "user_roles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_role_key" ON "user_roles"("userId", "role");

-- CreateIndex
CREATE INDEX "user_jurisdictions_userId_idx" ON "user_jurisdictions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "totp_secrets_userId_key" ON "totp_secrets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_sessionToken_idx" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "otp_logs_userId_idx" ON "otp_logs"("userId");

-- CreateIndex
CREATE INDEX "otp_logs_phone_idx" ON "otp_logs"("phone");

-- CreateIndex
CREATE INDEX "otp_logs_email_idx" ON "otp_logs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "voter_records_epicNo_key" ON "voter_records"("epicNo");

-- CreateIndex
CREATE INDEX "voter_records_epicNo_idx" ON "voter_records"("epicNo");

-- CreateIndex
CREATE INDEX "voter_records_ulbId_idx" ON "voter_records"("ulbId");

-- CreateIndex
CREATE INDEX "voter_records_wardId_idx" ON "voter_records"("wardId");

-- CreateIndex
CREATE UNIQUE INDEX "applicant_profiles_userId_key" ON "applicant_profiles"("userId");

-- CreateIndex
CREATE INDEX "applicant_profiles_userId_idx" ON "applicant_profiles"("userId");

-- CreateIndex
CREATE INDEX "applicant_profiles_epicNo_idx" ON "applicant_profiles"("epicNo");

-- CreateIndex
CREATE UNIQUE INDEX "nomination_applications_applicationNo_key" ON "nomination_applications"("applicationNo");

-- CreateIndex
CREATE INDEX "nomination_applications_applicantProfileId_idx" ON "nomination_applications"("applicantProfileId");

-- CreateIndex
CREATE INDEX "nomination_applications_ulbId_idx" ON "nomination_applications"("ulbId");

-- CreateIndex
CREATE INDEX "nomination_applications_wardId_idx" ON "nomination_applications"("wardId");

-- CreateIndex
CREATE INDEX "nomination_applications_status_idx" ON "nomination_applications"("status");

-- CreateIndex
CREATE INDEX "nomination_applications_applicationNo_idx" ON "nomination_applications"("applicationNo");

-- CreateIndex
CREATE INDEX "nomination_status_history_nominationId_idx" ON "nomination_status_history"("nominationId");

-- CreateIndex
CREATE INDEX "proposers_nominationId_idx" ON "proposers"("nominationId");

-- CreateIndex
CREATE UNIQUE INDEX "political_parties_name_key" ON "political_parties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "political_parties_abbreviation_key" ON "political_parties"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "election_symbols_name_key" ON "election_symbols"("name");

-- CreateIndex
CREATE INDEX "symbol_preferences_nominationId_idx" ON "symbol_preferences"("nominationId");

-- CreateIndex
CREATE UNIQUE INDEX "symbol_preferences_nominationId_preferenceOrder_key" ON "symbol_preferences"("nominationId", "preferenceOrder");

-- CreateIndex
CREATE UNIQUE INDEX "symbol_preferences_nominationId_symbolId_key" ON "symbol_preferences"("nominationId", "symbolId");

-- CreateIndex
CREATE UNIQUE INDEX "symbol_allocations_wardId_symbolId_electionId_key" ON "symbol_allocations"("wardId", "symbolId", "electionId");

-- CreateIndex
CREATE INDEX "documents_nominationId_idx" ON "documents"("nominationId");

-- CreateIndex
CREATE UNIQUE INDEX "day_module_configs_electionId_dayNumber_key" ON "day_module_configs"("electionId", "dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "day_module_configs_electionId_date_key" ON "day_module_configs"("electionId", "date");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "notification_logs_userId_idx" ON "notification_logs"("userId");

-- CreateIndex
CREATE INDEX "notification_logs_status_idx" ON "notification_logs"("status");

-- CreateIndex
CREATE INDEX "generated_pdfs_nominationId_idx" ON "generated_pdfs"("nominationId");

-- CreateIndex
CREATE INDEX "generated_pdfs_wardId_idx" ON "generated_pdfs"("wardId");

-- CreateIndex
CREATE INDEX "generated_pdfs_formType_idx" ON "generated_pdfs"("formType");

-- CreateIndex
CREATE UNIQUE INDEX "voter_roll_entries_epicNumber_key" ON "voter_roll_entries"("epicNumber");

-- CreateIndex
CREATE INDEX "voter_roll_entries_epicNumber_idx" ON "voter_roll_entries"("epicNumber");

-- CreateIndex
CREATE INDEX "voter_roll_entries_fullName_idx" ON "voter_roll_entries"("fullName");

-- CreateIndex
CREATE INDEX "br_payments_nominationId_idx" ON "br_payments"("nominationId");

-- CreateIndex
CREATE INDEX "br_payments_brNumber_idx" ON "br_payments"("brNumber");

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ulbs" ADD CONSTRAINT "ulbs_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wards" ADD CONSTRAINT "wards_ulbId_fkey" FOREIGN KEY ("ulbId") REFERENCES "ulbs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wards" ADD CONSTRAINT "wards_constituencyId_fkey" FOREIGN KEY ("constituencyId") REFERENCES "constituencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_jurisdictions" ADD CONSTRAINT "user_jurisdictions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_jurisdictions" ADD CONSTRAINT "user_jurisdictions_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_jurisdictions" ADD CONSTRAINT "user_jurisdictions_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_jurisdictions" ADD CONSTRAINT "user_jurisdictions_ulbId_fkey" FOREIGN KEY ("ulbId") REFERENCES "ulbs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_jurisdictions" ADD CONSTRAINT "user_jurisdictions_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "wards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "totp_secrets" ADD CONSTRAINT "totp_secrets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_logs" ADD CONSTRAINT "otp_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voter_records" ADD CONSTRAINT "voter_records_ulbId_fkey" FOREIGN KEY ("ulbId") REFERENCES "ulbs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voter_records" ADD CONSTRAINT "voter_records_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "wards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voter_records" ADD CONSTRAINT "voter_records_dbVersionId_fkey" FOREIGN KEY ("dbVersionId") REFERENCES "voter_db_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_profiles" ADD CONSTRAINT "applicant_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_profiles" ADD CONSTRAINT "applicant_profiles_voterRecordId_fkey" FOREIGN KEY ("voterRecordId") REFERENCES "voter_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomination_applications" ADD CONSTRAINT "nomination_applications_applicantProfileId_fkey" FOREIGN KEY ("applicantProfileId") REFERENCES "applicant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomination_applications" ADD CONSTRAINT "nomination_applications_ulbId_fkey" FOREIGN KEY ("ulbId") REFERENCES "ulbs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomination_applications" ADD CONSTRAINT "nomination_applications_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "wards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomination_applications" ADD CONSTRAINT "nomination_applications_politicalPartyId_fkey" FOREIGN KEY ("politicalPartyId") REFERENCES "political_parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomination_applications" ADD CONSTRAINT "nomination_applications_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomination_applications" ADD CONSTRAINT "nomination_applications_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomination_applications" ADD CONSTRAINT "nomination_applications_scrutinizedBy_fkey" FOREIGN KEY ("scrutinizedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomination_applications" ADD CONSTRAINT "nomination_applications_withdrawalApprovedBy_fkey" FOREIGN KEY ("withdrawalApprovedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomination_applications" ADD CONSTRAINT "nomination_applications_allocatedSymbolId_fkey" FOREIGN KEY ("allocatedSymbolId") REFERENCES "election_symbols"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomination_status_history" ADD CONSTRAINT "nomination_status_history_nominationId_fkey" FOREIGN KEY ("nominationId") REFERENCES "nomination_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposers" ADD CONSTRAINT "proposers_nominationId_fkey" FOREIGN KEY ("nominationId") REFERENCES "nomination_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "political_parties" ADD CONSTRAINT "political_parties_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "election_symbols"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symbol_preferences" ADD CONSTRAINT "symbol_preferences_nominationId_fkey" FOREIGN KEY ("nominationId") REFERENCES "nomination_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symbol_preferences" ADD CONSTRAINT "symbol_preferences_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "election_symbols"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symbol_allocations" ADD CONSTRAINT "symbol_allocations_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "wards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symbol_allocations" ADD CONSTRAINT "symbol_allocations_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "election_symbols"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symbol_allocations" ADD CONSTRAINT "symbol_allocations_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "election_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_nominationId_fkey" FOREIGN KEY ("nominationId") REFERENCES "nomination_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "br_payments" ADD CONSTRAINT "br_payments_nominationId_fkey" FOREIGN KEY ("nominationId") REFERENCES "nomination_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

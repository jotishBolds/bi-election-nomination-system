/*
  Warnings:

  - The `type` column on the `ulbs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_nominationId_fkey";

-- AlterTable
ALTER TABLE "nomination_applications" ALTER COLUMN "dateOfBirth" DROP NOT NULL,
ALTER COLUMN "age" DROP NOT NULL,
ALTER COLUMN "gender" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ulbs" DROP COLUMN "type",
ADD COLUMN     "type" "ULBType";

-- DropTable
DROP TABLE "payments";

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
ALTER TABLE "br_payments" ADD CONSTRAINT "br_payments_nominationId_fkey" FOREIGN KEY ("nominationId") REFERENCES "nomination_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

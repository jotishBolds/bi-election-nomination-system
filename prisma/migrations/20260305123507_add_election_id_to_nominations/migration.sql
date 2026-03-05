-- AlterTable
ALTER TABLE "nomination_applications" ADD COLUMN     "electionId" UUID;

-- CreateIndex
CREATE INDEX "nomination_applications_electionId_idx" ON "nomination_applications"("electionId");

-- AddForeignKey
ALTER TABLE "nomination_applications" ADD CONSTRAINT "nomination_applications_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "election_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

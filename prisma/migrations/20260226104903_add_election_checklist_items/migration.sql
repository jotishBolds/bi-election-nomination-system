-- CreateTable
CREATE TABLE "election_checklist_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "electionId" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "election_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_responses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nominationId" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "isFulfilled" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "fulfilledAt" TIMESTAMP(3),
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_view_tracking" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nominationId" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" VARCHAR(45) NOT NULL,
    "viewedBy" UUID NOT NULL,

    CONSTRAINT "document_view_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "election_checklist_items_electionId_title_key" ON "election_checklist_items"("electionId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_responses_nominationId_itemId_key" ON "checklist_responses"("nominationId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "document_view_tracking_nominationId_documentId_viewedBy_key" ON "document_view_tracking"("nominationId", "documentId", "viewedBy");

-- AddForeignKey
ALTER TABLE "election_checklist_items" ADD CONSTRAINT "election_checklist_items_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "election_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "election_checklist_items" ADD CONSTRAINT "election_checklist_items_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_responses" ADD CONSTRAINT "checklist_responses_nominationId_fkey" FOREIGN KEY ("nominationId") REFERENCES "nomination_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_responses" ADD CONSTRAINT "checklist_responses_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "election_checklist_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_responses" ADD CONSTRAINT "checklist_responses_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_view_tracking" ADD CONSTRAINT "document_view_tracking_nominationId_fkey" FOREIGN KEY ("nominationId") REFERENCES "nomination_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_view_tracking" ADD CONSTRAINT "document_view_tracking_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_view_tracking" ADD CONSTRAINT "document_view_tracking_viewedBy_fkey" FOREIGN KEY ("viewedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

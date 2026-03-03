/*
  Warnings:

  - You are about to drop the `checklist_responses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `document_view_tracking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `election_checklist_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "checklist_responses" DROP CONSTRAINT "checklist_responses_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "checklist_responses" DROP CONSTRAINT "checklist_responses_itemId_fkey";

-- DropForeignKey
ALTER TABLE "checklist_responses" DROP CONSTRAINT "checklist_responses_nominationId_fkey";

-- DropForeignKey
ALTER TABLE "document_view_tracking" DROP CONSTRAINT "document_view_tracking_documentId_fkey";

-- DropForeignKey
ALTER TABLE "document_view_tracking" DROP CONSTRAINT "document_view_tracking_nominationId_fkey";

-- DropForeignKey
ALTER TABLE "document_view_tracking" DROP CONSTRAINT "document_view_tracking_viewedBy_fkey";

-- DropForeignKey
ALTER TABLE "election_checklist_items" DROP CONSTRAINT "election_checklist_items_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "election_checklist_items" DROP CONSTRAINT "election_checklist_items_electionId_fkey";

-- DropTable
DROP TABLE "checklist_responses";

-- DropTable
DROP TABLE "document_view_tracking";

-- DropTable
DROP TABLE "election_checklist_items";

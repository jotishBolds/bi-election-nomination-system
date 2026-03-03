/*
  Warnings:

  - You are about to drop the column `rejectionReasons` on the `nomination_applications` table. All the data in the column will be lost.
  - You are about to drop the column `scrutinyRemarks` on the `nomination_applications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "nomination_applications" DROP COLUMN "rejectionReasons",
DROP COLUMN "scrutinyRemarks";

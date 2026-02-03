-- CreateEnum
CREATE TYPE "UlbType" AS ENUM ('MUNICIPAL_CORPORATION', 'MUNICIPAL_COUNCIL', 'NAGAR_PANCHAYAT');

-- CreateEnum
CREATE TYPE "ReservationCategory" AS ENUM ('UR', 'SC', 'ST', 'OBC_C', 'OBC_S', 'BL');

-- CreateTable
CREATE TABLE "District" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "districtNo" INTEGER,
    "name" TEXT NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ulb" (
    "id" SERIAL NOT NULL,
    "ulbNo" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" "UlbType" NOT NULL,
    "districtId" INTEGER NOT NULL,

    CONSTRAINT "Ulb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UlbWard" (
    "id" SERIAL NOT NULL,
    "wardNo" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "ulbId" INTEGER NOT NULL,
    "reservationCategory" "ReservationCategory" NOT NULL DEFAULT 'UR',
    "womenReserved" BOOLEAN NOT NULL DEFAULT false,
    "pwdReserved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UlbWard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Constituency" (
    "id" SERIAL NOT NULL,
    "constituencyNo" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Constituency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstituencyDistrict" (
    "constituencyId" INTEGER NOT NULL,
    "districtId" INTEGER NOT NULL,

    CONSTRAINT "ConstituencyDistrict_pkey" PRIMARY KEY ("constituencyId","districtId")
);

-- CreateIndex
CREATE UNIQUE INDEX "District_code_key" ON "District"("code");

-- CreateIndex
CREATE UNIQUE INDEX "District_districtNo_key" ON "District"("districtNo");

-- CreateIndex
CREATE UNIQUE INDEX "Ulb_ulbNo_key" ON "Ulb"("ulbNo");

-- CreateIndex
CREATE UNIQUE INDEX "UlbWard_ulbId_wardNo_key" ON "UlbWard"("ulbId", "wardNo");

-- CreateIndex
CREATE UNIQUE INDEX "Constituency_constituencyNo_key" ON "Constituency"("constituencyNo");

-- AddForeignKey
ALTER TABLE "Ulb" ADD CONSTRAINT "Ulb_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UlbWard" ADD CONSTRAINT "UlbWard_ulbId_fkey" FOREIGN KEY ("ulbId") REFERENCES "Ulb"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstituencyDistrict" ADD CONSTRAINT "ConstituencyDistrict_constituencyId_fkey" FOREIGN KEY ("constituencyId") REFERENCES "Constituency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstituencyDistrict" ADD CONSTRAINT "ConstituencyDistrict_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

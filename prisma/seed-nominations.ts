import "dotenv/config";

import {
  PrismaClient,
  Role,
  Gender,
  Category,
  NominationStatus,
  PaymentMode,
  PaymentStatus,
  DocumentType,
  DocumentStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding nomination data...");

  // --------------------------------------------------
  // 0️⃣ Create / Get Active Voter DB Version
  // --------------------------------------------------

  let dbVersion = await prisma.voterDBVersion.findFirst({
    where: { isActive: true },
  });

  if (!dbVersion) {
    dbVersion = await prisma.voterDBVersion.create({
      data: {
        version: "V1-2026",
        uploadedBy: crypto.randomUUID(), // dummy admin id (or replace with real admin)
        recordCount: 0,
        fileHash: "dummyhash1234567890abcdef",
        isActive: true,
        activatedAt: new Date(),
      },
    });

    console.log("✅ Created Voter DB Version:", dbVersion.version);
  }

  // --------------------------------------------------
  // 1️⃣ Get existing ward + ulb + party
  // --------------------------------------------------

  const ward = await prisma.ward.findFirst({
    include: { ulb: true },
  });

  if (!ward) throw new Error("No ward found. Run base seed first.");

  const party = await prisma.politicalParty.findFirst();

  const ro = await prisma.user.findFirst({
    where: {
      roles: {
        some: { role: Role.RO },
      },
    },
  });

  // --------------------------------------------------
  // 2️⃣ Create Candidate User
  // --------------------------------------------------

  const passwordHash = await bcrypt.hash("candidate123", 12);

  const candidate = await prisma.user.upsert({
    where: { phone: "9000000005" },
    update: {},
    create: {
      name: "Test Candidate",
      phone: "9000000005",
      passwordHash,
      isActive: true,
      isPhoneVerified: true,
      roles: {
        create: { role: Role.CANDIDATE },
      },
    },
  });

  // --------------------------------------------------
  // 3️⃣ Create Voter Record
  // --------------------------------------------------

  const voter = await prisma.voterRecord.upsert({
    where: { epicNo: "SK1234567" },
    update: {},
    create: {
      epicNo: "SK1234567",
      name: "Test Candidate",
      fatherHusbandName: "Father Name",
      gender: Gender.MALE,
      dateOfBirth: new Date("1990-01-01"),
      age: 35,
      address: "Gangtok",
      partNo: "10",
      serialNo: "25",
      ulb: {
        connect: { id: ward.ulbId },
      },
      ward: {
        connect: { id: ward.id },
      },
      dbVersion: {
        connect: { id: dbVersion.id },
      },
    },
  });

  // --------------------------------------------------
  // 4️⃣ Update recordCount in DB Version
  // --------------------------------------------------

  await prisma.voterDBVersion.update({
    where: { id: dbVersion.id },
    data: {
      recordCount: {
        increment: 1,
      },
    },
  });

  // --------------------------------------------------
  // 5️⃣ Applicant Profile
  // --------------------------------------------------

  const profile = await prisma.applicantProfile.upsert({
    where: { userId: candidate.id },
    update: {},
    create: {
      userId: candidate.id,
      voterRecordId: voter.id,
      epicNo: voter.epicNo,
      category: Category.GENERAL,
      consentAccepted: true,
      consentAcceptedAt: new Date(),
      videoWatched: true,
      videoWatchedAt: new Date(),
    },
  });

  // --------------------------------------------------
  // 6️⃣ Nomination
  // --------------------------------------------------

  const nomination = await prisma.nominationApplication.upsert({
    where: { applicationNo: "SK-NOM-0001" },
    update: {},
    create: {
      applicationNo: "SK-NOM-0001",
      applicantProfileId: profile.id,
      ulbId: ward.ulbId,
      wardId: ward.id,
      status: NominationStatus.SUBMITTED,
      candidateName: "Test Candidate",
      fatherHusbandName: "Father Name",
      dateOfBirth: new Date("1990-01-01"),
      age: 35,
      gender: Gender.MALE,
      category: Category.GENERAL,
      address: "Gangtok",
      voterSerialNo: "25",
      voterPartNo: "10",
      politicalPartyId: party?.id || null,
      isIndependent: false,
      submittedAt: new Date(),
      receivedAt: new Date(),
      receivedBy: ro?.id || null,
      createdBy: candidate.id,
    },
  });

  // --------------------------------------------------
  // 7️⃣ Proposer
  // --------------------------------------------------

  await prisma.proposer.create({
    data: {
      nominationId: nomination.id,
      name: "Proposer One",
      voterSerialNo: "30",
      voterPartNo: "10",
      epicNo: "SK7654321",
      isVerified: true,
      verifiedAt: new Date(),
    },
  });

  // --------------------------------------------------
  // 8️⃣ Document
  // --------------------------------------------------

  await prisma.document.create({
    data: {
      nominationId: nomination.id,
      type: DocumentType.AFFIDAVIT,
      fileName: "affidavit.pdf",
      originalName: "affidavit.pdf",
      mimeType: "application/pdf",
      fileSize: 1024,
      storagePath: "/uploads/affidavit.pdf",
      checksum: "dummychecksum",
      status: DocumentStatus.VERIFIED,
    },
  });

  // --------------------------------------------------
  // 9️⃣ Payment
  // --------------------------------------------------

  await prisma.bRPayment.create({
    data: {
      nominationId: nomination.id,
      brNumber: "BR-TEST-123",
      proofImageUrl: "https://res.cloudinary.com/dummy/image/upload/sample.jpg",
      status: PaymentStatus.PAID,
      submittedAt: new Date(),
    },
  });

  // --------------------------------------------------
  // 🔟 Status History
  // --------------------------------------------------

  await prisma.nominationStatusHistory.create({
    data: {
      nominationId: nomination.id,
      fromStatus: NominationStatus.DRAFT,
      toStatus: NominationStatus.SUBMITTED,
      changedBy: candidate.id,
      ipAddress: "127.0.0.1",
    },
  });

  console.log("✅ Nomination seed completed!");
  console.log("👤 Candidate Login: 9999999999 / candidate123");
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

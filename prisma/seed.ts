// Database Seed Script for Sikkim Municipality Election 2026
import { PrismaClient, Role, ReservationType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function mapReservation(res: string | null): ReservationType | null {
  if (!res) return null;
  const mapping: Record<string, ReservationType> = {
    UR: ReservationType.UR,
    UR_W: ReservationType.UR_W,
    SC: ReservationType.SC,
    SC_W: ReservationType.SC_W,
    ST: ReservationType.ST,
    ST_W: ReservationType.ST_W,
    ST_BL: ReservationType.ST_BL,
    ST_BL_W: ReservationType.ST_BL_W,
    ST_LT: ReservationType.ST_LT,
    ST_LT_W: ReservationType.ST_LT_W,
    OBC_CENTRAL: ReservationType.OBC_C,
    OBC_CENTRAL_W: ReservationType.OBC_C_W,
    OBC_STATE: ReservationType.OBC_S,
    OBC_STATE_W: ReservationType.OBC_S_W,
    OBC_C: ReservationType.OBC_C,
    OBC_C_W: ReservationType.OBC_C_W,
    OBC_S: ReservationType.OBC_S,
    OBC_S_W: ReservationType.OBC_S_W,
  };
  return mapping[res] || null;
}

const sikkimData = {
  state: { name: "Sikkim", code: "SK" },
  districts: [
    {
      name: "Gyalshing",
      code: "GYL",
      ulbs: [
        {
          name: "Gyalshing Nagar Panchayat",
          code: "GNP",
          type: "NAGAR_PANCHAYAT",
          wards: [
            {
              wardNo: 1,
              wardName: "Kyangsa",
              constituency: "02-Yanthang",
              reservation: null,
            },
            {
              wardNo: 2,
              wardName: "Byadong",
              constituency: "04-Gyalshing Bermiok",
              reservation: null,
            },
            {
              wardNo: 3,
              wardName: "Nayabazar",
              constituency: "04-Gyalshing Bermiok",
              reservation: null,
            },
            {
              wardNo: 4,
              wardName: "Central Gyalshing",
              constituency: "04-Gyalshing Bermiok",
              reservation: null,
            },
            {
              wardNo: 5,
              wardName: "Upper Gyalshing",
              constituency: "04-Gyalshing Bermiok",
              reservation: "ST_W",
            },
          ],
        },
      ],
    },
    {
      name: "Soreng",
      code: "SRG",
      ulbs: [
        {
          name: "Soreng Nagar Panchayat",
          code: "SNP",
          type: "NAGAR_PANCHAYAT",
          wards: [
            {
              wardNo: 1,
              wardName: "Soreng Bazar",
              constituency: "06-Soreng Chakung",
              reservation: "ST",
            },
            {
              wardNo: 2,
              wardName: "Upper Soreng",
              constituency: "06-Soreng Chakung",
              reservation: null,
            },
            {
              wardNo: 3,
              wardName: "Lower Soreng",
              constituency: "06-Soreng Chakung",
              reservation: "UR_W",
            },
            {
              wardNo: 4,
              wardName: "Singla",
              constituency: "06-Soreng Chakung",
              reservation: "OBC_C",
            },
          ],
        },
      ],
    },
    {
      name: "Namchi",
      code: "NAM",
      ulbs: [
        {
          name: "Namchi Municipal Council",
          code: "NMC",
          type: "MUNICIPALITY",
          wards: [
            {
              wardNo: 1,
              wardName: "Lower Boomtar",
              constituency: "11-Namchi Singhithang",
              reservation: "ST",
            },
            {
              wardNo: 2,
              wardName: "Middle Boomtar",
              constituency: "11-Namchi Singhithang",
              reservation: "UR",
            },
            {
              wardNo: 3,
              wardName: "Namchi Bazar",
              constituency: "11-Namchi Singhithang",
              reservation: null,
            },
            {
              wardNo: 4,
              wardName: "Dambudara",
              constituency: "11-Namchi Singhithang",
              reservation: "SC_W",
            },
            {
              wardNo: 5,
              wardName: "Upper Boomtar",
              constituency: "11-Namchi Singhithang",
              reservation: "ST_W",
            },
            {
              wardNo: 6,
              wardName: "Upper Singithang",
              constituency: "11-Namchi Singhithang",
              reservation: "OBC_C",
            },
            {
              wardNo: 7,
              wardName: "Purano Namchi",
              constituency: "11-Namchi Singhithang",
              reservation: "OBC_C",
            },
          ],
        },
      ],
    },
    {
      name: "Gangtok",
      code: "GTK",
      ulbs: [
        {
          name: "Gangtok Municipal Corporation",
          code: "GMC",
          type: "MUNICIPAL_CORPORATION",
          wards: [
            {
              wardNo: 1,
              wardName: "Bojoghari 2nd Mile",
              constituency: "29-Kabi Lungchuk",
              reservation: "ST",
            },
            {
              wardNo: 2,
              wardName: "Upper Burtuk",
              constituency: "28-Upper Burtuk",
              reservation: "UR",
            },
            {
              wardNo: 3,
              wardName: "Lower Burtuk",
              constituency: "28-Upper Burtuk",
              reservation: "OBC_C_W",
            },
            {
              wardNo: 4,
              wardName: "Lower Sichey-I",
              constituency: "28-Upper Burtuk",
              reservation: null,
            },
            {
              wardNo: 5,
              wardName: "Lower Sichey-II (Lingding)",
              constituency: "27-Gangtok",
              reservation: null,
            },
            {
              wardNo: 6,
              wardName: "Upper Sichey",
              constituency: "27-Gangtok",
              reservation: "ST",
            },
            {
              wardNo: 7,
              wardName: "Tibet Road",
              constituency: "27-Gangtok",
              reservation: "OBC_S",
            },
            {
              wardNo: 8,
              wardName: "Development Area",
              constituency: "27-Gangtok",
              reservation: "UR_W",
            },
            {
              wardNo: 9,
              wardName: "Amdo Golai",
              constituency: "27-Gangtok",
              reservation: "ST_W",
            },
            {
              wardNo: 10,
              wardName: "Metro Point",
              constituency: "27-Gangtok",
              reservation: "SC",
            },
            {
              wardNo: 11,
              wardName: "Lal Bazar",
              constituency: "27-Gangtok",
              reservation: null,
            },
            {
              wardNo: 12,
              wardName: "MG Marg",
              constituency: "27-Gangtok",
              reservation: "ST",
            },
            {
              wardNo: 13,
              wardName: "Deorali",
              constituency: "26-Upper Tadong",
              reservation: "UR",
            },
            {
              wardNo: 14,
              wardName: "Zero Point",
              constituency: "26-Upper Tadong",
              reservation: "ST",
            },
            {
              wardNo: 15,
              wardName: "Convoy Ground",
              constituency: "26-Upper Tadong",
              reservation: "OBC_S_W",
            },
            {
              wardNo: 16,
              wardName: "Upper Tadong",
              constituency: "26-Upper Tadong",
              reservation: "ST_W",
            },
            {
              wardNo: 17,
              wardName: "Lower Tadong",
              constituency: "26-Upper Tadong",
              reservation: "UR",
            },
            {
              wardNo: 18,
              wardName: "Ranka Road",
              constituency: "26-Upper Tadong",
              reservation: null,
            },
            {
              wardNo: 19,
              wardName: "Shyari",
              constituency: "26-Upper Tadong",
              reservation: "ST",
            },
          ],
        },
        {
          name: "Singtam Nagar Panchayat",
          code: "STNP",
          type: "NAGAR_PANCHAYAT",
          wards: [
            {
              wardNo: 1,
              wardName: "Upper Singtam",
              constituency: "24-Singtam Khamdong",
              reservation: "ST",
            },
            {
              wardNo: 2,
              wardName: "Middle Singtam",
              constituency: "24-Singtam Khamdong",
              reservation: "UR",
            },
            {
              wardNo: 3,
              wardName: "Lower Singtam",
              constituency: "24-Singtam Khamdong",
              reservation: "OBC_C",
            },
            {
              wardNo: 4,
              wardName: "Golitar",
              constituency: "24-Singtam Khamdong",
              reservation: "ST_W",
            },
            {
              wardNo: 5,
              wardName: "Singtam Bazar",
              constituency: "24-Singtam Khamdong",
              reservation: null,
            },
          ],
        },
        {
          name: "Rangpo Nagar Panchayat",
          code: "RNP",
          type: "NAGAR_PANCHAYAT",
          wards: [
            {
              wardNo: 1,
              wardName: "Upper Rangpo",
              constituency: "23-West Pendam",
              reservation: "ST",
            },
            {
              wardNo: 2,
              wardName: "Middle Rangpo",
              constituency: "23-West Pendam",
              reservation: "UR",
            },
            {
              wardNo: 3,
              wardName: "Lower Rangpo",
              constituency: "23-West Pendam",
              reservation: "OBC_C_W",
            },
            {
              wardNo: 4,
              wardName: "Rangpo Bazar",
              constituency: "23-West Pendam",
              reservation: null,
            },
            {
              wardNo: 5,
              wardName: "Majhitar",
              constituency: "23-West Pendam",
              reservation: "SC",
            },
          ],
        },
        {
          name: "Jorethang Nagar Panchayat",
          code: "JNP",
          type: "NAGAR_PANCHAYAT",
          wards: [
            {
              wardNo: 1,
              wardName: "Upper Jorethang",
              constituency: "08-Jorethang Nayabazar",
              reservation: "ST",
            },
            {
              wardNo: 2,
              wardName: "Middle Jorethang",
              constituency: "08-Jorethang Nayabazar",
              reservation: "UR",
            },
            {
              wardNo: 3,
              wardName: "Lower Jorethang",
              constituency: "08-Jorethang Nayabazar",
              reservation: "UR_W",
            },
            {
              wardNo: 4,
              wardName: "Jorethang Bazar",
              constituency: "08-Jorethang Nayabazar",
              reservation: null,
            },
            {
              wardNo: 5,
              wardName: "Nayabazar",
              constituency: "08-Jorethang Nayabazar",
              reservation: "ST_W",
            },
          ],
        },
      ],
    },
    {
      name: "Mangan",
      code: "MNG",
      ulbs: [
        {
          name: "Mangan Nagar Panchayat",
          code: "MNP",
          type: "NAGAR_PANCHAYAT",
          wards: [
            {
              wardNo: 1,
              wardName: "Upper Mangan",
              constituency: "31-Lachen Mangan",
              reservation: "ST",
            },
            {
              wardNo: 2,
              wardName: "Mangan Bazar",
              constituency: "31-Lachen Mangan",
              reservation: null,
            },
            {
              wardNo: 3,
              wardName: "Sentam",
              constituency: "31-Lachen Mangan",
              reservation: "ST_W",
            },
            {
              wardNo: 4,
              wardName: "Lower Mangan Bazar",
              constituency: "31-Lachen Mangan",
              reservation: "UR_W",
            },
          ],
        },
      ],
    },
    {
      name: "Pakyong",
      code: "PKY",
      ulbs: [
        {
          name: "Pakyong Nagar Panchayat",
          code: "PNP",
          type: "NAGAR_PANCHAYAT",
          wards: [
            {
              wardNo: 1,
              wardName: "Upper Pakyong",
              constituency: "22-Rhenock",
              reservation: "ST",
            },
            {
              wardNo: 2,
              wardName: "Lower Pakyong",
              constituency: "22-Rhenock",
              reservation: "UR",
            },
            {
              wardNo: 3,
              wardName: "Pakyong Bazar",
              constituency: "22-Rhenock",
              reservation: "OBC_C",
            },
            {
              wardNo: 4,
              wardName: "Airport Road",
              constituency: "22-Rhenock",
              reservation: null,
            },
            {
              wardNo: 5,
              wardName: "New Pakyong",
              constituency: "22-Rhenock",
              reservation: "ST_W",
            },
          ],
        },
      ],
    },
  ],
};

// Political Parties
const politicalParties = [
  {
    name: "Sikkim Krantikari Morcha",
    abbreviation: "SKM",
    symbol: "Lamp",
    symbolImage: "/election-symbols/skm.png",
  },
  {
    name: "Sikkim Democratic Front",
    abbreviation: "SDF",
    symbol: "Umbrella",
    symbolImage: "/election-symbols/sdf.png",
  },
  {
    name: "Bharatiya Janata Party",
    abbreviation: "BJP",
    symbol: "Lotus",
    symbolImage: "/election-symbols/bjp.png",
  },
  {
    name: "Indian National Congress",
    abbreviation: "INC",
    symbol: "Hand",
    symbolImage: "/election-symbols/inc.png",
  },
];

// Independent Symbols
const independentSymbols = [
  { name: "Almirah", imagePath: "/election-symbols/almirah.png" },
  { name: "Auto Rickshaw", imagePath: "/election-symbols/autorickshaw.png" },
  { name: "Balloon", imagePath: "/election-symbols/balloon.png" },
  { name: "Bangles", imagePath: "/election-symbols/bangles.png" },
  { name: "Battery Torch", imagePath: "/election-symbols/batterytorch.png" },
  { name: "Blackboard", imagePath: "/election-symbols/blackboard.png" },
  { name: "Bucket", imagePath: "/election-symbols/bucket.png" },
  { name: "Camera", imagePath: "/election-symbols/camera.png" },
  { name: "Candles", imagePath: "/election-symbols/candles.png" },
  { name: "Chair", imagePath: "/election-symbols/chair.png" },
  { name: "Cup and Saucer", imagePath: "/election-symbols/cupsaucer.png" },
  { name: "Diesel Pump", imagePath: "/election-symbols/dieselpump.png" },
  { name: "Drum", imagePath: "/election-symbols/drum.png" },
  { name: "Electric Pole", imagePath: "/election-symbols/electricpole.png" },
  { name: "Envelope", imagePath: "/election-symbols/envelope.png" },
];

async function main() {
  console.log("🌱 Starting Sikkim Municipality Election 2026 database seed...");

  // =====================
  // 1. CREATE STATE
  // =====================
  console.log("Creating Sikkim state...");
  const sikkim = await prisma.state.upsert({
    where: { code: sikkimData.state.code },
    update: { name: sikkimData.state.name },
    create: sikkimData.state,
  });
  console.log(`✅ Created state: ${sikkim.name}`);

  // =====================
  // 2. CREATE CONSTITUENCIES (first, so we can reference them from wards)
  // =====================
  console.log("Creating constituencies...");
  const constituencyMap = new Map<string, string>(); // name -> id
  const uniqueConstituencies = new Set<string>();

  // Collect all unique constituency names
  for (const district of sikkimData.districts) {
    for (const ulb of district.ulbs) {
      for (const ward of ulb.wards) {
        if (ward.constituency) {
          uniqueConstituencies.add(ward.constituency);
        }
      }
    }
  }

  // Create constituencies
  for (const constName of uniqueConstituencies) {
    const code = constName.split("-")[0]; // Extract code like "02" from "02-Yanthang"
    const constituency = await prisma.constituency.upsert({
      where: { code },
      update: { name: constName },
      create: { code, name: constName },
    });
    constituencyMap.set(constName, constituency.id);
  }
  console.log(`✅ Created ${uniqueConstituencies.size} constituencies`);

  // =====================
  // 3. CREATE DISTRICTS, ULBs & WARDS
  // =====================
  console.log("Creating districts, ULBs and wards...");
  let totalWards = 0;

  for (const districtData of sikkimData.districts) {
    const district = await prisma.district.upsert({
      where: { code: districtData.code },
      update: { name: districtData.name },
      create: {
        stateId: sikkim.id,
        name: districtData.name,
        code: districtData.code,
      },
    });

    for (const ulbData of districtData.ulbs) {
      const ulb = await prisma.uLB.upsert({
        where: { code: ulbData.code },
        update: { name: ulbData.name, type: ulbData.type },
        create: {
          districtId: district.id,
          name: ulbData.name,
          code: ulbData.code,
          type: ulbData.type,
        },
      });

      for (const wardData of ulbData.wards) {
        const constituencyId = wardData.constituency
          ? constituencyMap.get(wardData.constituency)
          : null;

        await prisma.ward.upsert({
          where: {
            ulbId_wardNo: { ulbId: ulb.id, wardNo: wardData.wardNo },
          },
          update: {
            wardName: wardData.wardName,
            constituencyId: constituencyId || null,
            reservationType: mapReservation(wardData.reservation),
          },
          create: {
            ulbId: ulb.id,
            wardNo: wardData.wardNo,
            wardName: wardData.wardName,
            constituencyId: constituencyId || null,
            reservationType: mapReservation(wardData.reservation),
          },
        });
        totalWards++;
      }
    }
    console.log(`   ✅ Created district: ${district.name}`);
  }
  console.log(`✅ Created ${totalWards} total wards`);

  // =====================
  // 4. CREATE ELECTION SYMBOLS (for parties and independents)
  // =====================
  console.log("Creating election symbols...");
  const symbolMap = new Map<string, string>(); // name -> id

  // Create party symbols first (reserved)
  for (const party of politicalParties) {
    const symbol = await prisma.electionSymbol.upsert({
      where: { name: party.symbol },
      update: { imagePath: party.symbolImage, isReserved: true },
      create: {
        name: party.symbol,
        imagePath: party.symbolImage,
        isReserved: true,
        displayOrder: 0,
      },
    });
    symbolMap.set(party.symbol, symbol.id);
  }

  // Create independent symbols (not reserved)
  let displayOrder = 1;
  for (const symbol of independentSymbols) {
    const created = await prisma.electionSymbol.upsert({
      where: { name: symbol.name },
      update: { imagePath: symbol.imagePath, displayOrder },
      create: {
        name: symbol.name,
        imagePath: symbol.imagePath,
        isReserved: false,
        displayOrder,
      },
    });
    symbolMap.set(symbol.name, created.id);
    displayOrder++;
  }
  console.log(
    `✅ Created ${politicalParties.length + independentSymbols.length} election symbols`,
  );

  // =====================
  // 5. CREATE POLITICAL PARTIES
  // =====================
  console.log("Creating political parties...");
  for (const party of politicalParties) {
    const symbolId = symbolMap.get(party.symbol);
    await prisma.politicalParty.upsert({
      where: { name: party.name },
      update: { abbreviation: party.abbreviation, symbolId },
      create: {
        name: party.name,
        abbreviation: party.abbreviation,
        symbolId,
        isRecognized: true,
        isState: true,
      },
    });
  }
  console.log(`✅ Created ${politicalParties.length} political parties`);

  // =====================
  // 6. CREATE ELECTION CONFIG
  // =====================
  console.log("Creating election configuration...");

  // First check if an active election config already exists
  const existingConfig = await prisma.electionConfig.findFirst({
    where: { isActive: true },
  });

  if (!existingConfig) {
    await prisma.electionConfig.create({
      data: {
        name: "Sikkim Municipality Election 2026",
        type: "MUNICIPAL",
        year: 2026,
        notificationDate: new Date("2026-03-01"),
        nominationStartDate: new Date("2026-03-02"),
        nominationEndDate: new Date("2026-03-08"),
        scrutinyDate: new Date("2026-03-09"),
        withdrawalStartDate: new Date("2026-03-10"),
        withdrawalEndDate: new Date("2026-03-11"),
        pollDate: new Date("2026-03-31"),
        countingDate: new Date("2026-04-03"),
        resultDate: new Date("2026-04-06"),
        nominationFee: 1000,
        maxNominationsPerCandidate: 3,
        currentPhase: "NOMINATION",
        isActive: true,
        isLocked: false,
        createdBy: "00000000-0000-0000-0000-000000000000", // System UUID
      },
    });
    console.log("✅ Created election configuration");
  } else {
    console.log("✅ Election configuration already exists, skipping...");
  }

  // =====================
  // 7. CREATE ADMIN USERS
  // =====================
  console.log("Creating admin users...");
  const adminPassword = await hashPassword("admin123");
  const secPassword = await hashPassword("sec123");
  const roPassword = await hashPassword("ro123");

  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { phone: "9000000001" },
    update: {},
    create: {
      name: "Super Admin",
      phone: "9000000001",
      passwordHash: adminPassword,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_role: { userId: superAdmin.id, role: Role.SUPER_ADMIN } },
    update: {},
    create: { userId: superAdmin.id, role: Role.SUPER_ADMIN },
  });
  console.log(
    "   ✅ Created Super Admin (phone: 9000000001, password: admin123)",
  );

  // State Election Commission
  const sec = await prisma.user.upsert({
    where: { phone: "9000000002" },
    update: {},
    create: {
      name: "State Election Commissioner",
      phone: "9000000002",
      passwordHash: secPassword,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_role: { userId: sec.id, role: Role.SES } },
    update: {},
    create: { userId: sec.id, role: Role.SES },
  });
  console.log("   ✅ Created SEC (phone: 9000000002, password: sec123)");

  // Get Gangtok district for RO
  const gangtokDistrict = await prisma.district.findUnique({
    where: { code: "GTK" },
  });

  if (gangtokDistrict) {
    const ro = await prisma.user.upsert({
      where: { phone: "9000000003" },
      update: {},
      create: {
        name: "RO Gangtok",
        phone: "9000000003",
        passwordHash: roPassword,
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });
    await prisma.userRole.upsert({
      where: { userId_role: { userId: ro.id, role: Role.RO } },
      update: {},
      create: { userId: ro.id, role: Role.RO },
    });

    // Assign jurisdiction - first check if exists
    const existingJurisdiction = await prisma.userJurisdiction.findFirst({
      where: {
        userId: ro.id,
        type: "DISTRICT",
        districtId: gangtokDistrict.id,
      },
    });

    if (!existingJurisdiction) {
      await prisma.userJurisdiction.create({
        data: {
          userId: ro.id,
          type: "DISTRICT",
          districtId: gangtokDistrict.id,
        },
      });
    }
    console.log(
      "   ✅ Created RO Gangtok (phone: 9000000003, password: ro123)",
    );
  }

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   - State: Sikkim`);
  console.log(`   - Districts: ${sikkimData.districts.length}`);
  console.log(
    `   - ULBs: ${sikkimData.districts.reduce((sum, d) => sum + d.ulbs.length, 0)}`,
  );
  console.log(`   - Wards: ${totalWards}`);
  console.log(`   - Constituencies: ${uniqueConstituencies.size}`);
  console.log(`   - Political Parties: ${politicalParties.length}`);
  console.log(`   - Independent Symbols: ${independentSymbols.length}`);
  console.log("\n👤 Test Credentials:");
  console.log("   - Super Admin: 9000000001 / admin123");
  console.log("   - SEC: 9000000002 / sec123");
  console.log("   - RO Gangtok: 9000000003 / ro123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

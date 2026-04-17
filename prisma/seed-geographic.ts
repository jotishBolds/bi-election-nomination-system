// Comprehensive Geographic Data Seeder for Sikkim
// Run: npx tsx prisma/seed-geographic.ts

import "dotenv/config";
import { PrismaClient, ReservationType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper function to map reservation types
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

// Comprehensive Sikkim Geographic Data
const sikkimGeographicData = {
  state: { name: "Sikkim", code: "SK" },
  districts: [
    {
      name: "Gyalshing",
      code: "GYL",
      ulbs: [
        {
          name: "Gyalshing Nagar Panchayat",
          code: "GNP",
          wards: [
            { wardNo: 1, name: "Upper Bazar", reservationType: "UR" },
            { wardNo: 2, name: "Lower Bazar", reservationType: "SC" },
            { wardNo: 3, name: "Market Area", reservationType: "ST" },
            { wardNo: 4, name: "Hospital Area", reservationType: "UR_W" },
            { wardNo: 5, name: "School Area", reservationType: "SC_W" },
          ]
        },
        {
          name: "Dentam Nagar Panchayat",
          code: "DNP",
          wards: [
            { wardNo: 1, name: "Dentam Bazar", reservationType: "UR" },
            { wardNo: 2, name: "Dentam Village", reservationType: "ST" },
            { wardNo: 3, name: "Upper Dentam", reservationType: "SC" },
          ]
        }
      ],
      gpus: [
        {
          name: "Dentam GPU",
          code: "DG1",
          panchayatWards: [
            { wardNo: 1, name: "Dentam Ward 1", reservationType: "UR" },
            { wardNo: 2, name: "Dentam Ward 2", reservationType: "ST" },
            { wardNo: 3, name: "Dentam Ward 3", reservationType: "SC" },
            { wardNo: 4, name: "Dentam Ward 4", reservationType: "UR_W" },
          ]
        },
        {
          name: "Yangthang GPU",
          code: "YG1",
          panchayatWards: [
            { wardNo: 1, name: "Yangthang Ward 1", reservationType: "ST" },
            { wardNo: 2, name: "Yangthang Ward 2", reservationType: "SC_W" },
            { wardNo: 3, name: "Yangthang Ward 3", reservationType: "UR" },
          ]
        }
      ],
      zptcs: [
        { name: "Gyalshing-Zero Point", code: "GZP1", reservationType: "UR" },
        { name: "Gyalshing-Dentam", code: "GZP2", reservationType: "ST" },
        { name: "Gyalshing-Yangthang", code: "GZP3", reservationType: "SC" },
      ]
    },
    {
      name: "Gangtok",
      code: "GTK",
      ulbs: [
        {
          name: "Gangtok Municipal Corporation",
          code: "GMC",
          wards: [
            { wardNo: 1, name: "MG Marg", reservationType: "UR" },
            { wardNo: 2, name: "Paljor Stadium", reservationType: "SC" },
            { wardNo: 3, name: "Development Area", reservationType: "ST" },
            { wardNo: 4, name: "Tadong", reservationType: "UR_W" },
            { wardNo: 5, name: "Syari", reservationType: "SC_W" },
            { wardNo: 6, name: "Upper Syari", reservationType: "ST_W" },
            { wardNo: 7, name: "Ranka", reservationType: "UR" },
            { wardNo: 8, name: "Sichey", reservationType: "SC" },
          ]
        },
        {
          name: "Rangpo Nagar Panchayat",
          code: "RNP",
          wards: [
            { wardNo: 1, name: "Rangpo Bazar", reservationType: "UR" },
            { wardNo: 2, name: "Rangpo Market", reservationType: "ST" },
            { wardNo: 3, name: "Rangpo Village", reservationType: "SC" },
          ]
        }
      ],
      gpus: [
        {
          name: "Pakyong GPU",
          code: "PKG1",
          panchayatWards: [
            { wardNo: 1, name: "Pakyong Ward 1", reservationType: "UR" },
            { wardNo: 2, name: "Pakyong Ward 2", reservationType: "ST" },
            { wardNo: 3, name: "Pakyong Ward 3", reservationType: "SC_W" },
            { wardNo: 4, name: "Pakyong Ward 4", reservationType: "UR_W" },
            { wardNo: 5, name: "Pakyong Ward 5", reservationType: "ST_W" },
          ]
        },
        {
          name: "Ranipool GPU",
          code: "RNG1",
          panchayatWards: [
            { wardNo: 1, name: "Ranipool Ward 1", reservationType: "SC" },
            { wardNo: 2, name: "Ranipool Ward 2", reservationType: "UR" },
            { wardNo: 3, name: "Ranipool Ward 3", reservationType: "ST" },
          ]
        }
      ],
      zptcs: [
        { name: "Gangtok-East", code: "GEZ1", reservationType: "UR" },
        { name: "Gangtok-West", code: "GWZ1", reservationType: "SC" },
        { name: "Gangtok-North", code: "GNZ1", reservationType: "ST" },
        { name: "Pakyong", code: "PKZ1", reservationType: "UR_W" },
      ]
    },
    {
      name: "Mangan",
      code: "MNG",
      ulbs: [
        {
          name: "Mangan Nagar Panchayat",
          code: "MNP",
          wards: [
            { wardNo: 1, name: "Mangan Bazar", reservationType: "UR" },
            { wardNo: 2, name: "Mangan Market", reservationType: "SC" },
            { wardNo: 3, name: "Mangan Village", reservationType: "ST" },
            { wardNo: 4, name: "Upper Mangan", reservationType: "UR_W" },
          ]
        },
        {
          name: "Chungthang Nagar Panchayat",
          code: "CNP",
          wards: [
            { wardNo: 1, name: "Chungthang Bazar", reservationType: "ST" },
            { wardNo: 2, name: "Chungthang Village", reservationType: "SC_W" },
            { wardNo: 3, name: "Upper Chungthang", reservationType: "UR" },
          ]
        }
      ],
      gpus: [
        {
          name: "Dikchu GPU",
          code: "DKG1",
          panchayatWards: [
            { wardNo: 1, name: "Dikchu Ward 1", reservationType: "UR" },
            { wardNo: 2, name: "Dikchu Ward 2", reservationType: "ST" },
            { wardNo: 3, name: "Dikchu Ward 3", reservationType: "SC" },
            { wardNo: 4, name: "Dikchu Ward 4", reservationType: "ST_W" },
          ]
        },
        {
          name: "Sang GPU",
          code: "SGG1",
          panchayatWards: [
            { wardNo: 1, name: "Sang Ward 1", reservationType: "SC_W" },
            { wardNo: 2, name: "Sang Ward 2", reservationType: "UR_W" },
            { wardNo: 3, name: "Sang Ward 3", reservationType: "ST" },
          ]
        }
      ],
      zptcs: [
        { name: "Mangan", code: "MGZ1", reservationType: "UR" },
        { name: "Chungthang", code: "CGZ1", reservationType: "ST" },
        { name: "Dikchu", code: "DGZ1", reservationType: "SC" },
        { name: "Sang", code: "SGZ1", reservationType: "ST_W" },
      ]
    },
    {
      name: "Namchi",
      code: "NMC",
      ulbs: [
        {
          name: "Namchi Nagar Panchayat",
          code: "NNP",
          wards: [
            { wardNo: 1, name: "Namchi Bazar", reservationType: "UR" },
            { wardNo: 2, name: "Namchi Market", reservationType: "SC" },
            { wardNo: 3, name: "Namchi Village", reservationType: "ST" },
            { wardNo: 4, name: "Upper Namchi", reservationType: "UR_W" },
            { wardNo: 5, name: "Namchi College", reservationType: "SC_W" },
          ]
        },
        {
          name: "Jorethang Nagar Panchayat",
          code: "JNP",
          wards: [
            { wardNo: 1, name: "Jorethang Bazar", reservationType: "ST" },
            { wardNo: 2, name: "Jorethang Market", reservationType: "UR" },
            { wardNo: 3, name: "Jorethang Village", reservationType: "SC" },
          ]
        }
      ],
      gpus: [
        {
          name: "Ravangla GPU",
          code: "RVG1",
          panchayatWards: [
            { wardNo: 1, name: "Ravangla Ward 1", reservationType: "UR" },
            { wardNo: 2, name: "Ravangla Ward 2", reservationType: "ST_W" },
            { wardNo: 3, name: "Ravangla Ward 3", reservationType: "SC_W" },
            { wardNo: 4, name: "Ravangla Ward 4", reservationType: "ST" },
          ]
        },
        {
          name: "Temi GPU",
          code: "TMG1",
          panchayatWards: [
            { wardNo: 1, name: "Temi Ward 1", reservationType: "SC" },
            { wardNo: 2, name: "Temi Ward 2", reservationType: "UR" },
            { wardNo: 3, name: "Temi Ward 3", reservationType: "ST_W" },
          ]
        }
      ],
      zptcs: [
        { name: "Namchi", code: "NGZ1", reservationType: "UR" },
        { name: "Jorethang", code: "JGZ1", reservationType: "ST" },
        { name: "Ravangla", code: "RGZ1", reservationType: "SC_W" },
        { name: "Temi", code: "TGZ1", reservationType: "ST_W" },
      ]
    }
  ]
};

async function seedGeographicData() {
  console.log("🌍 Starting comprehensive geographic data seeding...");

  try {
    // Clear existing geographic data
    console.log("🗑️  Clearing existing geographic data...");
    await prisma.electionSeat.deleteMany();
    await prisma.ward.deleteMany();
    await prisma.panchayatWard.deleteMany();
    await prisma.uLB.deleteMany();
    await prisma.gPU.deleteMany();
    await prisma.zPTC.deleteMany();
    await prisma.district.deleteMany();
    await prisma.state.deleteMany();

    // Create state
    console.log("🏛️  Creating Sikkim state...");
    const state = await prisma.state.create({
      data: {
        name: sikkimGeographicData.state.name,
        code: sikkimGeographicData.state.code,
      },
    });

    // Create districts
    console.log("📍 Creating districts...");
    const createdDistricts = [];
    for (const districtData of sikkimGeographicData.districts) {
      const district = await prisma.district.create({
        data: {
          name: districtData.name,
          code: districtData.code,
          stateId: state.id,
        },
      });
      createdDistricts.push({ ...districtData, id: district.id });
      console.log(`  ✅ Created district: ${district.name}`);
    }

    // Process each district
    for (const district of createdDistricts) {
      console.log(`🏘️  Processing ${district.name} district...`);

      // Create ULBs
      if (district.ulbs) {
        for (const ulbData of district.ulbs) {
          const ulb = await prisma.uLB.create({
            data: {
              name: ulbData.name,
              code: ulbData.code,
              districtId: district.id,
              isActive: true,
            },
          });
          console.log(`  🏛️  Created ULB: ${ulb.name}`);

          // Create wards
          if (ulbData.wards) {
            for (const wardData of ulbData.wards) {
              const ward = await prisma.ward.create({
                data: {
                  wardNo: wardData.wardNo,
                  wardName: wardData.name,
                  ulbId: ulb.id,
                  reservationType: mapReservation(wardData.reservationType),
                  isActive: true,
                },
              });
              console.log(`    🏠 Created ward: ${ward.wardName} (${ward.wardNo})`);
            }
          }
        }
      }

      // Create GPUs
      if (district.gpus) {
        for (const gpuData of district.gpus) {
          const gpu = await prisma.gPU.create({
            data: {
              name: gpuData.name,
              code: gpuData.code,
              districtId: district.id,
              isActive: true,
            },
          });
          console.log(`  🌾 Created GPU: ${gpu.name}`);

          // Create Panchayat Wards
          if (gpuData.panchayatWards) {
            for (const wardData of gpuData.panchayatWards) {
              const panchayatWard = await prisma.panchayatWard.create({
                data: {
                  wardNo: wardData.wardNo,
                  name: wardData.name,
                  gpuId: gpu.id,
                  reservationType: mapReservation(wardData.reservationType),
                  isActive: true,
                },
              });
              console.log(`    🏡 Created panchayat ward: ${panchayatWard.name} (${panchayatWard.wardNo})`);
            }
          }
        }
      }

      // Create ZPTCs
      if (district.zptcs) {
        for (const zptcData of district.zptcs) {
          const zptc = await prisma.zPTC.create({
            data: {
              name: zptcData.name,
              code: zptcData.code,
              districtId: district.id,
              reservationType: mapReservation(zptcData.reservationType),
              isActive: true,
            },
          });
          console.log(`  🏛️  Created ZPTC: ${zptc.name}`);
        }
      }
    }

    console.log("✅ Geographic data seeding completed successfully!");
    
    // Print summary
    const summary = await prisma.$transaction([
      prisma.state.count(),
      prisma.district.count(),
      prisma.uLB.count(),
      prisma.ward.count(),
      prisma.gPU.count(),
      prisma.panchayatWard.count(),
      prisma.zPTC.count(),
    ]);

    console.log("\n📊 Seeding Summary:");
    console.log(`  States: ${summary[0]}`);
    console.log(`  Districts: ${summary[1]}`);
    console.log(`  ULBs: ${summary[2]}`);
    console.log(`  Wards: ${summary[3]}`);
    console.log(`  GPUs: ${summary[4]}`);
    console.log(`  Panchayat Wards: ${summary[5]}`);
    console.log(`  ZPTCs: ${summary[6]}`);

  } catch (error) {
    console.error("❌ Error seeding geographic data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
if (require.main === module) {
  seedGeographicData()
    .then(() => {
      console.log("🎉 Geographic seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Geographic seeding failed:", error);
      process.exit(1);
    });
}

export { seedGeographicData };

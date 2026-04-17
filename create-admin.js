// Simple Admin User Creation Script
// Run: node create-admin.js

require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function createAdminUsers() {
  console.log("👤 Creating admin users...");

  try {
    // Super Admin
    const superAdminPassword = await hashPassword("admin123");
    const superAdmin = await prisma.user.upsert({
      where: { phone: "9000000001" },
      update: {},
      create: {
        name: "Super Admin",
        phone: "9000000001",
        passwordHash: superAdminPassword,
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    await prisma.userRole.create({
      data: {
        userId: superAdmin.id,
        role: "SUPER_ADMIN",
      },
    });

    console.log("   ✅ Created Super Admin (phone: 9000000001, password: admin123)");

    // State Election Commission
    const secPassword = await hashPassword("sec123");
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

    await prisma.userRole.create({
      data: {
        userId: sec.id,
        role: "SES",
      },
    });

    console.log("   ✅ Created SEC (phone: 9000000002, password: sec123)");

    // RO Gangtok
    const roPassword = await hashPassword("ro123");
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

      await prisma.userRole.create({
        data: {
          userId: ro.id,
          role: "RO",
        },
      });

      await prisma.userJurisdiction.create({
        data: {
          userId: ro.id,
          jurisdictionType: "DISTRICT",
          jurisdictionId: gangtokDistrict.id,
        },
      });

      console.log("   ✅ Created RO Gangtok (phone: 9000000003, password: ro123)");
    }

    console.log("\n🎉 Admin users created successfully!");
    console.log("\n📋 Login Credentials:");
    console.log("   - Super Admin: 9000000001 / admin123");
    console.log("   - SEC: 9000000002 / sec123");
    console.log("   - RO Gangtok: 9000000003 / ro123");

  } catch (error) {
    console.error("❌ Error creating admin users:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Run the function
createAdminUsers();

// prisma/seed-symbols-voters.ts
// Run: npx tsx prisma/seed-symbols-voters.ts

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const voterData = [
  {
    epic_number: "WIZ0063883",
    full_name: "Amit Kumar",
    relation_type: "Father",
    relation_name: "Ramesh Kumar",
    postal_address: "Village Tadong, Gangtok, East Sikkim, 737102",
  },
  {
    epic_number: "WIZ0063891",
    full_name: "Sunita Devi",
    relation_type: "Husband",
    relation_name: "Amit Kumar",
    postal_address: "Lower Syari, Gangtok, East Sikkim, 737101",
  },
  {
    epic_number: "WIZ0063909",
    full_name: "Rahul Sharma",
    relation_type: "Father",
    relation_name: "Mahesh Sharma",
    postal_address: "Singtam Bazar, East Sikkim, 737134",
  },
  {
    epic_number: "WIZ0063925",
    full_name: "Pooja Sharma",
    relation_type: "Husband",
    relation_name: "Rahul Sharma",
    postal_address: "Singtam Bazar, East Sikkim, 737134",
  },
  {
    epic_number: "GZS0060012",
    full_name: "Tenzing Bhutia",
    relation_type: "Father",
    relation_name: "Lhakpa Bhutia",
    postal_address: "Rumtek, East Sikkim, 737135",
  },
  {
    epic_number: "NMX0090746",
    full_name: "Sonam Lepcha",
    relation_type: "Father",
    relation_name: "Dawa Lepcha",
    postal_address: "Rangpo, East Sikkim, 737132",
  },
  {
    epic_number: "WIZ0038893",
    full_name: "Rakesh Verma",
    relation_type: "Father",
    relation_name: "Suresh Verma",
    postal_address: "Majitar, East Sikkim, 737136",
  },
  {
    epic_number: "WIZ0064017",
    full_name: "Anita Verma",
    relation_type: "Husband",
    relation_name: "Rakesh Verma",
    postal_address: "Majitar, East Sikkim, 737136",
  },
  {
    epic_number: "GZS0060148",
    full_name: "Karma Tshering",
    relation_type: "Father",
    relation_name: "Pema Tshering",
    postal_address: "Namchi, South Sikkim, 737126",
  },
  {
    epic_number: "NMX0090813",
    full_name: "Maya Rai",
    relation_type: "Father",
    relation_name: "Bir Bahadur Rai",
    postal_address: "Jorethang, South Sikkim, 737121",
  },
];

async function seedVoterRoll() {
  console.log("Seeding voter roll entries...");
  for (const v of voterData) {
    await prisma.voterRollEntry.upsert({
      where: { epicNumber: v.epic_number },
      update: {
        fullName: v.full_name,
        relationType: v.relation_type,
        relationName: v.relation_name,
        postalAddress: v.postal_address,
      },
      create: {
        epicNumber: v.epic_number,
        fullName: v.full_name,
        relationType: v.relation_type,
        relationName: v.relation_name,
        postalAddress: v.postal_address,
      },
    });
  }
  console.log(`Seeded ${voterData.length} voter roll entries.`);
}

async function seedElectionSymbols() {
  console.log("Seeding election symbols from public/election-symbols...");

  const symbolsDir = path.join(process.cwd(), "public", "election-symbols");

  if (!fs.existsSync(symbolsDir)) {
    console.error("Symbols directory not found:", symbolsDir);
    return;
  }

  const files = fs.readdirSync(symbolsDir).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return [".png", ".jpg", ".jpeg", ".svg", ".webp"].includes(ext);
  });

  // Skip non-symbol files
  const skipFiles = ["log.txt", "Symbol.png"];
  const symbolFiles = files.filter((f) => !skipFiles.includes(f));

  let count = 0;
  for (let i = 0; i < symbolFiles.length; i++) {
    const file = symbolFiles[i];
    const name = path
      .basename(file, path.extname(file))
      .replace(/-/g, " ")
      .replace(/_/g, " ");
    const imagePath = `/election-symbols/${file}`;

    await prisma.electionSymbol.upsert({
      where: { name },
      update: {
        imagePath,
        displayOrder: i + 1,
        isActive: true,
      },
      create: {
        name,
        imagePath,
        isReserved: false,
        isActive: true,
        displayOrder: i + 1,
      },
    });
    count++;
  }

  console.log(`Seeded ${count} election symbols.`);
}

async function main() {
  try {
    await seedVoterRoll();
    await seedElectionSymbols();
    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Seeding error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();

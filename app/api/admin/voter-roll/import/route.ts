import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth/auth-guard";
import { Gender } from "@prisma/client";

const VALID_GENDERS: Record<string, Gender> = {
  male: "MALE",
  m: "MALE",
  female: "FEMALE",
  f: "FEMALE",
  other: "OTHER",
  o: "OTHER",
};

function parseGender(value: string): Gender | null {
  const normalized = value.trim().toLowerCase();
  return VALID_GENDERS[normalized] ?? null;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      if (inQuotes) {
        if (char === '"' && trimmed[i + 1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ",") {
          fields.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
    }
    fields.push(current.trim());
    rows.push(fields);
  }

  return rows;
}

/**
 * POST - Import voter roll entries from CSV
 *
 * Expected CSV format (with header row):
 * epic_number,full_name,relation_type,relation_name,postal_address,gender
 *
 * Gender column is optional. If missing, gender will be null.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperAdmin();

    const contentType = request.headers.get("content-type") || "";

    let csvText: string;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { error: "No file uploaded" },
          { status: 400 },
        );
      }

      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith(".csv")) {
        return NextResponse.json(
          {
            error:
              "Only CSV files are supported. Please convert Excel to CSV first.",
          },
          { status: 400 },
        );
      }

      csvText = await file.text();
    } else if (
      contentType.includes("text/csv") ||
      contentType.includes("application/json")
    ) {
      // Raw CSV text or JSON with csv_data field
      if (contentType.includes("application/json")) {
        const body = await request.json();
        csvText = body.csv_data;
        if (!csvText || typeof csvText !== "string") {
          return NextResponse.json(
            { error: "Missing csv_data field" },
            { status: 400 },
          );
        }
      } else {
        csvText = await request.text();
      }
    } else {
      return NextResponse.json(
        {
          error:
            "Unsupported content type. Use multipart/form-data with a CSV file, or send CSV text.",
        },
        { status: 400 },
      );
    }

    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      return NextResponse.json(
        { error: "CSV must have a header row and at least one data row" },
        { status: 400 },
      );
    }

    // Normalize header names
    const headers = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, "_"));
    const dataRows = rows.slice(1);

    // Required column indices
    const epicIdx = headers.indexOf("epic_number");
    const nameIdx = headers.indexOf("full_name");
    const relTypeIdx = headers.indexOf("relation_type");
    const relNameIdx = headers.indexOf("relation_name");
    const addressIdx = headers.indexOf("postal_address");
    const genderIdx = headers.indexOf("gender");

    if (
      epicIdx === -1 ||
      nameIdx === -1 ||
      relTypeIdx === -1 ||
      relNameIdx === -1 ||
      addressIdx === -1
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required columns. Required: epic_number, full_name, relation_type, relation_name, postal_address. Optional: gender",
        },
        { status: 400 },
      );
    }

    const results: { created: number; updated: number; errors: string[] } = {
      created: 0,
      updated: 0,
      errors: [],
    };

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2; // 1-indexed, accounting for header

      const epicNumber = row[epicIdx]?.trim();
      const fullName = row[nameIdx]?.trim();
      const relationType = row[relTypeIdx]?.trim();
      const relationName = row[relNameIdx]?.trim();
      const postalAddress = row[addressIdx]?.trim();
      const genderRaw = genderIdx !== -1 ? row[genderIdx]?.trim() || "" : "";

      if (
        !epicNumber ||
        !fullName ||
        !relationType ||
        !relationName ||
        !postalAddress
      ) {
        results.errors.push(`Row ${rowNum}: Missing required field(s)`);
        continue;
      }

      if (epicNumber.length > 20) {
        results.errors.push(
          `Row ${rowNum}: EPIC number too long (max 20 chars)`,
        );
        continue;
      }

      const gender = genderRaw ? parseGender(genderRaw) : null;

      try {
        const existing = await db.voterRollEntry.findUnique({
          where: { epicNumber },
        });

        await db.voterRollEntry.upsert({
          where: { epicNumber },
          update: {
            fullName,
            relationType,
            relationName,
            postalAddress,
            gender,
            isActive: true,
          },
          create: {
            epicNumber,
            fullName,
            relationType,
            relationName,
            postalAddress,
            gender,
          },
        });

        if (existing) {
          results.updated++;
        } else {
          results.created++;
        }
      } catch (dbErr: any) {
        results.errors.push(`Row ${rowNum}: Database error - ${dbErr.message}`);
      }
    }

    await db.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "VoterRollEntry",
        userId: session.user.id,
        newValues: {
          source: "csv_import",
          created: results.created,
          updated: results.updated,
          errors: results.errors.length,
        },
        ipAddress: "api",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          total_rows: dataRows.length,
          created: results.created,
          updated: results.updated,
          errors: results.errors,
        },
      },
      { status: 201 },
    );
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err.message === "FORBIDDEN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Voter roll import error:", err);
    return NextResponse.json(
      { error: "Failed to import voter roll data" },
      { status: 500 },
    );
  }
}

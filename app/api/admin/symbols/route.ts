import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireRoles, requireSuperAdmin } from "@/lib/auth/auth-guard";
import {} from "@/lib/auth/auth-guard";
import { Role } from "@prisma/client";
import fs from "fs";
import path from "path";

/* =============================
   GET SYMBOLS (Query Params)
============================= */
export const getSymbolsQuerySchema = z.object({
  search: z.string().min(1).optional(),
  isActive: z.enum(["true", "false", "all"]).optional(),
  isReserved: z.enum(["true", "false", "all"]).optional(),
});

/* =============================
   CREATE SYMBOL (Body)
============================= */
export const createSymbolSchema = z.object({
  name: z.string().min(1).max(100),
  imagePath: z.string().min(1).max(500),
  isReserved: z.boolean().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

/* =============================
   SEED SYMBOLS FROM PUBLIC (Body)
============================= */
export const seedSymbolsSchema = z.object({
  seedFromPublic: z.literal(true),
});

/* ---------------- GET SYMBOLS ---------------- */
// GET /api/admin/symbols - Get all election symbols

export async function GET(request: NextRequest) {
  try {
    await requireRoles([Role.SUPER_ADMIN, Role.SES]);

    const { searchParams } = new URL(request.url);
    const parsedQuery = getSymbolsQuerySchema.parse({
      search: searchParams.get("search") ?? undefined,
      isActive: searchParams.get("isActive") ?? undefined,
      isReserved: searchParams.get("isReserved") ?? undefined,
    });

    const where: any = {};

    if (parsedQuery.search) {
      where.name = {
        contains: parsedQuery.search,
        mode: "insensitive",
      };
    }

    if (parsedQuery.isActive && parsedQuery.isActive !== "all") {
      where.isActive = parsedQuery.isActive === "true";
    }

    if (parsedQuery.isReserved && parsedQuery.isReserved !== "all") {
      where.isReserved = parsedQuery.isReserved === "true";
    }

    const symbols = await db.electionSymbol.findMany({
      where,
      include: {
        parties: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
          },
        },
        _count: {
          select: { symbolPreferences: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: symbols });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid query parameters", details: err.issues },
        { status: 400 },
      );
    }

    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("GET symbols error:", err);
    return NextResponse.json(
      { error: "Failed to fetch symbols" },
      { status: 500 },
    );
  }
}

/* ---------------- CREATE SYMBOL ---------------- */
// POST /api/admin/symbols - Create new election symbol

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperAdmin();

    const body = await request.json();

    // Check if this is a seed request
    const seedResult = seedSymbolsSchema.safeParse(body);
    if (seedResult.success) {
      try {
        // Seed symbols from public directory
        const publicSymbolsPath = path.join(
          process.cwd(),
          "public",
          "election-symbols",
        );
        const files = fs
          .readdirSync(publicSymbolsPath)
          .filter((file) => file.endsWith(".png"));

        console.log(
          `Found ${files.length} PNG files in public/election-symbols`,
        );

        const createdSymbols = [];
        let displayOrder = 1;

        for (const file of files) {
          // Convert filename to symbol name: remove .png, replace special chars with spaces, title case
          const baseName = file.replace(".png", "");
          const symbolName = baseName
            .replace(/[^a-zA-Z0-9]/g, " ") // Replace special chars with spaces
            .split(" ")
            .filter((word) => word.length > 0)
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(" ")
            .trim();
          const imagePath = `/election-symbols/${file}`;

          // Check if symbol already exists
          const existing = await db.electionSymbol.findFirst({
            where: {
              name: { equals: symbolName, mode: "insensitive" },
            },
          });

          if (!existing) {
            try {
              const symbol = await db.electionSymbol.create({
                data: {
                  name: symbolName,
                  imagePath,
                  isReserved: false,
                  isActive: true,
                  displayOrder,
                },
              });
              createdSymbols.push(symbol);
              displayOrder++;
            } catch (createError) {
              console.error(
                `Failed to create symbol "${symbolName}":`,
                createError,
              );
              // Continue with next symbol
            }
          }
        }

        console.log(`Successfully created ${createdSymbols.length} symbols`);

        await db.auditLog.create({
          data: {
            action: "CREATE",
            entityType: "ElectionSymbol",
            entityId: null,
            userId: session.user.id,
            newValues: { count: createdSymbols.length, operation: "bulk-seed" },
            ipAddress: "api",
          },
        });

        return NextResponse.json({
          success: true,
          data: createdSymbols,
          message: `Seeded ${createdSymbols.length} symbols from public directory`,
        });
      } catch (seedError) {
        console.error("Seed error:", seedError);
        return NextResponse.json(
          { error: "Failed to seed symbols from public directory" },
          { status: 500 },
        );
      }
    }

    // Regular symbol creation
    const data = createSymbolSchema.parse(body);

    const existing = await db.electionSymbol.findFirst({
      where: {
        name: { equals: data.name, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Symbol with this name already exists" },
        { status: 400 },
      );
    }

    const symbol = await db.electionSymbol.create({
      data: {
        name: data.name,
        imagePath: data.imagePath,
        isReserved: data.isReserved ?? false,
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder ?? 0,
      },
      include: {
        parties: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
          },
        },
      },
    });

    await db.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "ElectionSymbol",
        entityId: symbol.id,
        userId: session.user.id,
        newValues: data,
        ipAddress: "api",
      },
    });

    return NextResponse.json({ success: true, data: symbol });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: err.issues },
        { status: 400 },
      );
    }

    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("POST symbols error:", err);
    return NextResponse.json(
      { error: "Failed to create symbol" },
      { status: 500 },
    );
  }
}

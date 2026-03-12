import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireRoles, requireSuperAdmin } from "@/lib/auth/auth-guard";
import { Role, Gender } from "@prisma/client";

const createVoterRollSchema = z.object({
  voters: z.array(
    z.object({
      epic_number: z.string().min(1).max(20),
      full_name: z.string().min(1).max(200),
      relation_type: z.string().min(1).max(20),
      relation_name: z.string().min(1).max(200),
      postal_address: z.string().min(1),
      gender: z.nativeEnum(Gender).nullable().optional(),
    }),
  ),
});

/* GET - List voter roll entries */
export async function GET(request: NextRequest) {
  try {
    await requireRoles([Role.SUPER_ADMIN, Role.SES, Role.RO]);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { epicNumber: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [entries, total] = await Promise.all([
      db.voterRollEntry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { fullName: "asc" },
      }),
      db.voterRollEntry.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err.message === "FORBIDDEN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Voter roll GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch voter roll" },
      { status: 500 },
    );
  }
}

/* POST - Bulk upload voter roll entries */
export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperAdmin();

    const body = await request.json();
    const data = createVoterRollSchema.parse(body);

    const results = [];
    for (const voter of data.voters) {
      const entry = await db.voterRollEntry.upsert({
        where: { epicNumber: voter.epic_number },
        update: {
          fullName: voter.full_name,
          relationType: voter.relation_type,
          relationName: voter.relation_name,
          postalAddress: voter.postal_address,
          gender: voter.gender ?? undefined,
          isActive: true,
        },
        create: {
          epicNumber: voter.epic_number,
          fullName: voter.full_name,
          relationType: voter.relation_type,
          relationName: voter.relation_name,
          postalAddress: voter.postal_address,
          gender: voter.gender ?? undefined,
        },
      });
      results.push(entry);
    }

    await db.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "VoterRollEntry",
        userId: session.user.id,
        newValues: { count: results.length },
        ipAddress: "api",
      },
    });

    return NextResponse.json(
      { success: true, data: { count: results.length, entries: results } },
      { status: 201 },
    );
  } catch (err: any) {
    if (err.name === "ZodError")
      return NextResponse.json(
        { error: "Invalid data", details: err.issues },
        { status: 400 },
      );
    if (err.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err.message === "FORBIDDEN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Voter roll POST error:", err);
    return NextResponse.json(
      { error: "Failed to upload voter roll" },
      { status: 500 },
    );
  }
}

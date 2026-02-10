import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/auth/auth-guard";
import { Role } from "@prisma/client";

/* GET - List all BR payment proofs for admin */
export async function GET(request: NextRequest) {
  try {
    await requireRoles([Role.SUPER_ADMIN, Role.SES, Role.RO]);

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || "";

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { brNumber: { contains: search, mode: "insensitive" } },
        {
          nomination: {
            candidateName: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    const [payments, total] = await Promise.all([
      db.bRPayment.findMany({
        where,
        include: {
          nomination: {
            select: {
              id: true,
              applicationNo: true,
              candidateName: true,
              status: true,
              ulb: { select: { name: true } },
              ward: { select: { wardNo: true, wardName: true } },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { submittedAt: "desc" },
      }),
      db.bRPayment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err.message === "FORBIDDEN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("BR payments GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch BR payments" },
      { status: 500 },
    );
  }
}

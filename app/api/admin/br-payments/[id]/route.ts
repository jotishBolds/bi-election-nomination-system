import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/auth/auth-guard";
import { Role } from "@prisma/client";
import { z } from "zod";

const verifySchema = z.object({
  status: z.enum(["PAID", "FAILED"]),
  rejectionNote: z.string().optional(),
});

/* PATCH - Verify/reject a BR payment */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRoles([Role.SUPER_ADMIN, Role.RO]);
    const { id } = await params;

    const body = await request.json();
    const data = verifySchema.parse(body);

    const existing = await db.bRPayment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "BR payment not found" },
        { status: 404 },
      );
    }

    const updated = await db.bRPayment.update({
      where: { id },
      data: {
        status: data.status,
        verifiedBy: session.user.id,
        verifiedAt: new Date(),
        rejectionNote: data.rejectionNote || null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
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
    console.error("BR payment verify error:", err);
    return NextResponse.json(
      { error: "Failed to verify BR payment" },
      { status: 500 },
    );
  }
}

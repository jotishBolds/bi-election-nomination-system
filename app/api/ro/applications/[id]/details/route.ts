import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { updateNominationDraft } from "@/lib/services/nomination";
import { getClientIP } from "@/lib/auth/server-utils";
import { hasAccessToWard } from "@/lib/services/ro-jurisdiction";
import { z } from "zod";
import { Category } from "@prisma/client";

const updateDetailsSchema = z.object({
  candidateName: z.string().min(2).optional(),
  fatherHusbandName: z.string().min(2).optional(),
  address: z.string().min(5).optional(),
  voterSerialNo: z.string().max(10).optional(),
  voterPartNo: z.string().max(10).optional(),
  category: z.nativeEnum(Category).optional(),
  casteTribeName: z.string().optional(),
  politicalPartyId: z.string().uuid().nullable().optional(),
  isIndependent: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user || !["RO", "SES", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const updateData = updateDetailsSchema.parse(await request.json());
    
    // Verify jurisdiction access
    const hasJurisdiction = await hasAccessToWard(session.user.id, id);
    if (!hasJurisdiction) {
      return NextResponse.json(
        { success: false, error: "Access denied - not in your jurisdiction" },
        { status: 403 }
      );
    }
    
    // Update nomination using existing service
    const result = await updateNominationDraft(
      id, 
      {
        ...updateData,
        politicalPartyId: updateData.politicalPartyId || undefined,
      }, 
      session.user.id, 
      getClientIP(request)
    );
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      nomination: result.nomination,
      message: "Nomination details updated successfully"
    });

  } catch (error) {
    console.error("Update nomination details error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update nomination details" },
      { status: 500 }
    );
  }
}

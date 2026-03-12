import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { auth } from "@/lib/auth/next-auth";

/* POST - Upload BR payment proof */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["CANDIDATE", "RO", "SES", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const brNumber = formData.get("brNumber") as string;
    const nominationId = formData.get("nominationId") as string;
    const file = formData.get("proof") as File;

    // For RO users, nominationId can be "pending" (offline nominations)
    const isROUser = ["RO", "SES", "SUPER_ADMIN"].includes(session.user.role);
    
    if (!brNumber || !file) {
      return NextResponse.json(
        { error: "BR number and proof image are required" }, 
        { status: 400 }
      );
    }
    
    // For candidate users, nominationId is required
    if (!isROUser && !nominationId) {
      return NextResponse.json(
        { error: "Nomination ID is required" }, 
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are accepted" },
        { status: 400 },
      );
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 },
      );
    }

    // Upload to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, publicId } = await uploadToCloudinary(buffer, "br-payments");

    // Only create DB record if nominationId is a valid UUID (for candidates)
    // RO users will get the upload result and nomination will be linked later
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      nominationId || ""
    );

    let brPayment = null;
    if (isValidUUID && !isROUser) {
      brPayment = await db.bRPayment.create({
        data: {
          nominationId,
          brNumber,
          proofImageUrl: url,
          proofPublicId: publicId,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          url,
          publicId,
          brNumber,
          brPayment,
          isROUpload: isROUser, // Flag to indicate this is an RO upload
        },
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("BR payment upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload BR payment proof" },
      { status: 500 },
    );
  }
}

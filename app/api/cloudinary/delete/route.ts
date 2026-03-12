import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { publicIds } = body;

    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Public IDs array is required" },
        { status: 400 }
      );
    }

    const results = [];
    let hasError = false;

    for (const publicId of publicIds) {
      if (!publicId || typeof publicId !== "string") {
        results.push({ publicId, success: false, error: "Invalid public ID" });
        hasError = true;
        continue;
      }

      const result = await deleteFromCloudinary(publicId);
      results.push({ publicId, ...result });
      
      if (!result.success) {
        hasError = true;
      }
    }

    return NextResponse.json({
      success: !hasError,
      message: hasError 
        ? "Some files could not be deleted" 
        : "All files deleted successfully",
      results
    });

  } catch (error) {
    console.error("Cloudinary delete API error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}

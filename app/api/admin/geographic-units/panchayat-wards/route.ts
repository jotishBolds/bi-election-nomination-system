// Panchayat Wards API - Full CRUD operations with hierarchical filtering
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { 
  getPanchayatWards, 
  createPanchayatWard,
  createPanchayatWardSchema 
} from "@/lib/services/geographic.service";

// GET - List Panchayat Wards with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['SUPER_ADMIN', 'RO', 'SES'].includes(session.user.role)) {
      return NextResponse.json(
        { 
          status: "error",
          message: "Unauthorized - Admin, RO, or SES access required",
          errorCode: "UNAUTHORIZED"
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    const search = searchParams.get("search") || undefined;
    const isActive = searchParams.get("isActive") === "true" ? true : 
                     searchParams.get("isActive") === "false" ? false : undefined;
    const sortBy = searchParams.get("sortBy") || undefined;
    const sortOrder = searchParams.get("sortOrder") as 'asc' | 'desc' || undefined;
    
    // Hierarchical filters
    const districtId = searchParams.get("districtId") || undefined;
    const districtIds = searchParams.get("districtIds")?.split(',').filter(Boolean);
    const gpuId = searchParams.get("gpuId") || undefined;
    const gpuIds = searchParams.get("gpuIds")?.split(',').filter(Boolean);
    
    const result = await getPanchayatWards({
      page,
      limit,
      search,
      isActive,
      sortBy,
      sortOrder,
      districtId,
      districtIds,
      gpuId,
      gpuIds,
      isAdmin: true, // Admin users can see all records
    });
    
    return NextResponse.json({
      status: "success",
      message: "Panchayat wards retrieved successfully",
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Panchayat Wards GET error:", error);
    return NextResponse.json(
      { 
        status: "error",
        message: "Internal server error",
        errorCode: "INTERNAL_ERROR"
      },
      { status: 500 }
    );
  }
}

// POST - Create Panchayat Ward
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { 
          status: "error",
          message: "Unauthorized - Admin access required",
          errorCode: "UNAUTHORIZED"
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = createPanchayatWardSchema.parse(body);

    try {
      const panchayatWard = await createPanchayatWard(data);
      
      return NextResponse.json({
        status: "success",
        message: "Panchayat ward created successfully",
        data: panchayatWard
      }, { status: 201 });
    } catch (validationError: any) {
      const errorCode = validationError.message;
      
      switch (errorCode) {
        case "FOREIGN_KEY_ERROR":
          return NextResponse.json(
            { 
              status: "error",
              message: "Invalid GPU ID",
              errorCode: "FOREIGN_KEY_ERROR"
            },
            { status: 400 }
          );
          
        case "DUPLICATE_WARD_NO":
          return NextResponse.json(
            { 
              status: "error",
              message: "Ward number already exists in this GPU",
              errorCode: "DUPLICATE_WARD_NO"
            },
            { status: 400 }
          );
          
        default:
          throw validationError;
      }
    }
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { 
          status: "error",
          message: "Invalid input data",
          errorCode: "VALIDATION_ERROR",
          details: error.issues
        },
        { status: 400 }
      );
    }

    console.error("Panchayat Ward POST error:", error);
    return NextResponse.json(
      { 
        status: "error",
        message: "Internal server error",
        errorCode: "INTERNAL_ERROR"
      },
      { status: 500 }
    );
  }
}

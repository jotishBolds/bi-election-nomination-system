// Wards API - Full CRUD operations with hierarchical filtering
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { 
  getWards, 
  createWard,
  createWardSchema 
} from "@/lib/services/geographic.service";

// GET - List Wards with filters
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
    const ulbId = searchParams.get("ulbId") || undefined;
    const ulbIds = searchParams.get("ulbIds")?.split(',').filter(Boolean);
    const constituencyId = searchParams.get("constituencyId") || undefined;
    
    const result = await getWards({
      page,
      limit,
      search,
      isActive,
      sortBy,
      sortOrder,
      districtId,
      districtIds,
      ulbId,
      ulbIds,
      constituencyId,
      isAdmin: true, // Admin users can see all records
    });
    
    return NextResponse.json({
      status: "success",
      message: "Wards retrieved successfully",
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Wards GET error:", error);
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

// POST - Create Ward
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
    const data = createWardSchema.parse(body);

    try {
      const ward = await createWard(data);
      
      return NextResponse.json({
        status: "success",
        message: "Ward created successfully",
        data: ward
      }, { status: 201 });
    } catch (validationError: any) {
      const errorCode = validationError.message;
      
      switch (errorCode) {
        case "FOREIGN_KEY_ERROR":
          return NextResponse.json(
            { 
              status: "error",
              message: "Invalid ULB ID or constituency ID",
              errorCode: "FOREIGN_KEY_ERROR"
            },
            { status: 400 }
          );
          
        case "DUPLICATE_WARD_NO":
          return NextResponse.json(
            { 
              status: "error",
              message: "Ward number already exists in this ULB",
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

    console.error("Ward POST error:", error);
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

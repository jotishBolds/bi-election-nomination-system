// Districts API - Full CRUD operations with filtering
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { 
  getDistricts, 
  createDistrict,
  createDistrictSchema 
} from "@/lib/services/geographic.service";

// GET - List Districts with filters
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
    const stateId = searchParams.get("stateId") || undefined;
    
    const result = await getDistricts({
      page,
      limit,
      search,
      isActive,
      sortBy,
      sortOrder,
      stateId,
      isAdmin: true, // Admin users can see all records
    });
    
    return NextResponse.json({
      status: "success",
      message: "Districts retrieved successfully",
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Districts GET error:", error);
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

// POST - Create District
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
    const data = createDistrictSchema.parse(body);

    try {
      const district = await createDistrict(data);
      
      return NextResponse.json({
        status: "success",
        message: "District created successfully",
        data: district
      }, { status: 201 });
    } catch (validationError: any) {
      const errorCode = validationError.message;
      
      switch (errorCode) {
        case "DUPLICATE_CODE":
          return NextResponse.json(
            { 
              status: "error",
              message: "District with this code already exists",
              errorCode: "DUPLICATE_CODE"
            },
            { status: 400 }
          );
          
        case "DUPLICATE_NAME":
          return NextResponse.json(
            { 
              status: "error",
              message: "District with this name already exists in this state",
              errorCode: "DUPLICATE_NAME"
            },
            { status: 400 }
          );
          
        case "FOREIGN_KEY_ERROR":
          return NextResponse.json(
            { 
              status: "error",
              message: "Invalid state ID",
              errorCode: "FOREIGN_KEY_ERROR"
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

    console.error("District POST error:", error);
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

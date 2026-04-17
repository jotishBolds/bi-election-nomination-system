// ULB API - Get by ID, Update, Delete
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { 
  getULBById, 
  updateULB, 
  deleteULB,
  updateULBSchema 
} from "@/lib/services/geographic.service";

// GET - Get ULB by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const ulb = await getULBById(id);
    
    if (!ulb) {
      return NextResponse.json(
        { 
          status: "error",
          message: "ULB not found",
          errorCode: "NOT_FOUND"
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "ULB retrieved successfully",
      data: ulb
    });
  } catch (error) {
    console.error("ULB GET by ID error:", error);
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

// PUT - Update ULB
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const data = updateULBSchema.parse(body);

    try {
      const ulb = await updateULB(id, data);
      
      return NextResponse.json({
        status: "success",
        message: "ULB updated successfully",
        data: ulb
      });
    } catch (validationError: any) {
      const errorCode = validationError.message;
      
      switch (errorCode) {
        case "NOT_FOUND":
          return NextResponse.json(
            { 
              status: "error",
              message: "ULB not found",
              errorCode: "NOT_FOUND"
            },
            { status: 404 }
          );
          
        case "DUPLICATE_CODE":
          return NextResponse.json(
            { 
              status: "error",
              message: "ULB with this code already exists",
              errorCode: "DUPLICATE_CODE"
            },
            { status: 400 }
          );
          
        case "FOREIGN_KEY_ERROR":
          return NextResponse.json(
            { 
              status: "error",
              message: "Invalid district ID",
              errorCode: "FOREIGN_KEY_ERROR"
            },
            { status: 400 }
          );
          
        case "INVALID_ULB_TYPE":
          return NextResponse.json(
            { 
              status: "error",
              message: "Invalid ULB type. Must be one of: MUNICIPAL_CORPORATION, MUNICIPALITY, NAGAR_PANCHAYAT",
              errorCode: "INVALID_ULB_TYPE"
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

    console.error("ULB PUT error:", error);
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

// DELETE - Delete ULB
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    try {
      await deleteULB(id);
      
      return NextResponse.json({
        status: "success",
        message: "ULB deleted successfully"
      });
    } catch (validationError: any) {
      const errorCode = validationError.message;
      
      switch (errorCode) {
        case "NOT_FOUND":
          return NextResponse.json(
            { 
              status: "error",
              message: "ULB not found",
              errorCode: "NOT_FOUND"
            },
            { status: 404 }
          );
          
        case "IN_USE":
          return NextResponse.json(
            { 
              status: "error",
              message: "Cannot delete ULB with associated wards",
              errorCode: "IN_USE"
            },
            { status: 400 }
          );
          
        default:
          throw validationError;
      }
    }
  } catch (error) {
    console.error("ULB DELETE error:", error);
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

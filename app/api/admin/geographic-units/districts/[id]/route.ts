// District API - Get by ID, Update, Delete
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { 
  getDistrictById, 
  updateDistrict, 
  deleteDistrict,
  updateDistrictSchema 
} from "@/lib/services/geographic.service";

// GET - Get district by ID
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

    const district = await getDistrictById(id);
    
    if (!district) {
      return NextResponse.json(
        { 
          status: "error",
          message: "District not found",
          errorCode: "NOT_FOUND"
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "District retrieved successfully",
      data: district
    });
  } catch (error) {
    console.error("District GET by ID error:", error);
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

// PUT - Update district
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
    const data = updateDistrictSchema.parse(body);

    try {
      const district = await updateDistrict(id, data);
      
      return NextResponse.json({
        status: "success",
        message: "District updated successfully",
        data: district
      });
    } catch (validationError: any) {
      const errorCode = validationError.message;
      
      switch (errorCode) {
        case "NOT_FOUND":
          return NextResponse.json(
            { 
              status: "error",
              message: "District not found",
              errorCode: "NOT_FOUND"
            },
            { status: 404 }
          );
          
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

    console.error("District PUT error:", error);
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

// DELETE - Delete district
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
      await deleteDistrict(id);
      
      return NextResponse.json({
        status: "success",
        message: "District deleted successfully"
      });
    } catch (validationError: any) {
      const errorCode = validationError.message;
      
      switch (errorCode) {
        case "NOT_FOUND":
          return NextResponse.json(
            { 
              status: "error",
              message: "District not found",
              errorCode: "NOT_FOUND"
            },
            { status: 404 }
          );
          
        case "IN_USE":
          return NextResponse.json(
            { 
              status: "error",
              message: "Cannot delete district with associated ULBs, GPUs, or ZPTCs",
              errorCode: "IN_USE"
            },
            { status: 400 }
          );
          
        default:
          throw validationError;
      }
    }
  } catch (error) {
    console.error("District DELETE error:", error);
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

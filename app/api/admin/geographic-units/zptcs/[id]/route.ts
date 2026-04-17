// ZPTC API - Get by ID, Update, Delete
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { 
  getZPTCById, 
  updateZPTC, 
  deleteZPTC,
  updateZPTCSchema 
} from "@/lib/services/geographic.service";

// GET - Get ZPTC by ID
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

    const zptc = await getZPTCById(id);
    
    if (!zptc) {
      return NextResponse.json(
        { 
          status: "error",
          message: "ZPTC not found",
          errorCode: "NOT_FOUND"
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "ZPTC retrieved successfully",
      data: zptc
    });
  } catch (error) {
    console.error("ZPTC GET by ID error:", error);
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

// PUT - Update ZPTC
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
    const data = updateZPTCSchema.parse(body);

    try {
      const zptc = await updateZPTC(id, data);
      
      return NextResponse.json({
        status: "success",
        message: "ZPTC updated successfully",
        data: zptc
      });
    } catch (validationError: any) {
      const errorCode = validationError.message;
      
      switch (errorCode) {
        case "NOT_FOUND":
          return NextResponse.json(
            { 
              status: "error",
              message: "ZPTC not found",
              errorCode: "NOT_FOUND"
            },
            { status: 404 }
          );
          
        case "DUPLICATE_CODE":
          return NextResponse.json(
            { 
              status: "error",
              message: "ZPTC with this code already exists",
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

    console.error("ZPTC PUT error:", error);
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

// DELETE - Delete ZPTC
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
      await deleteZPTC(id);
      
      return NextResponse.json({
        status: "success",
        message: "ZPTC deleted successfully"
      });
    } catch (validationError: any) {
      const errorCode = validationError.message;
      
      switch (errorCode) {
        case "NOT_FOUND":
          return NextResponse.json(
            { 
              status: "error",
              message: "ZPTC not found",
              errorCode: "NOT_FOUND"
            },
            { status: 404 }
          );
          
        case "IN_USE":
          return NextResponse.json(
            { 
              status: "error",
              message: "Cannot delete ZPTC with associated election seats",
              errorCode: "IN_USE"
            },
            { status: 400 }
          );
          
        default:
          throw validationError;
      }
    }
  } catch (error) {
    console.error("ZPTC DELETE error:", error);
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

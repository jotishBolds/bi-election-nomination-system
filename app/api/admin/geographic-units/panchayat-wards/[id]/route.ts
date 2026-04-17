// Panchayat Ward API - Get by ID, Update, Delete
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { 
  getPanchayatWardById, 
  updatePanchayatWard, 
  deletePanchayatWard,
  updatePanchayatWardSchema 
} from "@/lib/services/geographic.service";

// GET - Get Panchayat Ward by ID
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

    const panchayatWard = await getPanchayatWardById(id);
    
    if (!panchayatWard) {
      return NextResponse.json(
        { 
          status: "error",
          message: "Panchayat ward not found",
          errorCode: "NOT_FOUND"
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Panchayat ward retrieved successfully",
      data: panchayatWard
    });
  } catch (error) {
    console.error("Panchayat Ward GET by ID error:", error);
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

// PUT - Update Panchayat Ward
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
    const data = updatePanchayatWardSchema.parse(body);

    try {
      const panchayatWard = await updatePanchayatWard(id, data);
      
      return NextResponse.json({
        status: "success",
        message: "Panchayat ward updated successfully",
        data: panchayatWard
      });
    } catch (validationError: any) {
      const errorCode = validationError.message;
      
      switch (errorCode) {
        case "NOT_FOUND":
          return NextResponse.json(
            { 
              status: "error",
              message: "Panchayat ward not found",
              errorCode: "NOT_FOUND"
            },
            { status: 404 }
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
          
        case "FOREIGN_KEY_ERROR":
          return NextResponse.json(
            { 
              status: "error",
              message: "Invalid GPU ID",
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

    console.error("Panchayat Ward PUT error:", error);
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

// DELETE - Delete Panchayat Ward
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
      await deletePanchayatWard(id);
      
      return NextResponse.json({
        status: "success",
        message: "Panchayat ward deleted successfully"
      });
    } catch (validationError: any) {
      const errorCode = validationError.message;
      
      switch (errorCode) {
        case "NOT_FOUND":
          return NextResponse.json(
            { 
              status: "error",
              message: "Panchayat ward not found",
              errorCode: "NOT_FOUND"
            },
            { status: 404 }
          );
          
        case "IN_USE":
          return NextResponse.json(
            { 
              status: "error",
              message: "Cannot delete panchayat ward with associated election seats",
              errorCode: "IN_USE"
            },
            { status: 400 }
          );
          
        default:
          throw validationError;
      }
    }
  } catch (error) {
    console.error("Panchayat Ward DELETE error:", error);
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

// Admin API - User Management
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import {
  createUser,
  getUsers,
  updateUser,
  deactivateUser,
} from "@/lib/services/admin";
import { Role } from "@prisma/client";

// GET - List users
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") as Role | null;
    const stateId = searchParams.get("stateId") || undefined;
    const districtId = searchParams.get("districtId") || undefined;
    const ulbId = searchParams.get("ulbId") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const result = await getUsers({
      role: role || undefined,
      stateId,
      districtId,
      ulbId,
      search,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { phone, email, name, role, jurisdiction } = body;

    // Validate required fields
    if (!phone || !role) {
      return NextResponse.json(
        { success: false, error: "Phone and role are required" },
        { status: 400 },
      );
    }

    // Validate role
    if (!Object.values(Role).includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 },
      );
    }

    // RO must have ward jurisdiction
    if (role === Role.RO && !jurisdiction?.wardId) {
      return NextResponse.json(
        { success: false, error: "RO must be assigned to a ward" },
        { status: 400 },
      );
    }

    const result = await createUser(
      {
        phone,
        email,
        name,
        role,
        jurisdiction,
      },
      session.user.id,
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      message: `User created. Temporary password: ${result.tempPassword}`,
    });
  } catch (error) {
    console.error("Admin users POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Update user
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 },
      );
    }

    const result = await updateUser(userId, updateData, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, user: result.user });
  } catch (error) {
    console.error("Admin users PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Deactivate user
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 },
      );
    }

    const result = await deactivateUser(userId, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, message: "User deactivated" });
  } catch (error) {
    console.error("Admin users DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

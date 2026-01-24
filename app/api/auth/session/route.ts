import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getRoleDashboard } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      user: session.user,
      dashboard: getRoleDashboard(session.user.role),
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

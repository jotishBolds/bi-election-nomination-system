import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

type Role = "RO" | "CANDIDATE" | "SES" | "SUPER_ADMIN";

const publicPaths = ["/login", "/register", "/api/auth", "/"];

const roleRoutes: Record<Role, string[]> = {
  RO: ["/dashboard/ro"],
  CANDIDATE: ["/dashboard/candidate"],
  SES: ["/dashboard/ses"],
  SUPER_ADMIN: [
    "/dashboard/ro",
    "/dashboard/candidate",
    "/dashboard/ses",
    "/dashboard/super-admin",
  ],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/dashboard")) {
    const userRole = token.role as Role;
    const allowedRoutes = roleRoutes[userRole] || [];

    const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route));

    if (!hasAccess && pathname !== "/dashboard") {
      const roleDashboard = allowedRoutes[0] || "/dashboard";
      return NextResponse.redirect(new URL(roleDashboard, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)"],
};

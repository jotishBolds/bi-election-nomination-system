// Middleware for authentication and authorization
import { auth } from "@/lib/auth/next-auth";
import { NextResponse } from "next/server";

// Use Node.js runtime instead of Edge to support crypto module
export const runtime = "nodejs";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes
  const publicRoutes = [
    "/login",
    "/register",
    "/api/auth",
    "/api/otp",
    "/_next",
    "/favicon.ico",
    "/main-logo.png",
    "/public",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // API routes that don't require auth
  const publicApiRoutes = ["/api/health", "/api/public"];
  const isPublicApi = publicApiRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isPublicRoute || isPublicApi) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};

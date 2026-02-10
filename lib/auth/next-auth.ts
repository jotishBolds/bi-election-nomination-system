// NextAuth v5 Configuration with MFA Support
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import {
  verifyPassword,
  verifyTOTP,
  getClientIP,
} from "@/lib/auth/server-utils";
import {
  trackLoginAttempt,
  getLoginAttempts,
  clearLoginAttempts,
} from "@/lib/memory-store";
import { Role } from "@prisma/client";

// Extend the session and user types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      phone: string;
      name: string;
      role: Role;
      roles: Role[];
      requiresTOTP: boolean;
      totpVerified: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    phone: string;
    name: string;
    role: Role;
    roles: Role[];
    requiresTOTP: boolean;
    totpVerified: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    email: string;
    phone: string;
    name: string;
    role: Role;
    roles: Role[];
    requiresTOTP: boolean;
    totpVerified: boolean;
  }
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Email + Password credentials provider
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totp: { label: "TOTP Code", type: "text" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const totpCode = credentials.totp as string | undefined;

        // Check login attempts
        const attempts = await getLoginAttempts(email);
        if (attempts >= MAX_LOGIN_ATTEMPTS) {
          throw new Error(
            `Account locked. Try again after ${LOCKOUT_DURATION_MINUTES} minutes.`,
          );
        }

        // Find user
        const user = await db.user.findUnique({
          where: { email: email.toLowerCase() },
          include: {
            roles: {
              where: { isActive: true },
            },
            totpSecret: true,
          },
        });

        if (!user) {
          await trackLoginAttempt(email);
          throw new Error("Invalid credentials");
        }

        // Check if user is active
        if (!user.isActive) {
          throw new Error("Account is deactivated");
        }

        // Check if account is locked
        if (user.lockedUntil && new Date() < user.lockedUntil) {
          throw new Error("Account is temporarily locked");
        }

        // Verify password
        if (!user.passwordHash) {
          throw new Error("Password not set. Please use OTP login.");
        }

        const isValidPassword = await verifyPassword(
          password,
          user.passwordHash,
        );
        if (!isValidPassword) {
          console.warn(`[Auth] Invalid password for user: ${email}`);
          await trackLoginAttempt(email);

          // Lock account if max attempts reached
          const newAttempts = await getLoginAttempts(email);
          if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            await db.user.update({
              where: { id: user.id },
              data: {
                lockedUntil: new Date(
                  Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000,
                ),
                failedLoginCount: newAttempts,
              },
            });
          }

          throw new Error("Invalid credentials");
        }

        // Get user roles
        const roles = user.roles.map((r) => r.role);
        const primaryRole = roles[0] || Role.CANDIDATE;

        // Check TOTP requirement for RO and SUPER_ADMIN
        const requiresTOTP =
          (roles.includes(Role.RO) || roles.includes(Role.SUPER_ADMIN)) &&
          user.totpSecret?.isEnabled;

        // If TOTP is required but not provided
        if (requiresTOTP && !totpCode) {
          // Return user with flag indicating TOTP is needed
          // The client should redirect to TOTP verification
          return {
            id: user.id,
            email: user.email || "",
            phone: user.phone || "",
            name: user.name,
            role: primaryRole,
            roles,
            requiresTOTP: true,
            totpVerified: false,
          };
        }

        // Verify TOTP if required
        if (requiresTOTP && totpCode && user.totpSecret?.secret) {
          const isValidTOTP = verifyTOTP(totpCode, user.totpSecret.secret);
          if (!isValidTOTP) {
            throw new Error("Invalid authenticator code");
          }
        }

        // Clear login attempts on successful login
        await clearLoginAttempts(email);

        // Update last login
        const clientIp = getClientIP(request as Request);
        await db.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            lastLoginIp: clientIp,
            failedLoginCount: 0,
            lockedUntil: null,
          },
        });

        // Log audit
        await db.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            entityType: "User",
            entityId: user.id,
            ipAddress: clientIp,
            userAgent:
              (request as Request).headers.get("user-agent") || "Unknown",
          },
        });

        return {
          id: user.id,
          email: user.email || "",
          phone: user.phone || "",
          name: user.name,
          role: primaryRole,
          roles,
          requiresTOTP: !!requiresTOTP,
          totpVerified: requiresTOTP ? !!totpCode : true,
        };
      },
    }),
    // Phone + OTP credentials provider
    Credentials({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        otpVerified: { label: "OTP Verified", type: "text" },
      },
      async authorize(credentials, request) {
        if (!credentials?.phone) {
          throw new Error("Phone number is required");
        }

        const phone = credentials.phone as string;
        const otpVerified = credentials.otpVerified === "true";

        // OTP must be verified before calling this provider
        if (!otpVerified) {
          throw new Error("OTP verification required");
        }

        // Find user by phone
        const user = await db.user.findUnique({
          where: { phone },
          include: {
            roles: {
              where: { isActive: true },
            },
            totpSecret: true,
          },
        });

        if (!user) {
          throw new Error("User not found");
        }

        // Check if user is active
        if (!user.isActive) {
          throw new Error("Account is deactivated");
        }

        // Get user roles
        const roles = user.roles.map((r) => r.role);
        const primaryRole = roles[0] || Role.CANDIDATE;

        // Update last login
        const clientIp = getClientIP(request as Request);
        await db.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            lastLoginIp: clientIp,
            failedLoginCount: 0,
            lockedUntil: null,
          },
        });

        // Log audit
        await db.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            entityType: "User",
            entityId: user.id,
            ipAddress: clientIp,
            userAgent:
              (request as Request).headers.get("user-agent") || "Unknown",
            metadata: { method: "phone-otp" },
          },
        });

        return {
          id: user.id,
          email: user.email || "",
          phone: user.phone || "",
          name: user.name,
          role: primaryRole,
          roles,
          requiresTOTP: false,
          totpVerified: true,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.phone = user.phone;
        token.name = user.name;
        token.role = user.role;
        token.roles = user.roles;
        token.requiresTOTP = user.requiresTOTP;
        token.totpVerified = user.totpVerified;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email,
        phone: token.phone,
        name: token.name,
        role: token.role,
        roles: token.roles,
        requiresTOTP: token.requiresTOTP,
        totpVerified: token.totpVerified,
      } as typeof session.user;
      return session;
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      // Public routes
      const publicRoutes = ["/login", "/register", "/api/auth"];
      const isPublicRoute = publicRoutes.some((route) =>
        pathname.startsWith(route),
      );

      if (isPublicRoute) {
        return true;
      }

      // Protected routes require authentication
      if (!isLoggedIn) {
        return false;
      }

      // Check TOTP verification for sensitive routes
      if (
        auth.user.requiresTOTP &&
        !auth.user.totpVerified &&
        !pathname.startsWith("/verify-totp")
      ) {
        return Response.redirect(new URL("/verify-totp", request.nextUrl));
      }

      // Role-based access control
      const roleRoutes: Record<string, Role[]> = {
        "/admin": [Role.SUPER_ADMIN],
        "/ro": [Role.RO, Role.SUPER_ADMIN],
        "/ses": [Role.SES, Role.SUPER_ADMIN],
        "/nomination": [Role.CANDIDATE],
      };

      for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
        if (pathname.startsWith(route)) {
          const hasAccess = auth.user.roles.some((role) =>
            allowedRoles.includes(role),
          );
          if (!hasAccess) {
            return Response.redirect(new URL("/unauthorized", request.nextUrl));
          }
        }
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 15 * 60, // 15 minutes (CERT-IN compliant)
  },
  trustHost: true,
});

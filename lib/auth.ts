import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import type { Role } from "@/app/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      phone: string;
      epicNumber: string;
      role: Role;
      isVerified: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    phone: string;
    epicNumber: string;
    role: Role;
    isVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    phone: string;
    epicNumber: string;
    role: Role;
    isVerified: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (
          !credentials?.email ||
          !credentials?.password ||
          !credentials?.otp
        ) {
          throw new Error("Email, password and OTP are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          throw new Error("Invalid credentials");
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        if (!isValidPassword) {
          throw new Error("Invalid credentials");
        }

        const isValidOtp = await verifyOtp(user.id, credentials.otp as string);

        if (!isValidOtp) {
          throw new Error("Invalid or expired OTP");
        }

        return {
          id: user.id,
          email: user.email,
          phone: user.phone,
          epicNumber: user.epicNumber,
          role: user.role,
          isVerified: user.isVerified,
        };
      },
    }),
    CredentialsProvider({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) {
          throw new Error("Phone and OTP are required");
        }

        const user = await prisma.user.findUnique({
          where: { phone: credentials.phone as string },
        });

        if (!user) {
          throw new Error("User not found");
        }

        const isValidOtp = await verifyOtp(user.id, credentials.otp as string);

        if (!isValidOtp) {
          throw new Error("Invalid or expired OTP");
        }

        if (!user.isVerified) {
          await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true },
          });
        }

        return {
          id: user.id,
          email: user.email,
          phone: user.phone,
          epicNumber: user.epicNumber,
          role: user.role,
          isVerified: true,
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
        token.epicNumber = user.epicNumber;
        token.role = user.role;
        token.isVerified = user.isVerified;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        email: token.email as string,
        phone: token.phone as string,
        epicNumber: token.epicNumber as string,
        role: token.role as Role,
        isVerified: token.isVerified as boolean,
      };
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export function getRoleDashboard(role: Role): string {
  const dashboards: Record<Role, string> = {
    RO: "/dashboard/ro",
    CANDIDATE: "/dashboard/candidate",
    SES: "/dashboard/ses",
    SUPER_ADMIN: "/dashboard/super-admin",
  };
  return dashboards[role] || "/dashboard";
}

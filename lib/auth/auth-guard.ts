import { auth } from "@/lib/auth/next-auth";
import { Role } from "@prisma/client";

export async function requireSuperAdmin() {
  return requireRoles([Role.SUPER_ADMIN]);
}

export async function requireRoles(allowedRoles: Role[]) {
  const session = await auth();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

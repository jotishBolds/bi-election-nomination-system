import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";

export async function requireSuperAdmin() {
  return requireRoles([Role.SUPER_ADMIN]);
}

export async function requireRoles(allowedRoles: Role[]) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

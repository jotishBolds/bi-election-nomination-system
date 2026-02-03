// Re-export auth handlers
import { handlers } from "@/lib/auth/next-auth";

export const { GET, POST } = handlers;

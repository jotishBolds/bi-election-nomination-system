"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/lib/auth/auth-context";
import { NominationSubmissionProvider } from "@/app/context/nomination-submission-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <NominationSubmissionProvider>{children}</NominationSubmissionProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

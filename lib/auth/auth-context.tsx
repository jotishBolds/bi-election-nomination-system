"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { AuthState, AuthUser, LoginCredentials } from "./types";

interface AuthContextType extends AuthState {
  login: (
    credentials: LoginCredentials,
  ) => Promise<{ success: boolean; error?: string; requiresOtp?: boolean }>;
  verifyOtp: (otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Temporary storage for pending login credentials
let pendingCredentials: LoginCredentials | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Sync state with NextAuth session
  useEffect(() => {
    if (status === "loading") {
      setState((prev) => ({ ...prev, isLoading: true }));
    } else if (status === "authenticated" && session?.user) {
      setState({
        user: {
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.name || "",
          role: session.user.role as AuthUser["role"],
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, [session, status]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      // Store credentials for OTP verification step
      pendingCredentials = credentials;

      // For now, we'll send OTP via API then verify
      // In a real flow, you'd call an API to send OTP first
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: credentials.email,
          type: "LOGIN",
          channel: "email",
        }),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, requiresOtp: true };
      } else {
        // If OTP sending fails, try direct login (for users without OTP requirement)
        const result = await signIn("credentials", {
          email: credentials.email,
          password: credentials.password,
          redirect: false,
        });

        if (result?.error) {
          return { success: false, error: result.error };
        }

        return { success: true, requiresOtp: false };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }, []);

  const verifyOtp = useCallback(async (otp: string) => {
    if (!pendingCredentials) {
      return { success: false, error: "No pending login found" };
    }

    try {
      // Verify OTP first
      const otpResponse = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: pendingCredentials.email,
          otp,
          type: "LOGIN",
        }),
      });

      const otpData = await otpResponse.json();

      if (!otpData.success) {
        return { success: false, error: otpData.error || "Invalid OTP" };
      }

      // OTP verified, now sign in with NextAuth
      const result = await signIn("credentials", {
        email: pendingCredentials.email,
        password: pendingCredentials.password,
        redirect: false,
      });

      pendingCredentials = null;

      if (result?.error) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      console.error("OTP verification error:", error);
      return { success: false, error: "OTP verification failed" };
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut({ redirect: false });
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ ...state, login, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

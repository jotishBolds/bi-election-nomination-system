"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { AuthState, AuthUser, LoginCredentials } from "./types";
import { validateCredentials } from "./users";
import {
  storeAuthUser,
  getStoredAuthUser,
  clearStoredAuthUser,
} from "./auth-utils";

interface AuthContextType extends AuthState {
  login: (
    credentials: LoginCredentials,
  ) => Promise<{ success: boolean; error?: string; requiresOtp?: boolean }>;
  verifyOtp: (otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Temporary storage for pending login
let pendingLogin: { user: any; credentials: LoginCredentials } | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const user = getStoredAuthUser();
    setState({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const user = validateCredentials(credentials.email, credentials.password);

    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    // Store pending login for OTP verification
    pendingLogin = { user, credentials };
    return { success: true, requiresOtp: true };
  }, []);

  const verifyOtp = useCallback(async (otp: string) => {
    // Demo OTP check
    if (otp !== "123456") {
      return { success: false, error: "Invalid OTP" };
    }

    if (!pendingLogin) {
      return { success: false, error: "No pending login found" };
    }

    const authUser = storeAuthUser(pendingLogin.user);
    setState({
      user: authUser,
      isAuthenticated: true,
      isLoading: false,
    });

    pendingLogin = null; // Clear pending login
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    clearStoredAuthUser();
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

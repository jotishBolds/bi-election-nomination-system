export type UserRole = "RO" | "CANDIDATE" | "SES" | "SUPER_ADMIN";

export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: UserRole;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: UserRole;
}

export interface LoginCredentials {
  phone: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  RO: "Returning Officer",
  CANDIDATE: "Applicant",
  SES: "State Election Commission",
  SUPER_ADMIN: "Super Admin",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  RO: "bg-blue-100 text-blue-800",
  CANDIDATE: "bg-green-100 text-green-800",
  SES: "bg-purple-100 text-purple-800",
  SUPER_ADMIN: "bg-red-100 text-red-800",
};

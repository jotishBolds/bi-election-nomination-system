// Dashboard data fetching hook
"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  CandidateDashboardData,
  RODashboardData,
  SECDashboardData,
  AdminDashboardData,
} from "@/types/dashboard";

type DashboardData =
  | CandidateDashboardData
  | RODashboardData
  | SECDashboardData
  | AdminDashboardData;

interface UseDashboardResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboard<T extends DashboardData>(
  role: "candidate" | "ro" | "sec" | "admin",
): UseDashboardResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/${role}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Failed to load dashboard");
        return;
      }

      setData(result.data as T);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// Typed hooks for each role
export function useCandidateDashboard() {
  return useDashboard<CandidateDashboardData>("candidate");
}

export function useRODashboard() {
  return useDashboard<RODashboardData>("ro");
}

export function useSECDashboard() {
  return useDashboard<SECDashboardData>("sec");
}

export function useAdminDashboard() {
  return useDashboard<AdminDashboardData>("admin");
}

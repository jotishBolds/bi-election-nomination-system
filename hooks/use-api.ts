// API Hooks for Frontend Integration
"use client";

import { useState, useCallback } from "react";

// Generic fetch wrapper with error handling
async function fetchAPI<T>(
  url: string,
  options?: RequestInit,
): Promise<{ data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { error: data.error || "Request failed" };
    }

    return { data };
  } catch (error: any) {
    return { error: error.message || "Network error" };
  }
}

// =====================
// NOMINATION HOOKS
// =====================

export function useNominations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNomination = useCallback(
    async (data: {
      wardId: string;
      category: string;
      isIndependent: boolean;
      partyId?: string;
    }) => {
      setLoading(true);
      setError(null);

      const result = await fetchAPI("/api/nominations", {
        method: "POST",
        body: JSON.stringify(data),
      });

      setLoading(false);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return result.data;
    },
    [],
  );

  const getNominations = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await fetchAPI("/api/nominations");

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return result.data;
  }, []);

  const getNomination = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const result = await fetchAPI(`/api/nominations/${id}`);

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return result.data;
  }, []);

  const updateNomination = useCallback(
    async (id: string, data: Record<string, any>) => {
      setLoading(true);
      setError(null);

      const result = await fetchAPI(`/api/nominations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });

      setLoading(false);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return result.data;
    },
    [],
  );

  const submitNomination = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const result = await fetchAPI(`/api/nominations/${id}`, {
      method: "POST",
      body: JSON.stringify({ action: "submit" }),
    });

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return result.data;
  }, []);

  return {
    loading,
    error,
    createNomination,
    getNominations,
    getNomination,
    updateNomination,
    submitNomination,
  };
}

// =====================
// PAYMENT HOOKS
// =====================

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = useCallback(
    async (nominationId: string, category: string) => {
      setLoading(true);
      setError(null);

      const result = await fetchAPI<{
        success: boolean;
        payment: any;
        paymentUrl: string;
      }>("/api/payments", {
        method: "POST",
        body: JSON.stringify({ nominationId, category }),
      });

      setLoading(false);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return result.data;
    },
    [],
  );

  const getPaymentStatus = useCallback(
    async (paymentId?: string, transactionId?: string) => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (paymentId) params.set("paymentId", paymentId);
      if (transactionId) params.set("transactionId", transactionId);

      const result = await fetchAPI(`/api/payments?${params.toString()}`);

      setLoading(false);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return result.data;
    },
    [],
  );

  return { loading, error, initiatePayment, getPaymentStatus };
}

// =====================
// OTP HOOKS
// =====================

export function useOTP() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOTP = useCallback(async (phone: string, type: string = "LOGIN") => {
    setLoading(true);
    setError(null);

    const result = await fetchAPI("/api/otp/send", {
      method: "POST",
      body: JSON.stringify({ phone, type }),
    });

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return false;
    }
    return true;
  }, []);

  const verifyOTP = useCallback(
    async (phone: string, otp: string, type: string = "LOGIN") => {
      setLoading(true);
      setError(null);

      const result = await fetchAPI("/api/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone, otp, type }),
      });

      setLoading(false);
      if (result.error) {
        setError(result.error);
        return false;
      }
      return true;
    },
    [],
  );

  return { loading, error, sendOTP, verifyOTP };
}

// =====================
// JURISDICTION HOOKS
// =====================

export function useJurisdictions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStates = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await fetchAPI("/api/admin/jurisdictions?type=states");

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return [];
    }
    return (result.data as any)?.data || [];
  }, []);

  const getDistricts = useCallback(async (stateId: string) => {
    setLoading(true);
    setError(null);

    const result = await fetchAPI(
      `/api/admin/jurisdictions?type=districts&parentId=${stateId}`,
    );

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return [];
    }
    return (result.data as any)?.data || [];
  }, []);

  const getULBs = useCallback(async (districtId: string) => {
    setLoading(true);
    setError(null);

    const result = await fetchAPI(
      `/api/admin/jurisdictions?type=ulbs&parentId=${districtId}`,
    );

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return [];
    }
    return (result.data as any)?.data || [];
  }, []);

  const getWards = useCallback(async (ulbId: string) => {
    setLoading(true);
    setError(null);

    const result = await fetchAPI(
      `/api/admin/jurisdictions?type=wards&parentId=${ulbId}`,
    );

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return [];
    }
    return (result.data as any)?.data || [];
  }, []);

  return { loading, error, getStates, getDistricts, getULBs, getWards };
}

// =====================
// RO DASHBOARD HOOKS
// =====================

export function useRODashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await fetchAPI("/api/ro/nominations?type=stats");

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return (result.data as any)?.stats;
  }, []);

  const getNominations = useCallback(
    async (options?: { status?: string; page?: number; limit?: number }) => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options?.status) params.set("status", options.status);
      if (options?.page) params.set("page", options.page.toString());
      if (options?.limit) params.set("limit", options.limit.toString());

      const result = await fetchAPI(`/api/ro/nominations?${params.toString()}`);

      setLoading(false);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return result.data;
    },
    [],
  );

  const getNominationDetails = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const result = await fetchAPI(`/api/ro/nominations/${id}`);

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return (result.data as any)?.nomination;
  }, []);

  const receiveNomination = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const result = await fetchAPI(`/api/ro/nominations/${id}`, {
      method: "POST",
      body: JSON.stringify({ action: "receive" }),
    });

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return (result.data as any)?.nomination;
  }, []);

  const scrutinizeNomination = useCallback(
    async (
      id: string,
      decision: "ACCEPT" | "REJECT",
      rejectionReason?: string,
      remarks?: string,
    ) => {
      setLoading(true);
      setError(null);

      const result = await fetchAPI(`/api/ro/nominations/${id}`, {
        method: "POST",
        body: JSON.stringify({
          action: "scrutinize",
          decision,
          rejectionReason,
          remarks,
        }),
      });

      setLoading(false);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return (result.data as any)?.nomination;
    },
    [],
  );

  const processWithdrawal = useCallback(async (id: string, reason: string) => {
    setLoading(true);
    setError(null);

    const result = await fetchAPI(`/api/ro/nominations/${id}`, {
      method: "POST",
      body: JSON.stringify({ action: "process-withdrawal", reason }),
    });

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return (result.data as any)?.nomination;
  }, []);

  return {
    loading,
    error,
    getStats,
    getNominations,
    getNominationDetails,
    receiveNomination,
    scrutinizeNomination,
    processWithdrawal,
  };
}

// =====================
// SEC DASHBOARD HOOKS
// =====================

export function useSECDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStats = useCallback(
    async (filters?: {
      stateId?: string;
      districtId?: string;
      ulbId?: string;
    }) => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ type: "stats" });
      if (filters?.stateId) params.set("stateId", filters.stateId);
      if (filters?.districtId) params.set("districtId", filters.districtId);
      if (filters?.ulbId) params.set("ulbId", filters.ulbId);

      const result = await fetchAPI(`/api/sec/dashboard?${params.toString()}`);

      setLoading(false);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return (result.data as any)?.stats;
    },
    [],
  );

  const getNominations = useCallback(
    async (options?: {
      stateId?: string;
      districtId?: string;
      ulbId?: string;
      wardId?: string;
      status?: string;
      page?: number;
      limit?: number;
    }) => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ type: "nominations" });
      if (options?.stateId) params.set("stateId", options.stateId);
      if (options?.districtId) params.set("districtId", options.districtId);
      if (options?.ulbId) params.set("ulbId", options.ulbId);
      if (options?.wardId) params.set("wardId", options.wardId);
      if (options?.status) params.set("status", options.status);
      if (options?.page) params.set("page", options.page.toString());
      if (options?.limit) params.set("limit", options.limit.toString());

      const result = await fetchAPI(`/api/sec/dashboard?${params.toString()}`);

      setLoading(false);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return result.data;
    },
    [],
  );

  const getWardSummary = useCallback(async (ulbId: string) => {
    setLoading(true);
    setError(null);

    const result = await fetchAPI(
      `/api/sec/dashboard?type=ward-summary&ulbId=${ulbId}`,
    );

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return (result.data as any)?.data;
  }, []);

  const getElectionProgress = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await fetchAPI("/api/sec/dashboard?type=progress");

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return result.data;
  }, []);

  return {
    loading,
    error,
    getStats,
    getNominations,
    getWardSummary,
    getElectionProgress,
  };
}

// =====================
// ADMIN HOOKS
// =====================

export function useAdmin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User Management
  const getUsers = useCallback(
    async (options?: {
      role?: string;
      stateId?: string;
      districtId?: string;
      ulbId?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options?.role) params.set("role", options.role);
      if (options?.stateId) params.set("stateId", options.stateId);
      if (options?.districtId) params.set("districtId", options.districtId);
      if (options?.ulbId) params.set("ulbId", options.ulbId);
      if (options?.search) params.set("search", options.search);
      if (options?.page) params.set("page", options.page.toString());
      if (options?.limit) params.set("limit", options.limit.toString());

      const result = await fetchAPI(`/api/admin/users?${params.toString()}`);

      setLoading(false);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return result.data;
    },
    [],
  );

  const createUser = useCallback(
    async (data: {
      phone: string;
      email?: string;
      name?: string;
      role: string;
      jurisdiction?: {
        stateId?: string;
        districtId?: string;
        ulbId?: string;
        wardId?: string;
      };
    }) => {
      setLoading(true);
      setError(null);

      const result = await fetchAPI("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
      });

      setLoading(false);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return result.data;
    },
    [],
  );

  // Election Config
  const getElectionConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await fetchAPI("/api/admin/election-config");

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return (result.data as any)?.configs;
  }, []);

  const createElectionConfig = useCallback(
    async (data: {
      name: string;
      nominationStartDate: string;
      nominationEndDate: string;
      scrutinyDate: string;
      withdrawalStartDate: string;
      withdrawalEndDate: string;
      portalOpenTime?: string;
      portalCloseTime?: string;
      securityDepositGeneral?: number;
      securityDepositSCST?: number;
      maxNominationsPerCandidate?: number;
      minProposers?: number;
    }) => {
      setLoading(true);
      setError(null);

      const result = await fetchAPI("/api/admin/election-config", {
        method: "POST",
        body: JSON.stringify(data),
      });

      setLoading(false);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return (result.data as any)?.config;
    },
    [],
  );

  return {
    loading,
    error,
    getUsers,
    createUser,
    getElectionConfigs,
    createElectionConfig,
  };
}

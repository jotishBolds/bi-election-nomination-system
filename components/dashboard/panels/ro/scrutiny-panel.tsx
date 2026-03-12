"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Search,
  RefreshCw,
  Eye,
  FileText,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  FileCheck,
  FileX,
  Phone,
  Send,
  Loader2,
  ChevronRight,
  Home,
  ArrowLeft,
  Building2,
  MousePointerClick,
  Hash,
  UserCheck,
  Shield,
  SlidersHorizontal,
  Star,
  ImageIcon,
  ClipboardCheck,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/* ───────────────────────────────────────────────
   Folder SVG (same as ApplicationsListPanel)
   ─────────────────────────────────────────────── */
const FolderIcon = ({
  className,
  variant = "yellow",
}: {
  className?: string;
  variant?: "yellow" | "blue" | "green" | "amber";
}) => {
  const themes = {
    yellow: {
      back: "#C9930F",
      tab: "#B07E0A",
      front: "#F2C94C",
      frontDark: "#E0B42E",
      edge: "#FADA7A",
      line: "#D4A825",
    },
    blue: {
      back: "#2B5FB8",
      tab: "#1E4D9E",
      front: "#5E9BF0",
      frontDark: "#4A86DB",
      edge: "#8FBDF7",
      line: "#3A73CC",
    },
    green: {
      back: "#1B8A4A",
      tab: "#14703B",
      front: "#44CD79",
      frontDark: "#33B566",
      edge: "#7ADDA5",
      line: "#28A45C",
    },
    amber: {
      back: "#B45309",
      tab: "#92400E",
      front: "#F59E0B",
      frontDark: "#D97706",
      edge: "#FCD34D",
      line: "#B45309",
    },
  };
  const t = themes[variant];
  return (
    <svg
      viewBox="0 0 120 96"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="60" cy="92" rx="50" ry="4" fill="black" opacity="0.06" />
      <path
        d="M8 18C8 13.5817 11.5817 10 16 10H36.6863C39.338 10 41.8808 11.054 43.7549 12.929L48.2451 17.419C50.1192 19.294 52.662 20.348 55.3137 20.348H104C108.418 20.348 112 23.93 112 28.348V78C112 82.4183 108.418 86 104 86H16C11.5817 86 8 82.4183 8 78V18Z"
        fill={t.back}
      />
      <path
        d="M10 16C10 12.134 13.134 9 17 9H35.1C37.42 9 39.63 10 41.22 11.73L46 17H10V16Z"
        fill={t.tab}
      />
      <path
        d="M4 34C4 29.5817 7.58172 26 12 26H108C112.418 26 116 29.5817 116 34V78C116 82.4183 112.418 86 108 86H12C7.58172 86 4 82.4183 4 78V34Z"
        fill={t.front}
      />
      <path
        d="M4 34C4 29.5817 7.58172 26 12 26H108C112.418 26 116 29.5817 116 34V38H4V34Z"
        fill={t.edge}
        opacity="0.55"
      />
      <line
        x1="4"
        y1="38"
        x2="116"
        y2="38"
        stroke={t.line}
        strokeWidth="0.75"
        opacity="0.25"
      />
    </svg>
  );
};

/* ───────── Types ───────── */

interface SymbolPreference {
  preferenceOrder: number;
  symbol: { id: string; name: string; imagePath?: string };
}

interface Nomination {
  id: string;
  applicationNo: string;
  candidateName: string;
  fatherHusbandName?: string;
  address?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  category?: string;
  status: string;
  submittedAt: string;
  scrutinyAt?: string;
  scrutinyRemarks?: string;
  applicantProfile?: {
    user: { id: string; name: string; phone: string; email?: string };
  };
  ward: {
    id: string;
    wardNo: number;
    wardName: string;
    reservationType?: string;
    ulb?: { id?: string; name: string; district?: { name: string } };
  };
  politicalParty?: { name: string; abbreviation: string; shortName?: string };
  documents?: Array<{
    id: string;
    type: string;
    fileName: string;
    originalName?: string;
    storagePath?: string;
  }>;
  symbolPreferences?: SymbolPreference[];
  allocatedSymbol?: { id: string; name: string; imagePath?: string };
}

interface AvailableSymbol {
  id: string;
  name: string;
  imagePath?: string;
  isReserved: boolean;
  isActive?: boolean;
  isAllocated?: boolean;
  isPreferred?: boolean;
  preferenceOrder?: number;
}

interface WardData {
  id: string;
  wardNo: number;
  wardName: string;
  ulbId: string;
  reservationType: string | null;
  isActive?: boolean;
  ulb?: {
    id: string;
    code: string;
    name: string;
    type: string;
    districtId?: string;
    district?: { id: string; code: string; name: string };
  };
  _count?: { nominations: number };
}

interface ULBGroup {
  id: string;
  code: string;
  name: string;
  type: string;
  districtName: string;
  wards: WardData[];
}

type NavLevel = "root" | "ulb" | "ward" | "applications";

interface FolderHistoryState {
  scrutinyFolder: NavLevel;
  ulbId?: string;
  wardId?: string;
}

const formatUlbType = (type: string) =>
  type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const LEVEL_NUM: Record<NavLevel, number> = {
  root: 0,
  ulb: 1,
  ward: 2,
  applications: 3,
};

/* scrutiny-relevant statuses */
const SCRUTINY_STATUSES = ["RECEIVED", "UNDER_SCRUTINY"];

/* ═══════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════ */

export function ScrutinyPanel() {
  /* ── Data state ── */
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [wards, setWards] = useState<WardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Navigation state ── */
  const [navLevel, setNavLevel] = useState<NavLevel>("root");
  const [selectedUlb, setSelectedUlb] = useState<ULBGroup | null>(null);
  const [selectedWardNav, setSelectedWardNav] = useState<WardData | null>(null);

  /* ── Folder tap ── */
  const lastTapRef = useRef<{ id: string; time: number }>({
    id: "",
    time: 0,
  });
  const [tappedFolderId, setTappedFolderId] = useState<string | null>(null);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /* ── Search / filter ── */
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  /* ── Scrutiny dialog state ── */
  const [selectedNomination, setSelectedNomination] =
    useState<Nomination | null>(null);
  const [isScrutinyDialogOpen, setIsScrutinyDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [decision, setDecision] = useState<"ACCEPTED" | "REJECTED" | "">("");
  const [remarks, setRemarks] = useState("");

  const [availableSymbols, setAvailableSymbols] = useState<AvailableSymbol[]>(
    [],
  );
  const [selectedSymbolId, setSelectedSymbolId] = useState("");
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(false);

  const [otpStep, setOtpStep] = useState<"decision" | "otp">("decision");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  /* ───────── Computed: ULB groups ───────── */

  const ulbGroups = useMemo(() => {
    const groups: Record<string, ULBGroup> = {};
    wards.forEach((ward) => {
      if (!ward.ulb) return;
      const ulbId = ward.ulb.id;
      if (!groups[ulbId]) {
        groups[ulbId] = {
          id: ulbId,
          code: ward.ulb.code,
          name: ward.ulb.name,
          type: ward.ulb.type,
          districtName: ward.ulb.district?.name || "N/A",
          wards: [],
        };
      }
      groups[ulbId].wards.push(ward);
    });
    Object.values(groups).forEach((g) =>
      g.wards.sort((a, b) => a.wardNo - b.wardNo),
    );
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [wards]);

  const ulbGroupsRef = useRef(ulbGroups);
  useEffect(() => {
    ulbGroupsRef.current = ulbGroups;
  }, [ulbGroups]);

  /* ───────── Pending-scrutiny nominations ───────── */

  const pendingNominations = useMemo(
    () => nominations.filter((n) => SCRUTINY_STATUSES.includes(n.status)),
    [nominations],
  );

  /* ward → ULB mapping */
  const wardToUlbMap = useMemo(() => {
    const m: Record<string, string> = {};
    wards.forEach((w) => {
      if (w.ulb) m[w.id] = w.ulb.id;
    });
    return m;
  }, [wards]);

  /* counts per ULB (scrutiny-pending only) */
  const ulbPendingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    pendingNominations.forEach((n) => {
      const ulbId = wardToUlbMap[n.ward.id];
      if (ulbId) counts[ulbId] = (counts[ulbId] || 0) + 1;
    });
    return counts;
  }, [pendingNominations, wardToUlbMap]);

  /* counts per ward (scrutiny-pending only) */
  const wardPendingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    pendingNominations.forEach((n) => {
      counts[n.ward.id] = (counts[n.ward.id] || 0) + 1;
    });
    return counts;
  }, [pendingNominations]);

  /* status stats for current ward */
  const statusStats = useMemo(() => {
    const source = selectedWardNav
      ? nominations.filter((n) => n.ward.id === selectedWardNav.id)
      : nominations;
    return source.reduce(
      (acc, n) => {
        acc[n.status] = (acc[n.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [nominations, selectedWardNav]);

  /* filtered nominations for applications level */
  const currentNominations = useMemo(() => {
    let filtered = nominations;
    if (selectedWardNav) {
      filtered = filtered.filter((n) => n.ward.id === selectedWardNav.id);
    }
    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "pending") {
        filtered = filtered.filter((n) => SCRUTINY_STATUSES.includes(n.status));
      } else {
        filtered = filtered.filter((n) => n.status === statusFilter);
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.applicationNo.toLowerCase().includes(q) ||
          (n.candidateName || "").toLowerCase().includes(q) ||
          (n.applicantProfile?.user?.phone || "").includes(searchQuery),
      );
    }
    return filtered;
  }, [nominations, selectedWardNav, statusFilter, searchQuery]);

  /* breadcrumbs */
  const breadcrumbs = useMemo(() => {
    const items: { label: string; level: NavLevel }[] = [
      { label: "Home", level: "root" },
    ];
    if (selectedUlb && navLevel !== "root")
      items.push({ label: selectedUlb.name, level: "ulb" });
    if (selectedWardNav && (navLevel === "ward" || navLevel === "applications"))
      items.push({
        label: `Ward ${selectedWardNav.wardNo} – ${selectedWardNav.wardName}`,
        level: "ward",
      });
    if (navLevel === "applications")
      items.push({ label: "Scrutiny Queue", level: "applications" });
    return items;
  }, [navLevel, selectedUlb, selectedWardNav]);

  /* ───────── History / popstate ───────── */

  const historyInitialized = useRef(false);
  useEffect(() => {
    if (!historyInitialized.current) {
      historyInitialized.current = true;
      window.history.replaceState(
        { scrutinyFolder: "root" } as FolderHistoryState,
        "",
      );
    }
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as FolderHistoryState | null;
      if (!state || !state.scrutinyFolder) return;
      const groups = ulbGroupsRef.current;
      switch (state.scrutinyFolder) {
        case "root":
          setNavLevel("root");
          setSelectedUlb(null);
          setSelectedWardNav(null);
          break;
        case "ulb": {
          const ulb = groups.find((u) => u.id === state.ulbId);
          if (ulb) {
            setSelectedUlb(ulb);
            setSelectedWardNav(null);
            setNavLevel("ulb");
          } else {
            setNavLevel("root");
            setSelectedUlb(null);
            setSelectedWardNav(null);
          }
          break;
        }
        case "ward": {
          const ulb = groups.find((u) => u.id === state.ulbId);
          const ward = ulb?.wards.find((w) => w.id === state.wardId);
          if (ulb && ward) {
            setSelectedUlb(ulb);
            setSelectedWardNav(ward);
            setNavLevel("ward");
          } else {
            setNavLevel("root");
            setSelectedUlb(null);
            setSelectedWardNav(null);
          }
          break;
        }
        case "applications": {
          const ulb = groups.find((u) => u.id === state.ulbId);
          const ward = ulb?.wards.find((w) => w.id === state.wardId);
          if (ulb && ward) {
            setSelectedUlb(ulb);
            setSelectedWardNav(ward);
            setNavLevel("applications");
          } else {
            setNavLevel("root");
            setSelectedUlb(null);
            setSelectedWardNav(null);
          }
          break;
        }
      }
      setTappedFolderId(null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  /* ───────── Double-click / tap ───────── */

  const handleFolderDoubleClick = useCallback(
    (folderId: string, callback: () => void) => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 500;
      if (
        lastTapRef.current.id === folderId &&
        now - lastTapRef.current.time < DOUBLE_TAP_DELAY
      ) {
        callback();
        lastTapRef.current = { id: "", time: 0 };
        setTappedFolderId(null);
        if (tapTimeoutRef.current) {
          clearTimeout(tapTimeoutRef.current);
          tapTimeoutRef.current = null;
        }
      } else {
        lastTapRef.current = { id: folderId, time: now };
        setTappedFolderId(folderId);
        if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = setTimeout(() => {
          setTappedFolderId((prev) => (prev === folderId ? null : prev));
          tapTimeoutRef.current = null;
        }, DOUBLE_TAP_DELAY);
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    };
  }, []);

  /* ───────── Data fetching ───────── */

  const fetchWards = async () => {
    try {
      const response = await fetch("/api/ro/wards");
      const result = await response.json();
      if (result.success) setWards(result.data);
    } catch {
      console.error("Failed to fetch wards");
    }
  };

  const fetchNominations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ro/applications");
      const result = await response.json();
      if (result.success) {
        setNominations(result.data);
      } else {
        setError(result.error || "Failed to fetch applications");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWards();
  }, []);
  useEffect(() => {
    fetchNominations();
  }, [fetchNominations]);

  /* ───────── Navigation helpers ───────── */

  const navigateToUlb = (ulb: ULBGroup) => {
    setSelectedUlb(ulb);
    setNavLevel("ulb");
    setTappedFolderId(null);
    window.history.pushState(
      { scrutinyFolder: "ulb", ulbId: ulb.id } as FolderHistoryState,
      "",
    );
  };

  const navigateToWard = (ward: WardData) => {
    setSelectedWardNav(ward);
    setNavLevel("ward");
    setTappedFolderId(null);
    window.history.pushState(
      {
        scrutinyFolder: "ward",
        ulbId: selectedUlb?.id,
        wardId: ward.id,
      } as FolderHistoryState,
      "",
    );
  };

  const navigateToApplications = () => {
    setSearchQuery("");
    setStatusFilter("pending");
    setNavLevel("applications");
    setTappedFolderId(null);
    window.history.pushState(
      {
        scrutinyFolder: "applications",
        ulbId: selectedUlb?.id,
        wardId: selectedWardNav?.id,
      } as FolderHistoryState,
      "",
    );
  };

  const goBack = () => {
    setTappedFolderId(null);
    if (navLevel !== "root") window.history.back();
  };

  const navigateToLevel = (level: NavLevel) => {
    const diff = LEVEL_NUM[navLevel] - LEVEL_NUM[level];
    if (diff > 0) {
      setTappedFolderId(null);
      window.history.go(-diff);
    }
  };

  /* ───────── Scrutiny handlers ───────── */

  const fetchAvailableSymbols = async (nominationId: string) => {
    setIsLoadingSymbols(true);
    try {
      const response = await fetch(
        `/api/ro/applications/${nominationId}/available-symbols`,
      );
      const result = await response.json();
      if (result.success && result.data) {
        const symbols = (result.data.availableSymbols || []).map(
          (s: {
            id: string;
            name: string;
            imagePath?: string;
            isAllocated: boolean;
            isPreferred: boolean;
            preferenceOrder?: number;
          }) => ({
            id: s.id,
            name: s.name,
            imagePath: s.imagePath,
            isReserved: false,
            isActive: true,
            isAllocated: s.isAllocated,
            isPreferred: s.isPreferred,
            preferenceOrder: s.preferenceOrder,
          }),
        );
        setAvailableSymbols(symbols);
        setSelectedSymbolId((prev) => {
          if (prev) {
            const sym = symbols.find(
              (s: { id: string; isAllocated: boolean }) => s.id === prev,
            );
            if (sym?.isAllocated) return "";
          }
          return prev;
        });
      }
    } catch {
      console.error("Failed to fetch symbols");
    } finally {
      setIsLoadingSymbols(false);
    }
  };

  const handleStartScrutiny = async (nomination: Nomination) => {
    setSelectedNomination(nomination);
    setDecision("");
    setRemarks("");
    setSelectedSymbolId(nomination.allocatedSymbol?.id || "");
    setOtpStep("decision");
    setOtp("");
    setOtpError("");
    setOtpSent(false);

    fetchAvailableSymbols(nomination.id);

    if (nomination.status === "RECEIVED") {
      try {
        await fetch(`/api/ro/applications/${nomination.id}/scrutiny`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "START" }),
        });
        setNominations((prev) =>
          prev.map((n) =>
            n.id === nomination.id ? { ...n, status: "UNDER_SCRUTINY" } : n,
          ),
        );
      } catch {
        console.error("Failed to start scrutiny");
      }
    }
    setIsScrutinyDialogOpen(true);
  };

  const handleSendOtp = async () => {
    if (!selectedNomination) return;
    setIsSendingOtp(true);
    setOtpError("");
    try {
      const response = await fetch(
        `/api/ro/applications/${selectedNomination.id}/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "SCRUTINY" }),
        },
      );
      const result = await response.json();
      if (result.success) {
        setOtpSent(true);
        setOtpStep("otp");
      } else {
        setOtpError(result.error || "Failed to send OTP");
      }
    } catch {
      setOtpError("Failed to send OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmitScrutiny = async () => {
    if (!selectedNomination || !decision) return;
    if (otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP");
      return;
    }
    setIsSubmitting(true);
    setOtpError("");
    try {
      const requestBody: Record<string, string> = {
        action: "COMPLETE",
        decision,
        otp,
      };
      if (decision === "ACCEPTED" && selectedSymbolId) {
        requestBody.symbolId = selectedSymbolId;
      }
      if (decision === "REJECTED" && remarks.trim()) {
        requestBody.remarks = remarks.trim();
      }

      const response = await fetch(
        `/api/ro/applications/${selectedNomination.id}/scrutiny`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        },
      );
      const result = await response.json();
      if (result.success) {
        setIsScrutinyDialogOpen(false);
        fetchNominations();
      } else {
        setOtpError(result.error || "Failed to submit scrutiny");
      }
    } catch {
      setOtpError("Failed to submit scrutiny");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ───────── Status badge ───────── */

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { bg: string; text: string; border: string; dot: string }
    > = {
      RECEIVED: {
        bg: "bg-cyan-50",
        text: "text-cyan-700",
        border: "border-cyan-200",
        dot: "bg-cyan-500",
      },
      UNDER_SCRUTINY: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
      },
      ACCEPTED: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
      },
      REJECTED: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        dot: "bg-red-500",
      },
      SUBMITTED: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        dot: "bg-blue-500",
      },
    };
    const c = config[status] || {
      bg: "bg-slate-50",
      text: "text-slate-600",
      border: "border-slate-200",
      dot: "bg-slate-400",
    };
    return (
      <span
        className={`inline-flex items-center gap-1 sm:gap-1.5 ${c.bg} ${c.text} border ${c.border} text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium`}
      >
        <span
          className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${c.dot} shrink-0`}
        />
        <span className="hidden sm:inline">{status.replace(/_/g, " ")}</span>
        <span className="sm:hidden">
          {status === "UNDER_SCRUTINY" ? "Scrutiny" : status.replace(/_/g, " ")}
        </span>
      </span>
    );
  };

  /* ───────── Loading skeleton ───────── */

  if (isLoading && nominations.length === 0 && wards.length === 0) {
    return (
      <div className="space-y-3 sm:space-y-4 md:space-y-6 p-2 sm:p-3 md:p-6">
        <Skeleton className="h-6 sm:h-7 md:h-8 w-40 sm:w-48 md:w-56" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 sm:h-32 md:h-44 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28 sm:h-36 md:h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════ */

  return (
    <div className="space-y-2.5 sm:space-y-3 md:space-y-5 p-2 sm:p-3 md:p-6 w-full max-w-full overflow-x-hidden">
      {/* ── Header ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
        {navLevel !== "root" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="shrink-0 h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-xs sm:text-sm md:text-xl font-semibold text-slate-800 truncate">
            {navLevel === "root" && "Scrutiny – Municipal Bodies"}
            {navLevel === "ulb" && selectedUlb?.name}
            {navLevel === "ward" &&
              `Ward ${selectedWardNav?.wardNo} – ${selectedWardNav?.wardName}`}
            {navLevel === "applications" && "Scrutiny Queue"}
          </h1>
          <p className="text-[9px] sm:text-[10px] md:text-sm text-slate-500 mt-0.5 truncate">
            {navLevel === "root" &&
              "Review and verify nomination applications by ward"}
            {navLevel === "ulb" &&
              `${selectedUlb?.districtName} · ${formatUlbType(selectedUlb?.type || "")}`}
            {navLevel === "ward" &&
              `${selectedUlb?.name} · ${(selectedWardNav?.reservationType || "N/A").replace(/_/g, " ")}`}
            {navLevel === "applications" &&
              `Ward ${selectedWardNav?.wardNo} – ${selectedWardNav?.wardName} · ${selectedUlb?.name}`}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="ml-auto shrink-0 h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9"
          onClick={() => {
            fetchWards();
            fetchNominations();
          }}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* ── Breadcrumbs ── */}
      {navLevel !== "root" && (
        <nav className="flex items-center gap-0.5 text-[9px] sm:text-[10px] md:text-sm overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {breadcrumbs.map((item, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div key={idx} className="flex items-center gap-0.5 shrink-0">
                {idx > 0 && (
                  <ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-slate-400 shrink-0" />
                )}
                <button
                  onClick={() => !isLast && navigateToLevel(item.level)}
                  disabled={isLast}
                  className={`flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 md:px-2 py-0.5 rounded-md transition-colors whitespace-nowrap ${
                    isLast
                      ? "text-slate-800 font-medium cursor-default"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                  }`}
                >
                  {idx === 0 && (
                    <Home className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                  )}
                  {idx === 1 && (
                    <Building2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                  )}
                  {idx === 2 && (
                    <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                  )}
                  {idx === 3 && (
                    <ClipboardCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                  )}
                  <span className="max-w-[60px] sm:max-w-[100px] md:max-w-none truncate">
                    {item.label}
                  </span>
                </button>
              </div>
            );
          })}
        </nav>
      )}

      {/* ════════════════════════════════════════════
          ROOT LEVEL
          ════════════════════════════════════════════ */}
      {navLevel === "root" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 md:gap-3">
            {[
              {
                bg: "bg-amber-50",
                icon: ClipboardCheck,
                iconColor: "text-amber-600",
                value: pendingNominations.length,
                label: "Pending Scrutiny",
              },
              {
                bg: "bg-cyan-50",
                icon: Clock,
                iconColor: "text-cyan-600",
                value: pendingNominations.filter((n) => n.status === "RECEIVED")
                  .length,
                label: "Awaiting Review",
              },
              {
                bg: "bg-orange-50",
                icon: Eye,
                iconColor: "text-orange-600",
                value: pendingNominations.filter(
                  (n) => n.status === "UNDER_SCRUTINY",
                ).length,
                label: "In Progress",
              },
              {
                bg: "bg-blue-50",
                icon: Building2,
                iconColor: "text-blue-600",
                value: ulbGroups.filter((u) => ulbPendingCounts[u.id] > 0)
                  .length,
                label: "ULBs with Pending",
              },
            ].map((stat, i) => (
              <Card
                key={i}
                className={`${stat.bg} border-0 shadow-sm rounded-xl`}
              >
                <CardContent className="p-2 sm:p-2.5 md:p-4">
                  <stat.icon
                    className={`h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 ${stat.iconColor}`}
                  />
                  <p className="text-base sm:text-lg md:text-2xl font-bold text-slate-800 mt-1 md:mt-2">
                    {stat.value}
                  </p>
                  <p className="text-[8px] sm:text-[9px] md:text-xs text-slate-500 mt-0.5">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] md:text-xs text-slate-400 px-1">
            <MousePointerClick className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
            <span>Double-click / Double-tap to open folders</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-2 md:gap-4">
            {ulbGroups.map((ulb) => {
              const count = ulbPendingCounts[ulb.id] || 0;
              const isTapped = tappedFolderId === `ulb-${ulb.id}`;
              return (
                <Card
                  key={ulb.id}
                  className={`cursor-pointer select-none touch-manipulation transition-all duration-200 group rounded-xl
                    ${isTapped ? "ring-2 ring-amber-400 shadow-lg shadow-amber-100/60 scale-[1.03]" : "ring-1 ring-transparent hover:ring-slate-200 hover:shadow-md"}`}
                  onClick={() =>
                    handleFolderDoubleClick(`ulb-${ulb.id}`, () =>
                      navigateToUlb(ulb),
                    )
                  }
                >
                  <CardContent className="p-2.5 sm:p-3 md:p-5 flex flex-col items-center text-center gap-1 sm:gap-1.5 md:gap-2">
                    <div
                      className={`relative transition-transform duration-200 ${isTapped ? "scale-110" : "group-hover:scale-105"}`}
                    >
                      <FolderIcon
                        className="w-12 sm:w-14 md:w-20 drop-shadow-[0_2px_4px_rgba(0,0,0,0.10)]"
                        variant="amber"
                      />
                      {count > 0 && (
                        <span className="absolute -top-1.5 -right-2 sm:-top-2 sm:-right-2.5 bg-amber-600 text-white text-[7px] sm:text-[8px] md:text-[10px] font-bold rounded-full min-w-[16px] sm:min-w-[18px] md:min-w-[22px] h-4 sm:h-[18px] md:h-[22px] flex items-center justify-center px-1 shadow-sm">
                          {count}
                        </span>
                      )}
                    </div>
                    <div className="space-y-0 sm:space-y-0.5 min-w-0 w-full">
                      <p className="font-semibold text-[9px] sm:text-[10px] md:text-sm text-slate-800 leading-tight line-clamp-2">
                        {ulb.name}
                      </p>
                      <p className="text-[7px] sm:text-[8px] md:text-xs text-slate-400">
                        {ulb.wards.length} Wards
                      </p>
                    </div>
                    {isTapped && (
                      <p className="text-[7px] sm:text-[8px] md:text-[10px] text-amber-600 font-medium animate-pulse">
                        Tap again to open
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {ulbGroups.length === 0 && !isLoading && (
            <Card className="border-0 shadow-sm rounded-xl">
              <CardContent className="py-8 sm:py-12 md:py-16 flex flex-col items-center gap-2 sm:gap-3">
                <FolderIcon
                  className="w-16 sm:w-20 md:w-28 opacity-30"
                  variant="amber"
                />
                <p className="text-xs sm:text-sm text-slate-500">
                  No municipal bodies found
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════
          ULB LEVEL
          ════════════════════════════════════════════ */}
      {navLevel === "ulb" && selectedUlb && (
        <>
          <Card className="border-0 shadow-sm bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
            <CardContent className="p-2 sm:p-3 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 md:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/60 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-amber-600" />
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 md:gap-4">
                  {[
                    { label: "Code", value: selectedUlb.code },
                    { label: "Type", value: formatUlbType(selectedUlb.type) },
                    { label: "District", value: selectedUlb.districtName },
                    {
                      label: "Pending Scrutiny",
                      value: ulbPendingCounts[selectedUlb.id] || 0,
                    },
                  ].map((item, i) => (
                    <div key={i}>
                      <p className="text-[8px] sm:text-[9px] md:text-[11px] text-slate-500 uppercase tracking-wider">
                        {item.label}
                      </p>
                      <p className="font-semibold text-[10px] sm:text-xs md:text-sm text-slate-800 truncate">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] md:text-xs text-slate-400 px-1">
            <MousePointerClick className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
            <span>Double-click / Double-tap to open folders</span>
          </div>

          <div>
            <h2 className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-600 mb-1.5 sm:mb-2 md:mb-3">
              Wards ({selectedUlb.wards.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-2 md:gap-4">
              {selectedUlb.wards.map((ward) => {
                const count = wardPendingCounts[ward.id] || 0;
                const isTapped = tappedFolderId === `ward-${ward.id}`;
                return (
                  <Card
                    key={ward.id}
                    className={`cursor-pointer select-none touch-manipulation transition-all duration-200 group rounded-xl
                      ${isTapped ? "ring-2 ring-amber-400 shadow-lg shadow-amber-100/60 scale-[1.03]" : "ring-1 ring-transparent hover:ring-slate-200 hover:shadow-md"}`}
                    onClick={() =>
                      handleFolderDoubleClick(`ward-${ward.id}`, () =>
                        navigateToWard(ward),
                      )
                    }
                  >
                    <CardContent className="p-2.5 sm:p-3 md:p-5 flex flex-col items-center text-center gap-1 sm:gap-1.5 md:gap-2">
                      <div
                        className={`relative transition-transform duration-200 ${isTapped ? "scale-110" : "group-hover:scale-105"}`}
                      >
                        <FolderIcon
                          className="w-12 sm:w-14 md:w-20 drop-shadow-[0_2px_4px_rgba(0,0,0,0.10)]"
                          variant="amber"
                        />
                        {count > 0 && (
                          <span className="absolute -top-1.5 -right-2 sm:-top-2 sm:-right-2.5 bg-orange-600 text-white text-[7px] sm:text-[8px] md:text-[10px] font-bold rounded-full min-w-[16px] sm:min-w-[18px] md:min-w-[22px] h-4 sm:h-[18px] md:h-[22px] flex items-center justify-center px-1 shadow-sm">
                            {count}
                          </span>
                        )}
                      </div>
                      <div className="space-y-0 sm:space-y-0.5 min-w-0 w-full">
                        <p className="font-bold text-[9px] sm:text-[10px] md:text-sm text-slate-800">
                          Ward {ward.wardNo}
                        </p>
                        <p className="text-[7px] sm:text-[8px] md:text-xs text-slate-500 line-clamp-1">
                          {ward.wardName}
                        </p>
                        {ward.reservationType && (
                          <Badge
                            variant="outline"
                            className="mt-0 sm:mt-0.5 text-[6px] sm:text-[7px] md:text-[10px] px-0.5 sm:px-1 py-0 h-3.5 sm:h-4"
                          >
                            {ward.reservationType.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                      {isTapped && (
                        <p className="text-[7px] sm:text-[8px] md:text-[10px] text-amber-600 font-medium animate-pulse">
                          Tap again to open
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════
          WARD LEVEL
          ════════════════════════════════════════════ */}
      {navLevel === "ward" && selectedWardNav && selectedUlb && (
        <>
          <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl">
            <CardContent className="p-2 sm:p-3 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 md:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/60 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-orange-600" />
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 md:gap-4">
                  <div>
                    <p className="text-[8px] sm:text-[9px] md:text-[11px] text-slate-500 uppercase tracking-wider">
                      Ward No
                    </p>
                    <p className="font-semibold text-[10px] sm:text-xs md:text-sm text-slate-800">
                      {selectedWardNav.wardNo}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] sm:text-[9px] md:text-[11px] text-slate-500 uppercase tracking-wider">
                      Name
                    </p>
                    <p className="font-semibold text-[10px] sm:text-xs md:text-sm text-slate-800 truncate">
                      {selectedWardNav.wardName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] sm:text-[9px] md:text-[11px] text-slate-500 uppercase tracking-wider">
                      Reservation
                    </p>
                    <Badge
                      variant="outline"
                      className="mt-0.5 text-[8px] sm:text-[9px] md:text-xs"
                    >
                      {(selectedWardNav.reservationType || "N/A").replace(
                        /_/g,
                        " ",
                      )}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[8px] sm:text-[9px] md:text-[11px] text-slate-500 uppercase tracking-wider">
                      Pending Scrutiny
                    </p>
                    <p className="font-semibold text-[10px] sm:text-xs md:text-sm text-slate-800">
                      {wardPendingCounts[selectedWardNav.id] || 0}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] md:text-xs text-slate-400 px-1">
            <MousePointerClick className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
            <span>Double-click / Double-tap to open</span>
          </div>

          <div>
            <h2 className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-600 mb-1.5 sm:mb-2 md:mb-3">
              Contents
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2 md:gap-4">
              {(() => {
                const isTapped = tappedFolderId === "scrutiny-queue";
                const count = wardPendingCounts[selectedWardNav.id] || 0;
                return (
                  <Card
                    className={`cursor-pointer select-none touch-manipulation transition-all duration-200 group rounded-xl
                      ${isTapped ? "ring-2 ring-amber-400 shadow-lg shadow-amber-100/60 scale-[1.03]" : "ring-1 ring-transparent hover:ring-slate-200 hover:shadow-md"}`}
                    onClick={() =>
                      handleFolderDoubleClick(
                        "scrutiny-queue",
                        navigateToApplications,
                      )
                    }
                  >
                    <CardContent className="p-2.5 sm:p-3 md:p-5 flex flex-col items-center text-center gap-1 sm:gap-1.5 md:gap-2">
                      <div
                        className={`relative transition-transform duration-200 ${isTapped ? "scale-110" : "group-hover:scale-105"}`}
                      >
                        <FolderIcon
                          className="w-12 sm:w-14 md:w-20 drop-shadow-[0_2px_4px_rgba(0,0,0,0.10)]"
                          variant="green"
                        />
                        {count > 0 && (
                          <span className="absolute -top-1.5 -right-2 sm:-top-2 sm:-right-2.5 bg-emerald-600 text-white text-[7px] sm:text-[8px] md:text-[10px] font-bold rounded-full min-w-[16px] sm:min-w-[18px] md:min-w-[22px] h-4 sm:h-[18px] md:h-[22px] flex items-center justify-center px-1 shadow-sm">
                            {count}
                          </span>
                        )}
                      </div>
                      <div className="space-y-0 sm:space-y-0.5">
                        <p className="font-semibold text-[9px] sm:text-[10px] md:text-sm text-slate-800">
                          Scrutiny Queue
                        </p>
                        <p className="text-[7px] sm:text-[8px] md:text-xs text-slate-400">
                          {count} Pending
                        </p>
                      </div>
                      {isTapped && (
                        <p className="text-[7px] sm:text-[8px] md:text-[10px] text-emerald-600 font-medium animate-pulse">
                          Tap again to open
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════
          APPLICATIONS LEVEL
          ════════════════════════════════════════════════════════════════ */}
      {navLevel === "applications" && selectedWardNav && (
        <div className="space-y-3 sm:space-y-4 md:space-y-5">
          {/* ── Overview Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5 md:gap-3">
            {[
              {
                label: "All Pending",
                value:
                  (statusStats["RECEIVED"] || 0) +
                  (statusStats["UNDER_SCRUTINY"] || 0),
                icon: ClipboardCheck,
                color: "text-slate-600",
                bg: "bg-slate-100",
                ring: "ring-slate-300",
                iconBg: "bg-slate-200",
                active: statusFilter === "pending",
                filter: "pending",
              },
              {
                label: "Awaiting",
                value: statusStats["RECEIVED"] || 0,
                icon: Clock,
                color: "text-cyan-600",
                bg: "bg-cyan-50",
                ring: "ring-cyan-300",
                iconBg: "bg-cyan-100",
                active: statusFilter === "RECEIVED",
                filter: "RECEIVED",
              },
              {
                label: "In Progress",
                value: statusStats["UNDER_SCRUTINY"] || 0,
                icon: Eye,
                color: "text-amber-600",
                bg: "bg-amber-50",
                ring: "ring-amber-300",
                iconBg: "bg-amber-100",
                active: statusFilter === "UNDER_SCRUTINY",
                filter: "UNDER_SCRUTINY",
              },
              {
                label: "Completed",
                value:
                  (statusStats["ACCEPTED"] || 0) +
                  (statusStats["REJECTED"] || 0),
                icon: CheckCircle,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
                ring: "ring-emerald-300",
                iconBg: "bg-emerald-100",
                active: statusFilter === "all",
                filter: "all",
              },
            ].map((s, i) => (
              <button
                key={i}
                onClick={() => setStatusFilter(s.filter)}
                className={`relative rounded-2xl p-3 sm:p-3.5 md:p-4 text-left transition-all duration-200
                  ${s.active ? `${s.bg} ring-2 ${s.ring} shadow-md` : `bg-white ring-1 ring-slate-100 hover:ring-slate-200 hover:shadow-sm active:scale-[0.97]`}`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 md:block">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl ${s.iconBg} flex items-center justify-center shrink-0 md:mb-2`}
                  >
                    <s.icon className={`h-4 w-4 md:h-5 md:w-5 ${s.color}`} />
                  </div>
                  <div className="flex-1 md:flex-none">
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 leading-none">
                      {s.value}
                    </p>
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 mt-0.5 font-medium">
                      {s.label}
                    </p>
                  </div>
                </div>
                {s.active && (
                  <div
                    className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full ${s.color.replace("text-", "bg-")} opacity-40`}
                  />
                )}
              </button>
            ))}
          </div>

          {/* ── Search & Filter ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 md:gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Search name, app no, or phone…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 text-sm bg-white rounded-xl border-slate-200 focus-visible:ring-slate-300"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] md:w-[180px] h-10 text-sm rounded-xl border-slate-200">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <SelectValue placeholder="Filter" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending Scrutiny</SelectItem>
                <SelectItem value="RECEIVED">Awaiting Review</SelectItem>
                <SelectItem value="UNDER_SCRUTINY">In Progress</SelectItem>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ── Results count ── */}
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[10px] sm:text-xs text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-600">
                {currentNominations.length}
              </span>{" "}
              applications
            </p>
            {(searchQuery || statusFilter !== "pending") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("pending");
                }}
                className="text-[10px] sm:text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-amber-500" />
              </div>
              <p className="text-sm font-medium text-slate-700">
                Something went wrong
              </p>
              <p className="text-xs text-slate-400">{error}</p>
              <Button
                onClick={fetchNominations}
                variant="outline"
                size="sm"
                className="text-xs rounded-lg"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Retry
              </Button>
            </div>
          )}

          {/* ── Empty ── */}
          {!error && currentNominations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
                <ClipboardCheck className="h-8 w-8 text-amber-300" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                No applications to review
              </p>
              <p className="text-xs text-slate-400">
                {searchQuery || statusFilter !== "pending"
                  ? "Try adjusting your search or filters"
                  : "All caught up — no pending scrutiny for this ward"}
              </p>
            </div>
          )}

          {/* ── Desktop Table ── */}
          {!error && currentNominations.length > 0 && (
            <div className="hidden md:block bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-5">
                      Candidate
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Application
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Party
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Submitted
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right pr-5">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentNominations.map((n, idx) => (
                    <TableRow
                      key={n.id}
                      className={`group transition-colors hover:bg-slate-50/60 ${idx !== currentNominations.length - 1 ? "border-b border-slate-100" : ""}`}
                    >
                      <TableCell className="pl-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm">
                            <span className="text-sm font-bold text-amber-700">
                              {(n.candidateName || "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-800 truncate">
                              {n.candidateName ||
                                n.applicantProfile?.user?.name ||
                                "N/A"}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3 text-slate-300" />
                              <span className="text-[11px] text-slate-400">
                                {n.applicantProfile?.user?.phone || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Hash className="h-3 w-3 text-slate-300" />
                          <span className="font-mono text-xs text-slate-600">
                            {n.applicationNo}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        {n.politicalParty ? (
                          <div className="flex items-center gap-1.5">
                            <Shield className="h-3 w-3 text-slate-400" />
                            <span className="text-xs font-medium text-slate-600">
                              {n.politicalParty.abbreviation ||
                                n.politicalParty.shortName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Independent
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5">
                        {getStatusBadge(n.status)}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-slate-300" />
                          <span className="text-xs text-slate-500">
                            {new Date(n.submittedAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-5 py-3.5">
                        <div className="flex items-center justify-end">
                          {SCRUTINY_STATUSES.includes(n.status) ? (
                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm shadow-amber-200"
                              onClick={() => handleStartScrutiny(n)}
                            >
                              <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                              {n.status === "UNDER_SCRUTINY"
                                ? "Continue"
                                : "Review"}
                            </Button>
                          ) : (
                            <Badge
                              className={
                                n.status === "ACCEPTED"
                                  ? "bg-emerald-100 text-emerald-700 border-0"
                                  : "bg-red-100 text-red-700 border-0"
                              }
                            >
                              {n.status === "ACCEPTED" ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              {n.status === "ACCEPTED"
                                ? "Accepted"
                                : "Rejected"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* ── Mobile Cards ── */}
          {!error && currentNominations.length > 0 && (
            <div className="md:hidden space-y-2.5">
              {currentNominations.map((n) => (
                <div
                  key={n.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-3.5 sm:p-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm">
                      <span className="text-base sm:text-lg font-bold text-amber-700">
                        {(n.candidateName || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13px] sm:text-sm text-slate-800 truncate leading-tight">
                        {n.candidateName ||
                          n.applicantProfile?.user?.name ||
                          "N/A"}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Hash className="h-2.5 w-2.5 text-slate-300" />
                        <span className="font-mono text-[10px] sm:text-[11px] text-slate-500">
                          {n.applicationNo}
                        </span>
                      </div>
                      <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 mt-1.5">
                        {getStatusBadge(n.status)}
                        <span className="text-[10px] sm:text-[11px] text-slate-400">
                          {n.politicalParty
                            ? n.politicalParty.abbreviation ||
                              n.politicalParty.shortName
                            : "Independent"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="px-3.5 sm:px-4 pb-2 flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-slate-300" />
                      <span className="text-[10px] sm:text-[11px] text-slate-500">
                        {n.applicantProfile?.user?.phone || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-slate-300" />
                      <span className="text-[10px] sm:text-[11px] text-slate-500">
                        {new Date(n.submittedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 bg-slate-50/60 px-2.5 sm:px-3 py-2 sm:py-2.5 flex items-center gap-2">
                    {SCRUTINY_STATUSES.includes(n.status) ? (
                      <Button
                        size="sm"
                        className="flex-1 h-9 text-[11px] sm:text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm font-medium"
                        onClick={() => handleStartScrutiny(n)}
                      >
                        <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                        {n.status === "UNDER_SCRUTINY"
                          ? "Continue Review"
                          : "Start Review"}
                      </Button>
                    ) : (
                      <div className="flex-1 flex items-center justify-center h-9">
                        <Badge
                          className={
                            n.status === "ACCEPTED"
                              ? "bg-emerald-100 text-emerald-700 border-0"
                              : "bg-red-100 text-red-700 border-0"
                          }
                        >
                          {n.status === "ACCEPTED" ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {n.status === "ACCEPTED" ? "Accepted" : "Rejected"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════
          SCRUTINY DIALOG
          ════════════════════════════════════════════ */}
      <Dialog
        open={isScrutinyDialogOpen}
        onOpenChange={setIsScrutinyDialogOpen}
      >
        <DialogContent className="sm:max-w-[720px] max-h-[92vh] overflow-y-auto w-[96vw] rounded-2xl p-0 gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Scrutiny Review</DialogTitle>
            <DialogDescription>
              Reviewing nomination {selectedNomination?.applicationNo}
            </DialogDescription>
          </DialogHeader>

          {selectedNomination && otpStep === "decision" && (
            <div className="divide-y divide-slate-100">
              {/* ── Hero ── */}
              <div className="relative bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-yellow-50/30 p-4 sm:p-5 md:p-6 pt-10 sm:pt-5">
                <Badge className="absolute top-2.5 right-12 sm:top-4 sm:right-14 z-10 text-[9px] sm:text-[10px] bg-amber-100 text-amber-700 border-0 hover:bg-amber-100">
                  <Eye className="h-3 w-3 mr-1" />
                  Under Scrutiny
                </Badge>
                <div className="flex items-start gap-3 sm:gap-4 pr-20 sm:pr-28">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-200/50">
                    <span className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                      {(selectedNomination.candidateName || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 truncate leading-tight">
                      {selectedNomination.candidateName ||
                        selectedNomination.applicantProfile?.user?.name}
                    </h3>
                    {selectedNomination.fatherHusbandName && (
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
                        S/o, D/o, W/o{" "}
                        <span className="font-medium text-slate-600">
                          {selectedNomination.fatherHusbandName}
                        </span>
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Hash className="h-3 w-3 text-slate-400" />
                      <span className="font-mono text-[10px] sm:text-xs text-slate-500">
                        {selectedNomination.applicationNo}
                      </span>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px] sm:text-xs text-slate-500">
                          Ward {selectedNomination.ward.wardNo}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px] sm:text-xs text-slate-500">
                          {selectedNomination.politicalParty
                            ? selectedNomination.politicalParty.abbreviation ||
                              selectedNomination.politicalParty.name
                            : "Independent"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Tabs ── */}
              <div className="p-4 sm:p-5 md:p-6">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-9 sm:h-10 rounded-xl bg-slate-100">
                    <TabsTrigger
                      value="overview"
                      className="text-[10px] sm:text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="documents"
                      className="text-[10px] sm:text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                      Documents
                      {selectedNomination.documents &&
                        selectedNomination.documents.length > 0 && (
                          <span className="ml-1 text-[8px] bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5">
                            {selectedNomination.documents.length}
                          </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="symbols"
                      className="text-[10px] sm:text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                      Symbols
                    </TabsTrigger>
                  </TabsList>

                  {/* ─── Overview Tab ─── */}
                  <TabsContent value="overview" className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                      <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-2.5 sm:p-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <Phone className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider font-medium">
                            Phone
                          </p>
                          <p className="text-[11px] sm:text-xs font-semibold text-slate-700 truncate">
                            {selectedNomination.applicantProfile?.user?.phone ||
                              "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-2.5 sm:p-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                          <Calendar className="h-3.5 w-3.5 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider font-medium">
                            {selectedNomination.dateOfBirth ? "DOB" : "Age"}
                          </p>
                          <p className="text-[11px] sm:text-xs font-semibold text-slate-700">
                            {selectedNomination.dateOfBirth
                              ? new Date(
                                  selectedNomination.dateOfBirth,
                                ).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : selectedNomination.age
                                ? `${selectedNomination.age} years`
                                : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-2.5 sm:p-3">
                        <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-pink-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider font-medium">
                            Gender
                          </p>
                          <p className="text-[11px] sm:text-xs font-semibold text-slate-700">
                            {selectedNomination.gender
                              ? selectedNomination.gender.charAt(0) +
                                selectedNomination.gender.slice(1).toLowerCase()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-2.5 sm:p-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                          <UserCheck className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider font-medium">
                            Category
                          </p>
                          <p className="text-[11px] sm:text-xs font-semibold text-slate-700">
                            {selectedNomination.category?.replace(/_/g, " ") ||
                              "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Ward & Party details */}
                    <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 rounded-2xl border border-indigo-100/60 overflow-hidden">
                      <div className="flex items-center gap-3 p-3.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                          <MapPin className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] text-indigo-400 uppercase tracking-wider font-medium">
                            Ward
                          </p>
                          <p className="text-xs font-semibold text-slate-800">
                            Ward {selectedNomination.ward.wardNo} –{" "}
                            {selectedNomination.ward.wardName}
                          </p>
                          {selectedNomination.ward.reservationType && (
                            <Badge
                              variant="outline"
                              className="mt-1 text-[8px] h-5 border-indigo-200 text-indigo-600 bg-white/50"
                            >
                              {selectedNomination.ward.reservationType.replace(
                                /_/g,
                                " ",
                              )}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mx-4 border-t border-indigo-100/80" />
                      <div className="flex items-center gap-3 p-3.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${selectedNomination.politicalParty ? "bg-violet-100" : "bg-gray-100"}`}
                        >
                          <Shield
                            className={`h-4 w-4 ${selectedNomination.politicalParty ? "text-violet-600" : "text-gray-400"}`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] text-indigo-400 uppercase tracking-wider font-medium">
                            Political Party
                          </p>
                          {selectedNomination.politicalParty ? (
                            <div className="flex items-center gap-2 flex-wrap mt-0.5">
                              <p className="text-xs font-semibold text-slate-800">
                                {selectedNomination.politicalParty.name}
                              </p>
                              <Badge className="text-[8px] h-5 bg-violet-100 text-violet-700 border-0 hover:bg-violet-100">
                                {selectedNomination.politicalParty.abbreviation}
                              </Badge>
                            </div>
                          ) : (
                            <p className="text-xs font-semibold text-slate-600 mt-0.5">
                              Independent Candidate
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {selectedNomination.address && (
                      <div className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-2.5 sm:p-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider font-medium">
                            Address
                          </p>
                          <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed mt-0.5">
                            {selectedNomination.address}
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* ─── Documents Tab ─── */}
                  <TabsContent value="documents" className="mt-4">
                    {selectedNomination.documents &&
                    selectedNomination.documents.length > 0 ? (
                      <div className="space-y-2">
                        {selectedNomination.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 sm:p-3 gap-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                <FileText className="h-3.5 w-3.5 text-blue-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] sm:text-xs font-medium text-slate-700 truncate">
                                  {doc.type.replace(/_/g, " ")}
                                </p>
                                <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                                  {doc.originalName || doc.fileName}
                                </p>
                              </div>
                            </div>
                            {doc.storagePath ? (
                              <a
                                href={doc.storagePath}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 sm:h-8 text-[10px] sm:text-xs shrink-0 rounded-lg"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </a>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[9px] sm:text-[10px] text-slate-400 shrink-0"
                              >
                                No File
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-8 bg-slate-50 rounded-xl">
                        <FileText className="h-8 w-8 text-slate-200 mb-2" />
                        <p className="text-[11px] sm:text-xs text-slate-400">
                          No documents uploaded
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  {/* ─── Symbols Tab ─── */}
                  <TabsContent value="symbols" className="mt-4 space-y-4">
                    {/* Candidate Preferences */}
                    {selectedNomination.symbolPreferences &&
                      selectedNomination.symbolPreferences.length > 0 && (
                        <div>
                          <Label className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            Candidate&apos;s Preferences
                          </Label>
                          <div className="grid grid-cols-3 gap-2.5 mt-2">
                            {selectedNomination.symbolPreferences
                              .sort(
                                (a, b) => a.preferenceOrder - b.preferenceOrder,
                              )
                              .map((pref) => {
                                const allocStatus = availableSymbols.find(
                                  (s) => s.id === pref.symbol.id,
                                );
                                const isAllocated =
                                  allocStatus?.isAllocated ?? false;
                                return (
                                  <div
                                    key={pref.symbol.id}
                                    className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all cursor-pointer ${
                                      isAllocated
                                        ? "border-red-200 bg-red-50 opacity-50 cursor-not-allowed"
                                        : selectedSymbolId === pref.symbol.id
                                          ? "border-amber-500 bg-amber-50 shadow-sm"
                                          : "border-slate-200 hover:border-slate-300"
                                    }`}
                                    onClick={() => {
                                      if (!isAllocated)
                                        setSelectedSymbolId(pref.symbol.id);
                                    }}
                                  >
                                    <div className="flex items-center gap-1 mb-1.5">
                                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                      <span className="text-[8px] sm:text-[9px] text-amber-600 font-medium">
                                        Choice {pref.preferenceOrder}
                                      </span>
                                    </div>
                                    {pref.symbol.imagePath ? (
                                      <img
                                        src={pref.symbol.imagePath}
                                        alt={pref.symbol.name}
                                        className="w-10 h-10 object-contain mx-auto"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mx-auto">
                                        <ImageIcon className="h-5 w-5 text-slate-400" />
                                      </div>
                                    )}
                                    <p className="text-[10px] sm:text-xs font-medium text-center mt-1.5 truncate">
                                      {pref.symbol.name}
                                    </p>
                                    {isAllocated && (
                                      <Badge className="text-[8px] mt-1 mx-auto block w-fit bg-red-100 text-red-600 border-0">
                                        Taken
                                      </Badge>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                    {/* All Available Symbols */}
                    <div>
                      <Label className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        Available Symbols
                      </Label>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">
                        Select a symbol to allocate upon acceptance
                      </p>
                      {isLoadingSymbols ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-2.5 max-h-[240px] overflow-y-auto pr-1">
                          {availableSymbols
                            .filter((s) => s.isActive !== false)
                            .map((symbol) => (
                              <div
                                key={symbol.id}
                                className={`p-2 sm:p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                                  symbol.isAllocated
                                    ? "border-red-200 bg-red-50 opacity-50 cursor-not-allowed"
                                    : selectedSymbolId === symbol.id
                                      ? "border-amber-500 bg-amber-50 shadow-sm"
                                      : symbol.isPreferred
                                        ? "border-amber-300 bg-amber-50/50 hover:border-amber-400"
                                        : "border-slate-200 hover:border-slate-300"
                                }`}
                                onClick={() => {
                                  if (!symbol.isAllocated)
                                    setSelectedSymbolId(symbol.id);
                                }}
                              >
                                {symbol.isPreferred && (
                                  <div className="flex items-center gap-0.5 mb-1">
                                    <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                                    <span className="text-[7px] sm:text-[8px] text-amber-600 font-medium">
                                      Pref {symbol.preferenceOrder}
                                    </span>
                                  </div>
                                )}
                                {symbol.imagePath ? (
                                  <img
                                    src={symbol.imagePath}
                                    alt={symbol.name}
                                    className="w-8 h-8 object-contain mx-auto"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center mx-auto">
                                    <ImageIcon className="h-4 w-4 text-slate-400" />
                                  </div>
                                )}
                                <p className="text-[8px] sm:text-[10px] font-medium text-center mt-1.5 truncate">
                                  {symbol.name}
                                </p>
                                {symbol.isAllocated && (
                                  <Badge className="text-[7px] mt-1 mx-auto block w-fit bg-red-100 text-red-600 border-0">
                                    Taken
                                  </Badge>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {selectedSymbolId && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-amber-600 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-amber-800">
                            Selected:{" "}
                            {availableSymbols.find(
                              (s) => s.id === selectedSymbolId,
                            )?.name ||
                              selectedNomination.symbolPreferences?.find(
                                (p) => p.symbol.id === selectedSymbolId,
                              )?.symbol.name ||
                              "Selected"}
                          </p>
                          <p className="text-[10px] text-amber-600">
                            Will be allocated upon acceptance
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* ── Decision Section ── */}
              <div className="p-4 sm:p-5 md:p-6">
                <h4 className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  Scrutiny Decision
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    className={`flex flex-col items-center gap-2 p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 ${
                      decision === "ACCEPTED"
                        ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100"
                        : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 active:scale-[0.98]"
                    }`}
                    onClick={() => setDecision("ACCEPTED")}
                  >
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                        decision === "ACCEPTED"
                          ? "bg-emerald-500"
                          : "bg-emerald-100"
                      }`}
                    >
                      <FileCheck
                        className={`h-5 w-5 sm:h-6 sm:w-6 ${decision === "ACCEPTED" ? "text-white" : "text-emerald-600"}`}
                      />
                    </div>
                    <span
                      className={`text-sm sm:text-base font-semibold ${decision === "ACCEPTED" ? "text-emerald-700" : "text-slate-600"}`}
                    >
                      Accept
                    </span>
                  </button>
                  <button
                    className={`flex flex-col items-center gap-2 p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 ${
                      decision === "REJECTED"
                        ? "border-red-500 bg-red-50 shadow-md shadow-red-100"
                        : "border-slate-200 hover:border-red-300 hover:bg-red-50/50 active:scale-[0.98]"
                    }`}
                    onClick={() => setDecision("REJECTED")}
                  >
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                        decision === "REJECTED" ? "bg-red-500" : "bg-red-100"
                      }`}
                    >
                      <FileX
                        className={`h-5 w-5 sm:h-6 sm:w-6 ${decision === "REJECTED" ? "text-white" : "text-red-600"}`}
                      />
                    </div>
                    <span
                      className={`text-sm sm:text-base font-semibold ${decision === "REJECTED" ? "text-red-700" : "text-slate-600"}`}
                    >
                      Reject
                    </span>
                  </button>
                </div>

                {/* Rejection remarks */}
                {decision === "REJECTED" && (
                  <div className="mt-3">
                    <Label className="text-[10px] sm:text-xs text-slate-500">
                      Rejection Remarks (optional)
                    </Label>
                    <Textarea
                      placeholder="State the reason for rejection…"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="mt-1.5 text-sm rounded-xl resize-none h-20"
                    />
                  </div>
                )}

                {/* Decision summary */}
                {decision && (
                  <div
                    className={`mt-3 p-3 rounded-xl border flex items-start gap-2.5 ${
                      decision === "ACCEPTED"
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    {decision === "ACCEPTED" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p
                        className={`text-xs font-medium ${decision === "ACCEPTED" ? "text-emerald-800" : "text-red-800"}`}
                      >
                        {decision === "ACCEPTED"
                          ? "Nomination will be accepted"
                          : "Nomination will be rejected"}
                      </p>
                      {decision === "ACCEPTED" && selectedSymbolId && (
                        <p className="text-[10px] text-emerald-600 mt-0.5">
                          Symbol:{" "}
                          {availableSymbols.find(
                            (s) => s.id === selectedSymbolId,
                          )?.name || "Selected"}
                        </p>
                      )}
                      {decision === "ACCEPTED" && !selectedSymbolId && (
                        <p className="text-[10px] text-amber-600 mt-0.5">
                          No symbol selected — go to Symbols tab to allocate
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {otpError && otpStep === "decision" && (
                  <p className="text-xs text-red-600 mt-2">{otpError}</p>
                )}
              </div>

              {/* ── Footer ── */}
              <div className="p-4 sm:p-5 md:p-6 bg-slate-50/80 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsScrutinyDialogOpen(false)}
                  className="h-9 text-xs rounded-xl"
                >
                  Close
                </Button>
                <Button
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || !decision}
                  className={`h-9 text-xs rounded-xl shadow-sm ${
                    decision === "ACCEPTED"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : decision === "REJECTED"
                        ? "bg-red-600 hover:bg-red-700"
                        : ""
                  }`}
                >
                  {isSendingOtp ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Send OTP & Proceed
                </Button>
              </div>
            </div>
          )}

          {/* ── OTP Step ── */}
          {selectedNomination && otpStep === "otp" && (
            <div className="divide-y divide-slate-100">
              <div className="p-4 sm:p-5 md:p-6">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
                  Confirm Your Decision
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  Enter the OTP sent to your registered phone to authorize this
                  action
                </p>
              </div>

              <div className="p-4 sm:p-5 md:p-6 space-y-4">
                {/* Summary card */}
                <div
                  className={`p-3.5 rounded-xl border ${
                    decision === "ACCEPTED"
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {decision === "ACCEPTED" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={`text-xs font-semibold ${decision === "ACCEPTED" ? "text-emerald-800" : "text-red-800"}`}
                    >
                      {decision === "ACCEPTED" ? "Accepting" : "Rejecting"}{" "}
                      nomination
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-[10px] sm:text-xs text-slate-600">
                    <p>
                      <span className="text-slate-400">Candidate:</span>{" "}
                      {selectedNomination.candidateName}
                    </p>
                    <p>
                      <span className="text-slate-400">Application:</span>{" "}
                      {selectedNomination.applicationNo}
                    </p>
                    {decision === "ACCEPTED" && selectedSymbolId && (
                      <p>
                        <span className="text-slate-400">Symbol:</span>{" "}
                        {availableSymbols.find((s) => s.id === selectedSymbolId)
                          ?.name || "Selected"}
                      </p>
                    )}
                  </div>
                </div>

                {/* OTP Input */}
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                    <Phone className="h-3.5 w-3.5 text-blue-600" />
                    <p className="text-[10px] sm:text-xs text-blue-700">
                      OTP sent to your registered phone number
                    </p>
                  </div>
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  {otpError && (
                    <p className="text-[10px] sm:text-xs text-red-600">
                      {otpError}
                    </p>
                  )}
                  <Button
                    variant="link"
                    size="sm"
                    className="text-[10px] sm:text-xs"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                  >
                    {isSendingOtp ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    Resend OTP
                  </Button>
                </div>
              </div>

              <div className="p-4 sm:p-5 md:p-6 bg-slate-50/80 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOtpStep("decision");
                    setOtp("");
                    setOtpError("");
                  }}
                  className="h-9 text-xs rounded-xl"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmitScrutiny}
                  disabled={isSubmitting || otp.length !== 6}
                  className={`h-9 text-xs rounded-xl shadow-sm ${
                    decision === "ACCEPTED"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isSubmitting && (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  )}
                  {decision === "ACCEPTED" ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Confirm Approval
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Confirm Rejection
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

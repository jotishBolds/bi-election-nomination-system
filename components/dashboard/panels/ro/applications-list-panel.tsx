"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Ban,
  Phone,
  Mail,
  Building,
  Download,
  CheckCheck,
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
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadForm18PDF } from "@/lib/form18-template";

/* ───────────────────────────────────────────────
   Realistic Folder SVG Icon
   ─────────────────────────────────────────────── */
const FolderIcon = ({
  className,
  variant = "yellow",
}: {
  className?: string;
  variant?: "yellow" | "blue" | "green";
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

/* ───────── Types & helpers ───────── */

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
    district?: {
      id: string;
      code: string;
      name: string;
    };
  };
  _count?: {
    nominations: number;
  };
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

interface Nomination {
  id: string;
  applicationNo: string;
  candidateName: string;
  fatherHusbandName: string;
  address: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  category: string;
  status: string;
  submittedAt: string;
  scrutinyStatus?: string;
  scrutinyAt?: string;
  scrutinyRemarks?: string;
  paymentStatus?: string;
  applicantProfile?: {
    user: {
      id: string;
      name: string;
      phone: string;
      email?: string;
    };
  };
  ward: {
    id: string;
    wardNo: number;
    wardName: string;
    reservationType?: string;
    ulb?: {
      id?: string;
      name: string;
      district?: {
        name: string;
      };
    };
  };
  politicalParty?: {
    name: string;
    abbreviation: string;
  };
  allocatedSymbol?: {
    name: string;
    imagePath?: string;
  };
  symbolPreferences?: Array<{
    preferenceOrder: number;
    symbol: {
      id: string;
      name: string;
      imagePath?: string;
    };
  }>;
  documents?: Array<{
    id: string;
    type: string;
    fileName: string;
    originalName?: string;
    storagePath?: string;
  }>;
}

interface FolderHistoryState {
  appFolder: NavLevel;
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

/* ═══════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════ */

export function ApplicationsListPanel() {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [wards, setWards] = useState<WardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [navLevel, setNavLevel] = useState<NavLevel>("root");
  const [selectedUlb, setSelectedUlb] = useState<ULBGroup | null>(null);
  const [selectedWardNav, setSelectedWardNav] = useState<WardData | null>(null);

  const lastTapRef = useRef<{ id: string; time: number }>({
    id: "",
    time: 0,
  });
  const [tappedFolderId, setTappedFolderId] = useState<string | null>(null);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [selectedNomination, setSelectedNomination] =
    useState<Nomination | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [receiveNominationId, setReceiveNominationId] = useState<string | null>(
    null,
  );
  const [receiveOtp, setReceiveOtp] = useState("");
  const [receiveOtpError, setReceiveOtpError] = useState("");
  const [isSendingReceiveOtp, setIsSendingReceiveOtp] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [receiveOtpSent, setReceiveOtpSent] = useState(false);

  /* ───────── Computed data ───────── */

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

  /* ───────── History / popstate ───────── */

  const historyInitialized = useRef(false);
  useEffect(() => {
    if (!historyInitialized.current) {
      historyInitialized.current = true;
      window.history.replaceState(
        { appFolder: "root" } as FolderHistoryState,
        "",
      );
    }
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as FolderHistoryState | null;
      if (!state || !state.appFolder) return;
      const groups = ulbGroupsRef.current;

      switch (state.appFolder) {
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

  /* ───────── More computed data ───────── */

  const ulbNominationCounts = useMemo(() => {
    const wardToUlb: Record<string, string> = {};
    wards.forEach((w) => {
      if (w.ulb) wardToUlb[w.id] = w.ulb.id;
    });
    const counts: Record<string, number> = {};
    nominations.forEach((n) => {
      const ulbId = wardToUlb[n.ward.id];
      if (ulbId) counts[ulbId] = (counts[ulbId] || 0) + 1;
    });
    return counts;
  }, [nominations, wards]);

  const wardNominationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    nominations.forEach((n) => {
      counts[n.ward.id] = (counts[n.ward.id] || 0) + 1;
    });
    return counts;
  }, [nominations]);

  const currentNominations = useMemo(() => {
    let filtered = nominations;
    if (selectedWardNav) {
      filtered = filtered.filter((n) => n.ward.id === selectedWardNav.id);
    }
    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "PENDING") {
        filtered = filtered.filter(
          (n) => n.status === "SUBMITTED" || n.status === "RECEIVED",
        );
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

  const breadcrumbs = useMemo(() => {
    const items: { label: string; level: NavLevel }[] = [
      { label: "Home", level: "root" },
    ];
    if (selectedUlb && navLevel !== "root") {
      items.push({ label: selectedUlb.name, level: "ulb" });
    }
    if (
      selectedWardNav &&
      (navLevel === "ward" || navLevel === "applications")
    ) {
      items.push({
        label: `Ward ${selectedWardNav.wardNo} – ${selectedWardNav.wardName}`,
        level: "ward",
      });
    }
    if (navLevel === "applications") {
      items.push({ label: "Applications", level: "applications" });
    }
    return items;
  }, [navLevel, selectedUlb, selectedWardNav]);

  /* ───────── Navigation helpers ───────── */

  const navigateToUlb = (ulb: ULBGroup) => {
    setSelectedUlb(ulb);
    setNavLevel("ulb");
    setTappedFolderId(null);
    window.history.pushState(
      { appFolder: "ulb", ulbId: ulb.id } as FolderHistoryState,
      "",
    );
  };

  const navigateToWard = (ward: WardData) => {
    setSelectedWardNav(ward);
    setNavLevel("ward");
    setTappedFolderId(null);
    window.history.pushState(
      {
        appFolder: "ward",
        ulbId: selectedUlb?.id,
        wardId: ward.id,
      } as FolderHistoryState,
      "",
    );
  };

  const navigateToApplications = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setNavLevel("applications");
    setTappedFolderId(null);
    window.history.pushState(
      {
        appFolder: "applications",
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

  /* ───────── Status badge ───────── */

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { bg: string; text: string; border: string; dot: string }
    > = {
      DRAFT: {
        bg: "bg-slate-50",
        text: "text-slate-600",
        border: "border-slate-200",
        dot: "bg-slate-400",
      },
      SUBMITTED: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        dot: "bg-blue-500",
      },
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
      APPROVED: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
      },
      ACCEPTED: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
      },
      CONTESTING: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
        dot: "bg-purple-500",
      },
      REJECTED: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        dot: "bg-red-500",
      },
      WITHDRAWN: {
        bg: "bg-gray-50",
        text: "text-gray-600",
        border: "border-gray-200",
        dot: "bg-gray-400",
      },
      VALID: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
      },
    };
    const c = config[status] || config.DRAFT;
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

  /* ───────── Actions ───────── */

  const handleViewNomination = (nomination: Nomination) => {
    setSelectedNomination(nomination);
    setIsViewDialogOpen(true);
  };

  // Download PDF using the RO API endpoint
  const handleDownloadForm = async (nominationId: string) => {
    try {
      await downloadForm18PDF(nominationId, {
        apiBasePath: "/api/ro/applications",
      });
    } catch (err) {
      console.error("Failed to download form:", err);
    }
  };

  const handleReceiveAction = async (nominationId: string) => {
    setReceiveNominationId(nominationId);
    setReceiveOtp("");
    setReceiveOtpError("");
    setReceiveOtpSent(false);
    setIsReceiveDialogOpen(true);
    await sendReceiveOtp(nominationId);
  };

  const sendReceiveOtp = async (nominationId: string) => {
    setIsSendingReceiveOtp(true);
    setReceiveOtpError("");
    try {
      const response = await fetch(
        `/api/ro/applications/${nominationId}/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "RECEIPT_CONFIRMATION" }),
        },
      );
      const result = await response.json();
      if (result.success) {
        setReceiveOtpSent(true);
      } else {
        setReceiveOtpError(result.error || "Failed to send OTP");
      }
    } catch {
      setReceiveOtpError("Failed to send OTP");
    } finally {
      setIsSendingReceiveOtp(false);
    }
  };

  const handleConfirmReceive = async () => {
    if (!receiveNominationId || receiveOtp.length !== 6) {
      setReceiveOtpError("Please enter a valid 6-digit OTP");
      return;
    }
    setIsReceiving(true);
    setReceiveOtpError("");
    try {
      const response = await fetch(
        `/api/ro/applications/${receiveNominationId}/receive`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otp: receiveOtp }),
        },
      );
      const result = await response.json();
      if (result.success) {
        setIsReceiveDialogOpen(false);
        fetchNominations();
      } else {
        setReceiveOtpError(result.error || "Failed to receive application");
      }
    } catch {
      setReceiveOtpError("Failed to receive application");
    } finally {
      setIsReceiving(false);
    }
  };

  const handleStatusAction = async (
    nominationId: string,
    action: "RECEIVE" | "SCRUTINY",
  ) => {
    if (action === "RECEIVE") {
      handleReceiveAction(nominationId);
      return;
    }
    setIsActionLoading(nominationId);
    try {
      const response = await fetch(
        `/api/ro/applications/${nominationId}/scrutiny`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "START" }),
        },
      );
      const result = await response.json();
      if (result.success) {
        fetchNominations();
      } else {
        setError(result.error || "Failed to perform action");
      }
    } catch (err) {
      console.error("Failed to perform action:", err);
      setError("Failed to perform action");
    } finally {
      setIsActionLoading(null);
    }
  };

  /* ───────── Timeline helper ───────── */
  const getTimelineSteps = (nom: Nomination) => {
    const reached = (statuses: string[]) => statuses.includes(nom.status);
    const pastReceived = reached([
      "RECEIVED",
      "UNDER_SCRUTINY",
      "APPROVED",
      "ACCEPTED",
      "VALID",
      "REJECTED",
      "CONTESTING",
    ]);
    const pastScrutiny = reached([
      "UNDER_SCRUTINY",
      "APPROVED",
      "ACCEPTED",
      "VALID",
      "REJECTED",
      "CONTESTING",
    ]);
    const decided = reached([
      "APPROVED",
      "ACCEPTED",
      "VALID",
      "REJECTED",
      "CONTESTING",
    ]);

    return [
      {
        label: "Submitted",
        done: true,
        date: nom.submittedAt,
        color: "bg-blue-500",
        ring: "ring-blue-200",
      },
      {
        label: "Received by RO",
        done: pastReceived,
        date: null,
        color: "bg-cyan-500",
        ring: "ring-cyan-200",
      },
      {
        label: "Under Scrutiny",
        done: pastScrutiny,
        date: nom.scrutinyAt || null,
        color: "bg-amber-500",
        ring: "ring-amber-200",
      },
      {
        label:
          nom.status === "REJECTED"
            ? "Rejected"
            : nom.status === "WITHDRAWN"
              ? "Withdrawn"
              : decided
                ? "Approved"
                : "Awaiting Decision",
        done: decided || nom.status === "WITHDRAWN",
        date: null,
        color:
          nom.status === "REJECTED"
            ? "bg-red-500"
            : nom.status === "WITHDRAWN"
              ? "bg-gray-400"
              : "bg-emerald-500",
        ring:
          nom.status === "REJECTED"
            ? "ring-red-200"
            : nom.status === "WITHDRAWN"
              ? "ring-gray-200"
              : "ring-emerald-200",
      },
    ];
  };

  /* ───────── Resolve display symbol for view dialog ───────── */
  const getDisplaySymbol = (nom: Nomination) => {
    if (nom.allocatedSymbol) return nom.allocatedSymbol;
    const sorted = (nom.symbolPreferences || []).sort(
      (a, b) => a.preferenceOrder - b.preferenceOrder,
    );
    if (sorted.length > 0) {
      return {
        name: sorted[0].symbol.name,
        imagePath: sorted[0].symbol.imagePath,
      };
    }
    return null;
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
            {navLevel === "root" && "Municipal Bodies"}
            {navLevel === "ulb" && selectedUlb?.name}
            {navLevel === "ward" &&
              `Ward ${selectedWardNav?.wardNo} – ${selectedWardNav?.wardName}`}
            {navLevel === "applications" && "Applications"}
          </h1>
          <p className="text-[9px] sm:text-[10px] md:text-sm text-slate-500 mt-0.5 truncate">
            {navLevel === "root" &&
              "Double-tap a folder to view wards and applications"}
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
                    <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
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
                bg: "bg-blue-50",
                icon: Building2,
                iconColor: "text-blue-600",
                value: ulbGroups.length,
                label: "Municipal Bodies",
              },
              {
                bg: "bg-indigo-50",
                icon: MapPin,
                iconColor: "text-indigo-600",
                value: wards.length,
                label: "Total Wards",
              },
              {
                bg: "bg-emerald-50",
                icon: FileText,
                iconColor: "text-emerald-600",
                value: nominations.length,
                label: "Total Applications",
              },
              {
                bg: "bg-amber-50",
                icon: Clock,
                iconColor: "text-amber-600",
                value: nominations.filter(
                  (n) => n.status === "SUBMITTED" || n.status === "RECEIVED",
                ).length,
                label: "Pending Review",
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
              const count = ulbNominationCounts[ulb.id] || 0;
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
                        variant="yellow"
                      />
                      {count > 0 && (
                        <span className="absolute -top-1.5 -right-2 sm:-top-2 sm:-right-2.5 bg-blue-600 text-white text-[7px] sm:text-[8px] md:text-[10px] font-bold rounded-full min-w-[16px] sm:min-w-[18px] md:min-w-[22px] h-4 sm:h-[18px] md:h-[22px] flex items-center justify-center px-1 shadow-sm">
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
                  variant="yellow"
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
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <CardContent className="p-2 sm:p-3 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 md:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/60 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 md:gap-4">
                  {[
                    { label: "Code", value: selectedUlb.code },
                    { label: "Type", value: formatUlbType(selectedUlb.type) },
                    { label: "District", value: selectedUlb.districtName },
                    {
                      label: "Applications",
                      value: ulbNominationCounts[selectedUlb.id] || 0,
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
                const count = wardNominationCounts[ward.id] || 0;
                const isTapped = tappedFolderId === `ward-${ward.id}`;
                return (
                  <Card
                    key={ward.id}
                    className={`cursor-pointer select-none touch-manipulation transition-all duration-200 group rounded-xl
                      ${isTapped ? "ring-2 ring-blue-400 shadow-lg shadow-blue-100/60 scale-[1.03]" : "ring-1 ring-transparent hover:ring-slate-200 hover:shadow-md"}`}
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
                          variant="blue"
                        />
                        {count > 0 && (
                          <span className="absolute -top-1.5 -right-2 sm:-top-2 sm:-right-2.5 bg-indigo-600 text-white text-[7px] sm:text-[8px] md:text-[10px] font-bold rounded-full min-w-[16px] sm:min-w-[18px] md:min-w-[22px] h-4 sm:h-[18px] md:h-[22px] flex items-center justify-center px-1 shadow-sm">
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
                        <p className="text-[7px] sm:text-[8px] md:text-[10px] text-blue-600 font-medium animate-pulse">
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
          <Card className="border-0 shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
            <CardContent className="p-2 sm:p-3 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 md:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/60 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-indigo-600" />
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
                      Applications
                    </p>
                    <p className="font-semibold text-[10px] sm:text-xs md:text-sm text-slate-800">
                      {wardNominationCounts[selectedWardNav.id] || 0}
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
                const isTapped = tappedFolderId === "applications";
                return (
                  <Card
                    className={`cursor-pointer select-none touch-manipulation transition-all duration-200 group rounded-xl
                      ${isTapped ? "ring-2 ring-emerald-400 shadow-lg shadow-emerald-100/60 scale-[1.03]" : "ring-1 ring-transparent hover:ring-slate-200 hover:shadow-md"}`}
                    onClick={() =>
                      handleFolderDoubleClick(
                        "applications",
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
                        {(wardNominationCounts[selectedWardNav.id] || 0) >
                          0 && (
                          <span className="absolute -top-1.5 -right-2 sm:-top-2 sm:-right-2.5 bg-emerald-600 text-white text-[7px] sm:text-[8px] md:text-[10px] font-bold rounded-full min-w-[16px] sm:min-w-[18px] md:min-w-[22px] h-4 sm:h-[18px] md:h-[22px] flex items-center justify-center px-1 shadow-sm">
                            {wardNominationCounts[selectedWardNav.id] || 0}
                          </span>
                        )}
                      </div>
                      <div className="space-y-0 sm:space-y-0.5">
                        <p className="font-semibold text-[9px] sm:text-[10px] md:text-sm text-slate-800">
                          Application List
                        </p>
                        <p className="text-[7px] sm:text-[8px] md:text-xs text-slate-400">
                          {wardNominationCounts[selectedWardNav.id] || 0} Apps
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
          {/* ── Overview Cards – 2-col mobile ── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-2.5 md:gap-3">
            {[
              {
                label: "Total",
                value: nominations.filter(
                  (n) => n.ward.id === selectedWardNav.id,
                ).length,
                icon: FileText,
                color: "text-slate-600",
                bg: "bg-slate-100",
                ring: "ring-slate-300",
                iconBg: "bg-slate-200",
                active: statusFilter === "all",
                filter: "all",
              },
              {
                label: "Pending",
                value:
                  (statusStats["SUBMITTED"] || 0) +
                  (statusStats["RECEIVED"] || 0),
                icon: Clock,
                color: "text-amber-600",
                bg: "bg-amber-50",
                ring: "ring-amber-300",
                iconBg: "bg-amber-100",
                active: statusFilter === "PENDING",
                filter: "PENDING",
              },
              {
                label: "Scrutiny",
                value: statusStats["UNDER_SCRUTINY"] || 0,
                icon: Eye,
                color: "text-violet-600",
                bg: "bg-violet-50",
                ring: "ring-violet-300",
                iconBg: "bg-violet-100",
                active: statusFilter === "UNDER_SCRUTINY",
                filter: "UNDER_SCRUTINY",
              },
              {
                label: "Approved",
                value:
                  (statusStats["APPROVED"] || 0) + (statusStats["VALID"] || 0),
                icon: CheckCircle,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
                ring: "ring-emerald-300",
                iconBg: "bg-emerald-100",
                active: statusFilter === "APPROVED",
                filter: "APPROVED",
              },
              {
                label: "Rejected",
                value: statusStats["REJECTED"] || 0,
                icon: XCircle,
                color: "text-red-500",
                bg: "bg-red-50",
                ring: "ring-red-300",
                iconBg: "bg-red-100",
                active: statusFilter === "REJECTED",
                filter: "REJECTED",
              },
            ].map((s, i, arr) => (
              <button
                key={i}
                onClick={() => setStatusFilter(s.filter)}
                className={`relative rounded-2xl p-3 sm:p-3.5 md:p-4 text-left transition-all duration-200
                  ${i === arr.length - 1 ? "col-span-2 md:col-span-1" : ""}
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
                  <SelectValue placeholder="All Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="RECEIVED">Received</SelectItem>
                <SelectItem value="UNDER_SCRUTINY">Under Scrutiny</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                <SelectItem value="VALID">Valid</SelectItem>
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
              of{" "}
              {
                nominations.filter((n) => n.ward.id === selectedWardNav.id)
                  .length
              }{" "}
              applications
            </p>
            {(searchQuery || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
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
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                <FileText className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                No applications found
              </p>
              <p className="text-xs text-slate-400">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "No nominations have been filed for this ward yet"}
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
                      Actions
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
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm">
                            <span className="text-sm font-bold text-blue-700">
                              {(n.candidateName || "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-800 truncate">
                              {n.candidateName}
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
                              {n.politicalParty.abbreviation}
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                            onClick={() => handleViewNomination(n)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                            onClick={() => handleDownloadForm(n.id)}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          {n.status === "SUBMITTED" && (
                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm shadow-emerald-200"
                              onClick={() =>
                                handleStatusAction(n.id, "RECEIVE")
                              }
                              disabled={isActionLoading === n.id}
                            >
                              {isActionLoading === n.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                                  Receive
                                </>
                              )}
                            </Button>
                          )}
                          {n.status === "RECEIVED" && (
                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-200"
                              onClick={() =>
                                handleStatusAction(n.id, "SCRUTINY")
                              }
                              disabled={isActionLoading === n.id}
                            >
                              {isActionLoading === n.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Send className="h-3.5 w-3.5 mr-1" />
                                  Scrutiny
                                </>
                              )}
                            </Button>
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
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm">
                      <span className="text-base sm:text-lg font-bold text-blue-700">
                        {(n.candidateName || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13px] sm:text-sm text-slate-800 truncate leading-tight">
                        {n.candidateName}
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
                            ? n.politicalParty.abbreviation
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-9 text-[11px] sm:text-xs text-slate-600 hover:text-slate-800 hover:bg-white rounded-xl font-medium"
                      onClick={() => handleViewNomination(n)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl shrink-0"
                      onClick={() => handleDownloadForm(n.id)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    {n.status === "SUBMITTED" && (
                      <Button
                        size="sm"
                        className="flex-1 h-9 text-[11px] sm:text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm font-medium"
                        onClick={() => handleStatusAction(n.id, "RECEIVE")}
                        disabled={isActionLoading === n.id}
                      >
                        {isActionLoading === n.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <CheckCheck className="h-3.5 w-3.5 mr-1" />
                            Receive
                          </>
                        )}
                      </Button>
                    )}
                    {n.status === "RECEIVED" && (
                      <Button
                        size="sm"
                        className="flex-1 h-9 text-[11px] sm:text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm font-medium"
                        onClick={() => handleStatusAction(n.id, "SCRUTINY")}
                        disabled={isActionLoading === n.id}
                      >
                        {isActionLoading === n.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5 mr-1" />
                            Scrutiny
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════
          VIEW DIALOG
          ════════════════════════════════════════════ */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[92vh] overflow-y-auto w-[96vw] rounded-2xl p-0 gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Viewing nomination {selectedNomination?.applicationNo}
            </DialogDescription>
          </DialogHeader>

          {selectedNomination && (
            <div className="divide-y divide-slate-100">
              {/* ── Hero ── */}
              <div className="relative bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 p-4 sm:p-5 md:p-6 pt-10 sm:pt-5">
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2.5 right-12 sm:top-4 sm:right-14 h-7 sm:h-8 text-[9px] sm:text-xs rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm z-10"
                  onClick={() => handleDownloadForm(selectedNomination.id)}
                >
                  <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                  PDF
                </Button>

                <div className="flex items-start gap-3 sm:gap-4 pr-20 sm:pr-28">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-200/50">
                    <span className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                      {(selectedNomination.candidateName || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 truncate leading-tight">
                      {selectedNomination.candidateName}
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
                    <div className="mt-2">
                      {getStatusBadge(selectedNomination.status)}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Personal Info ── */}
              <div className="p-4 sm:p-5 md:p-6">
                <h4 className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  Personal Information
                </h4>
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
                  {selectedNomination.applicantProfile?.user?.email && (
                    <div className="col-span-2 flex items-center gap-2.5 bg-slate-50 rounded-xl p-2.5 sm:p-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                        <Mail className="h-3.5 w-3.5 text-cyan-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider font-medium">
                          Email
                        </p>
                        <p className="text-[11px] sm:text-xs font-semibold text-slate-700 truncate">
                          {selectedNomination.applicantProfile.user.email}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {selectedNomination.address && (
                  <div className="mt-3 flex items-start gap-2.5 bg-slate-50 rounded-xl p-2.5 sm:p-3">
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
              </div>

              {/* ── Election Details ── */}
              <div className="p-4 sm:p-5 md:p-6">
                <h4 className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  Election Details
                </h4>
                <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 rounded-2xl border border-indigo-100/60 overflow-hidden">
                  {/* Ward */}
                  <div className="flex items-center gap-3 p-3.5 sm:p-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] sm:text-[10px] text-indigo-400 uppercase tracking-wider font-medium">
                        Ward
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800">
                        Ward {selectedNomination.ward.wardNo} –{" "}
                        {selectedNomination.ward.wardName}
                      </p>
                      {selectedNomination.ward.reservationType && (
                        <Badge
                          variant="outline"
                          className="mt-1 text-[8px] sm:text-[10px] h-5 border-indigo-200 text-indigo-600 bg-white/50"
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
                  {/* Party */}
                  <div className="flex items-center gap-3 p-3.5 sm:p-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedNomination.politicalParty ? "bg-violet-100" : "bg-gray-100"}`}
                    >
                      <Shield
                        className={`h-5 w-5 ${selectedNomination.politicalParty ? "text-violet-600" : "text-gray-400"}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] sm:text-[10px] text-indigo-400 uppercase tracking-wider font-medium">
                        Political Party
                      </p>
                      {selectedNomination.politicalParty ? (
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <p className="text-xs sm:text-sm font-semibold text-slate-800">
                            {selectedNomination.politicalParty.name}
                          </p>
                          <Badge className="text-[8px] sm:text-[10px] h-5 bg-violet-100 text-violet-700 border-0 hover:bg-violet-100">
                            {selectedNomination.politicalParty.abbreviation}
                          </Badge>
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
                          Independent Candidate
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Symbol */}
                  {(() => {
                    const sym = getDisplaySymbol(selectedNomination);
                    if (!sym) return null;
                    return (
                      <>
                        <div className="mx-4 border-t border-indigo-100/80" />
                        <div className="flex items-center gap-3 p-3.5 sm:p-4">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 overflow-hidden">
                            {sym.imagePath ? (
                              <img
                                src={sym.imagePath}
                                alt={sym.name}
                                className="w-7 h-7 object-contain"
                              />
                            ) : (
                              <FileCheck className="h-5 w-5 text-amber-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] sm:text-[10px] text-indigo-400 uppercase tracking-wider font-medium">
                              Election Symbol
                            </p>
                            <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5">
                              {sym.name}
                            </p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                  {/* ULB */}
                  {selectedNomination.ward.ulb && (
                    <>
                      <div className="mx-4 border-t border-indigo-100/80" />
                      <div className="flex items-center gap-3 p-3.5 sm:p-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] sm:text-[10px] text-indigo-400 uppercase tracking-wider font-medium">
                            Municipal Body
                          </p>
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5">
                            {selectedNomination.ward.ulb.name}
                          </p>
                          {selectedNomination.ward.ulb.district?.name && (
                            <p className="text-[10px] sm:text-xs text-slate-500">
                              {selectedNomination.ward.ulb.district.name}{" "}
                              District
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ── Documents ── */}
              <div className="p-4 sm:p-5 md:p-6">
                <h4 className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  Documents
                  {selectedNomination.documents &&
                    selectedNomination.documents.length > 0 && (
                      <span className="ml-1.5 text-slate-300">
                        ({selectedNomination.documents.length})
                      </span>
                    )}
                </h4>
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
                  <div className="flex flex-col items-center py-6 sm:py-8 bg-slate-50 rounded-xl">
                    <FileText className="h-8 w-8 text-slate-200 mb-2" />
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      No documents uploaded
                    </p>
                  </div>
                )}
              </div>

              {/* ── Timeline ── */}
              <div className="p-4 sm:p-5 md:p-6">
                <h4 className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                  Status Timeline
                </h4>
                <div className="relative">
                  <div className="absolute left-[15px] sm:left-[17px] top-3 bottom-3 w-0.5 bg-slate-100 rounded-full" />
                  <div className="space-y-5">
                    {getTimelineSteps(selectedNomination).map((step, i) => (
                      <div
                        key={i}
                        className="relative flex items-start gap-3.5"
                      >
                        <div
                          className={`relative z-10 w-[30px] sm:w-[34px] h-[30px] sm:h-[34px] rounded-full flex items-center justify-center shrink-0 transition-all ${step.done ? `${step.color} ring-4 ${step.ring} shadow-sm` : "bg-white border-2 border-slate-200 ring-4 ring-white"}`}
                        >
                          {step.done ? (
                            <div className="w-2.5 h-2.5 rounded-full bg-white" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-slate-200" />
                          )}
                        </div>
                        <div className="pt-1 sm:pt-1.5 min-w-0 flex-1">
                          <p
                            className={`text-xs sm:text-sm font-semibold leading-tight ${step.done ? "text-slate-800" : "text-slate-400"}`}
                          >
                            {step.label}
                          </p>
                          {step.date ? (
                            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                              {new Date(step.date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          ) : step.done ? (
                            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                              Completed
                            </p>
                          ) : (
                            <p className="text-[10px] sm:text-[11px] text-slate-300 mt-0.5 italic">
                              Pending
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {(selectedNomination.paymentStatus ||
                  selectedNomination.scrutinyRemarks) && (
                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                    {selectedNomination.paymentStatus && (
                      <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-slate-400" />
                          <span className="text-xs text-slate-600 font-medium">
                            Payment Status
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] sm:text-xs"
                        >
                          {selectedNomination.paymentStatus}
                        </Badge>
                      </div>
                    )}
                    {selectedNomination.scrutinyRemarks && (
                      <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-[10px] sm:text-xs font-semibold text-amber-700">
                            Scrutiny Remarks
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-amber-800 leading-relaxed">
                          {selectedNomination.scrutinyRemarks}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════
          Receive Dialog
          ════════════════════════════════════════════ */}
      <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <DialogContent className="sm:max-w-md w-[94vw] rounded-xl p-2.5 sm:p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-lg">
              <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
              Receive Application
            </DialogTitle>
            <DialogDescription className="text-[9px] sm:text-[10px] md:text-sm">
              Enter the OTP sent to your phone to confirm receipt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 sm:space-y-3 md:space-y-4 py-2 sm:py-3 md:py-4">
            <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4">
              {isSendingReceiveOtp && !receiveOtpSent ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  <p className="text-[10px] sm:text-xs md:text-sm text-slate-500">
                    Sending OTP...
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-[9px] sm:text-[10px] md:text-sm text-muted-foreground text-center">
                    Enter the 6-digit OTP sent to your registered mobile
                  </p>
                  <InputOTP
                    maxLength={6}
                    value={receiveOtp}
                    onChange={setReceiveOtp}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  {receiveOtpError && (
                    <p className="text-[9px] sm:text-[10px] md:text-sm text-red-600">
                      {receiveOtpError}
                    </p>
                  )}
                  <Button
                    variant="link"
                    size="sm"
                    className="text-[9px] sm:text-[10px] md:text-sm"
                    onClick={() =>
                      receiveNominationId && sendReceiveOtp(receiveNominationId)
                    }
                    disabled={isSendingReceiveOtp}
                  >
                    {isSendingReceiveOtp ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    Resend OTP
                  </Button>
                </>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setIsReceiveDialogOpen(false)}
              className="w-full sm:w-auto h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReceive}
              disabled={isReceiving || receiveOtp.length !== 6}
              className="w-full sm:w-auto h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-sm"
            >
              {isReceiving && (
                <Loader2 className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
              )}
              <CheckCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
              Verify & Receive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

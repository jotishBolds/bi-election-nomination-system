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
  Ban,
  Phone,
  Mail,
  Building,
  Download,
  CheckCheck,
  Send,
  Loader2,
  Folder,
  ChevronRight,
  Home,
  ArrowLeft,
  Building2,
  MousePointerClick,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadForm18PDF } from "@/lib/form18-template";

// ─── Interfaces ──────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

export function ApplicationsListPanel() {
  // Data state
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [wards, setWards] = useState<WardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation state
  const [navLevel, setNavLevel] = useState<NavLevel>("root");
  const [selectedUlb, setSelectedUlb] = useState<ULBGroup | null>(null);
  const [selectedWardNav, setSelectedWardNav] = useState<WardData | null>(null);

  // Double-click/tap tracking
  const lastTapRef = useRef<{ id: string; time: number }>({
    id: "",
    time: 0,
  });
  const [tappedFolderId, setTappedFolderId] = useState<string | null>(null);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filters (applications level)
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Action state
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [selectedNomination, setSelectedNomination] =
    useState<Nomination | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // OTP receive flow state
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [receiveNominationId, setReceiveNominationId] = useState<string | null>(
    null,
  );
  const [receiveOtp, setReceiveOtp] = useState("");
  const [receiveOtpError, setReceiveOtpError] = useState("");
  const [isSendingReceiveOtp, setIsSendingReceiveOtp] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [receiveOtpSent, setReceiveOtpSent] = useState(false);

  // ─── Computed Data (need early for history handler) ──────────────────────

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

  // Keep a ref so the popstate handler always has fresh data
  const ulbGroupsRef = useRef(ulbGroups);
  useEffect(() => {
    ulbGroupsRef.current = ulbGroups;
  }, [ulbGroups]);

  // ─── Browser History Management ──────────────────────────────────────────

  // On mount: mark the current history entry as our root
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

  // Listen for browser back/forward
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as FolderHistoryState | null;

      // If the state has no appFolder key, it's not ours – let browser handle it
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

  // ─── Double Click/Tap Handler ────────────────────────────────────────────

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

        if (tapTimeoutRef.current) {
          clearTimeout(tapTimeoutRef.current);
        }
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

  // ─── Data Fetching ───────────────────────────────────────────────────────

  const fetchWards = async () => {
    try {
      const response = await fetch("/api/ro/wards");
      const result = await response.json();
      if (result.success) {
        setWards(result.data);
      }
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

  // ─── More Computed Data ──────────────────────────────────────────────────

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
      filtered = filtered.filter((n) => n.status === statusFilter);
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

  // ─── Navigation (with browser history) ───────────────────────────────────

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

  /** Go back one level using browser history */
  const goBack = () => {
    setTappedFolderId(null);
    if (navLevel !== "root") {
      window.history.back(); // popstate handler updates React state
    }
  };

  /** Jump to a specific level via breadcrumb */
  const navigateToLevel = (level: NavLevel) => {
    const diff = LEVEL_NUM[navLevel] - LEVEL_NUM[level];
    if (diff > 0) {
      setTappedFolderId(null);
      window.history.go(-diff); // popstate handler updates React state
    }
  };

  // ─── Status Badge ────────────────────────────────────────────────────────

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { bg: string; text: string; icon: React.ReactNode }
    > = {
      DRAFT: {
        bg: "bg-slate-100",
        text: "text-slate-700",
        icon: <Clock className="h-3 w-3" />,
      },
      SUBMITTED: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        icon: <FileText className="h-3 w-3" />,
      },
      RECEIVED: {
        bg: "bg-cyan-100",
        text: "text-cyan-700",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      UNDER_SCRUTINY: {
        bg: "bg-amber-100",
        text: "text-amber-700",
        icon: <Eye className="h-3 w-3" />,
      },
      APPROVED: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      ACCEPTED: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      CONTESTING: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        icon: <FileCheck className="h-3 w-3" />,
      },
      REJECTED: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: <XCircle className="h-3 w-3" />,
      },
      WITHDRAWN: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        icon: <Ban className="h-3 w-3" />,
      },
      VALID: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        icon: <FileCheck className="h-3 w-3" />,
      },
    };
    const c = config[status] || config.DRAFT;
    return (
      <Badge className={`${c.bg} ${c.text} gap-1`}>
        {c.icon}
        {status.replace("_", " ")}
      </Badge>
    );
  };

  // ─── Action Handlers ─────────────────────────────────────────────────────

  const handleViewNomination = (nomination: Nomination) => {
    setSelectedNomination(nomination);
    setIsViewDialogOpen(true);
  };

  const handleDownloadForm = async (nominationId: string) => {
    try {
      await downloadForm18PDF(nominationId);
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

  // ─── Loading Skeleton ────────────────────────────────────────────────────

  if (isLoading && nominations.length === 0 && wards.length === 0) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 md:h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 md:space-y-5 p-3 md:p-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 md:gap-3">
        {navLevel !== "root" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="shrink-0 h-8 w-8 md:h-9 md:w-9"
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-base md:text-xl font-semibold text-slate-800 truncate">
            {navLevel === "root" && "Municipal Bodies"}
            {navLevel === "ulb" && selectedUlb?.name}
            {navLevel === "ward" &&
              `Ward ${selectedWardNav?.wardNo} – ${selectedWardNav?.wardName}`}
            {navLevel === "applications" && "Application List"}
          </h1>
          <p className="text-[11px] md:text-sm text-slate-500 mt-0.5 truncate">
            {navLevel === "root" &&
              "Double-tap a folder to view wards and applications"}
            {navLevel === "ulb" &&
              `${selectedUlb?.districtName} District · ${formatUlbType(selectedUlb?.type || "")}`}
            {navLevel === "ward" &&
              `${selectedUlb?.name} · Reservation: ${(selectedWardNav?.reservationType || "N/A").replace(/_/g, " ")}`}
            {navLevel === "applications" &&
              `Ward ${selectedWardNav?.wardNo} – ${selectedWardNav?.wardName}`}
          </p>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="ml-auto shrink-0 h-8 w-8 md:h-9 md:w-9"
          onClick={() => {
            fetchWards();
            fetchNominations();
          }}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 md:h-4 md:w-4 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      {navLevel !== "root" && (
        <nav className="flex items-center gap-0.5 md:gap-1 text-xs md:text-sm overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {breadcrumbs.map((item, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div
                key={idx}
                className="flex items-center gap-0.5 md:gap-1 shrink-0"
              >
                {idx > 0 && (
                  <ChevronRight className="h-3 w-3 md:h-3.5 md:w-3.5 text-slate-400" />
                )}
                <button
                  onClick={() => !isLast && navigateToLevel(item.level)}
                  disabled={isLast}
                  className={`flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md transition-colors ${
                    isLast
                      ? "text-slate-800 font-medium cursor-default"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                  }`}
                >
                  {idx === 0 && <Home className="h-3 w-3 md:h-3.5 md:w-3.5" />}
                  {idx === 1 && (
                    <Building2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  )}
                  {idx === 2 && (
                    <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  )}
                  {idx === 3 && (
                    <FileText className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  )}
                  <span className="whitespace-nowrap max-w-[100px] md:max-w-none truncate">
                    {item.label}
                  </span>
                </button>
              </div>
            );
          })}
        </nav>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  ROOT LEVEL                                                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {navLevel === "root" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            <Card className="bg-blue-50 border-0 shadow-sm">
              <CardContent className="p-3 md:p-4">
                <Building2 className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                <p className="text-xl md:text-2xl font-bold text-slate-800 mt-1.5 md:mt-2">
                  {ulbGroups.length}
                </p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">
                  Municipal Bodies
                </p>
              </CardContent>
            </Card>
            <Card className="bg-indigo-50 border-0 shadow-sm">
              <CardContent className="p-3 md:p-4">
                <MapPin className="h-4 w-4 md:h-5 md:w-5 text-indigo-600" />
                <p className="text-xl md:text-2xl font-bold text-slate-800 mt-1.5 md:mt-2">
                  {wards.length}
                </p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">
                  Total Wards
                </p>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50 border-0 shadow-sm">
              <CardContent className="p-3 md:p-4">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                <p className="text-xl md:text-2xl font-bold text-slate-800 mt-1.5 md:mt-2">
                  {nominations.length}
                </p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">
                  Total Applications
                </p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-0 shadow-sm">
              <CardContent className="p-3 md:p-4">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                <p className="text-xl md:text-2xl font-bold text-slate-800 mt-1.5 md:mt-2">
                  {
                    nominations.filter(
                      (n) =>
                        n.status === "SUBMITTED" || n.status === "RECEIVED",
                    ).length
                  }
                </p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">
                  Pending Review
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-slate-400 px-1">
            <MousePointerClick className="h-3 w-3 md:h-3.5 md:w-3.5" />
            <span>Double-click / Double-tap to open folders</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {ulbGroups.map((ulb) => {
              const count = ulbNominationCounts[ulb.id] || 0;
              const isTapped = tappedFolderId === `ulb-${ulb.id}`;
              return (
                <Card
                  key={ulb.id}
                  className={`cursor-pointer select-none touch-manipulation transition-all duration-200 group
                    ${
                      isTapped
                        ? "border-2 border-amber-400 shadow-lg shadow-amber-100 scale-[1.03]"
                        : "border-2 border-transparent hover:border-amber-300 hover:shadow-lg"
                    }`}
                  onClick={() =>
                    handleFolderDoubleClick(`ulb-${ulb.id}`, () =>
                      navigateToUlb(ulb),
                    )
                  }
                >
                  <CardContent className="p-3 md:p-5 flex flex-col items-center text-center gap-2 md:gap-2.5">
                    <div
                      className={`relative w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center transition-colors
                      ${isTapped ? "bg-amber-200" : "bg-amber-100 group-hover:bg-amber-200"}`}
                    >
                      <Folder
                        className="h-7 w-7 md:h-9 md:w-9 text-amber-600"
                        fill="currentColor"
                        fillOpacity={0.15}
                      />
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 md:-top-1.5 md:-right-1.5 bg-blue-600 text-white text-[9px] md:text-[10px] font-bold rounded-full min-w-[18px] md:min-w-[20px] h-[18px] md:h-5 flex items-center justify-center px-1">
                          {count}
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5 min-w-0 w-full">
                      <p className="font-semibold text-[11px] md:text-sm text-slate-800 leading-tight line-clamp-2">
                        {ulb.name}
                      </p>
                      <p className="text-[9px] md:text-xs text-slate-400">
                        {ulb.wards.length} Wards
                      </p>
                    </div>
                    {isTapped && (
                      <p className="text-[9px] md:text-[10px] text-amber-600 font-medium animate-pulse">
                        Tap again to open
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {ulbGroups.length === 0 && !isLoading && (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 md:py-16 flex flex-col items-center gap-3">
                <Folder className="h-10 w-10 md:h-14 md:w-14 text-slate-300" />
                <p className="text-sm text-slate-500">
                  No municipal bodies found
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  ULB LEVEL                                                          */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {navLevel === "ulb" && selectedUlb && (
        <>
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/60 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <Building2 className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                  <div>
                    <p className="text-[10px] md:text-[11px] text-slate-500 uppercase tracking-wider">
                      Code
                    </p>
                    <p className="font-semibold text-xs md:text-sm text-slate-800">
                      {selectedUlb.code}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-[11px] text-slate-500 uppercase tracking-wider">
                      Type
                    </p>
                    <p className="font-semibold text-xs md:text-sm text-slate-800">
                      {formatUlbType(selectedUlb.type)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-[11px] text-slate-500 uppercase tracking-wider">
                      District
                    </p>
                    <p className="font-semibold text-xs md:text-sm text-slate-800">
                      {selectedUlb.districtName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-[11px] text-slate-500 uppercase tracking-wider">
                      Applications
                    </p>
                    <p className="font-semibold text-xs md:text-sm text-slate-800">
                      {ulbNominationCounts[selectedUlb.id] || 0}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-slate-400 px-1">
            <MousePointerClick className="h-3 w-3 md:h-3.5 md:w-3.5" />
            <span>Double-click / Double-tap to open folders</span>
          </div>

          <div>
            <h2 className="text-xs md:text-sm font-medium text-slate-600 mb-2 md:mb-3">
              Wards ({selectedUlb.wards.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              {selectedUlb.wards.map((ward) => {
                const count = wardNominationCounts[ward.id] || 0;
                const isTapped = tappedFolderId === `ward-${ward.id}`;
                return (
                  <Card
                    key={ward.id}
                    className={`cursor-pointer select-none touch-manipulation transition-all duration-200 group
                      ${
                        isTapped
                          ? "border-2 border-indigo-400 shadow-lg shadow-indigo-100 scale-[1.03]"
                          : "border-2 border-transparent hover:border-indigo-300 hover:shadow-lg"
                      }`}
                    onClick={() =>
                      handleFolderDoubleClick(`ward-${ward.id}`, () =>
                        navigateToWard(ward),
                      )
                    }
                  >
                    <CardContent className="p-3 md:p-5 flex flex-col items-center text-center gap-2 md:gap-2.5">
                      <div
                        className={`relative w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center transition-colors
                        ${isTapped ? "bg-indigo-200" : "bg-indigo-100 group-hover:bg-indigo-200"}`}
                      >
                        <Folder
                          className="h-7 w-7 md:h-9 md:w-9 text-indigo-600"
                          fill="currentColor"
                          fillOpacity={0.15}
                        />
                        {count > 0 && (
                          <span className="absolute -top-1 -right-1 md:-top-1.5 md:-right-1.5 bg-indigo-600 text-white text-[9px] md:text-[10px] font-bold rounded-full min-w-[18px] md:min-w-[20px] h-[18px] md:h-5 flex items-center justify-center px-1">
                            {count}
                          </span>
                        )}
                      </div>
                      <div className="space-y-0.5 min-w-0 w-full">
                        <p className="font-bold text-[11px] md:text-sm text-slate-800">
                          Ward {ward.wardNo}
                        </p>
                        <p className="text-[9px] md:text-xs text-slate-500 line-clamp-1">
                          {ward.wardName}
                        </p>
                        {ward.reservationType && (
                          <Badge
                            variant="outline"
                            className="mt-0.5 md:mt-1 text-[8px] md:text-[10px] px-1 md:px-1.5 py-0"
                          >
                            {ward.reservationType.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                      {isTapped && (
                        <p className="text-[9px] md:text-[10px] text-indigo-600 font-medium animate-pulse">
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

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  WARD LEVEL                                                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {navLevel === "ward" && selectedWardNav && selectedUlb && (
        <>
          <Card className="border-0 shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/60 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <MapPin className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                  <div>
                    <p className="text-[10px] md:text-[11px] text-slate-500 uppercase tracking-wider">
                      Ward No
                    </p>
                    <p className="font-semibold text-xs md:text-sm text-slate-800">
                      {selectedWardNav.wardNo}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-[11px] text-slate-500 uppercase tracking-wider">
                      Name
                    </p>
                    <p className="font-semibold text-xs md:text-sm text-slate-800 truncate">
                      {selectedWardNav.wardName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-[11px] text-slate-500 uppercase tracking-wider">
                      Reservation
                    </p>
                    <Badge
                      variant="outline"
                      className="mt-0.5 text-[10px] md:text-xs"
                    >
                      {(selectedWardNav.reservationType || "N/A").replace(
                        /_/g,
                        " ",
                      )}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-[11px] text-slate-500 uppercase tracking-wider">
                      Applications
                    </p>
                    <p className="font-semibold text-xs md:text-sm text-slate-800">
                      {wardNominationCounts[selectedWardNav.id] || 0}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-slate-400 px-1">
            <MousePointerClick className="h-3 w-3 md:h-3.5 md:w-3.5" />
            <span>Double-click / Double-tap to open</span>
          </div>

          <div>
            <h2 className="text-xs md:text-sm font-medium text-slate-600 mb-2 md:mb-3">
              Contents
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {(() => {
                const isTapped = tappedFolderId === "applications";
                return (
                  <Card
                    className={`cursor-pointer select-none touch-manipulation transition-all duration-200 group
                      ${
                        isTapped
                          ? "border-2 border-emerald-400 shadow-lg shadow-emerald-100 scale-[1.03]"
                          : "border-2 border-transparent hover:border-emerald-300 hover:shadow-lg"
                      }`}
                    onClick={() =>
                      handleFolderDoubleClick(
                        "applications",
                        navigateToApplications,
                      )
                    }
                  >
                    <CardContent className="p-3 md:p-5 flex flex-col items-center text-center gap-2 md:gap-2.5">
                      <div
                        className={`relative w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center transition-colors
                        ${isTapped ? "bg-emerald-200" : "bg-emerald-100 group-hover:bg-emerald-200"}`}
                      >
                        <FileText className="h-7 w-7 md:h-9 md:w-9 text-emerald-600" />
                        {(wardNominationCounts[selectedWardNav.id] || 0) >
                          0 && (
                          <span className="absolute -top-1 -right-1 md:-top-1.5 md:-right-1.5 bg-emerald-600 text-white text-[9px] md:text-[10px] font-bold rounded-full min-w-[18px] md:min-w-[20px] h-[18px] md:h-5 flex items-center justify-center px-1">
                            {wardNominationCounts[selectedWardNav.id] || 0}
                          </span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-semibold text-[11px] md:text-sm text-slate-800">
                          Application List
                        </p>
                        <p className="text-[9px] md:text-xs text-slate-400">
                          {wardNominationCounts[selectedWardNav.id] || 0}{" "}
                          Applications
                        </p>
                      </div>
                      {isTapped && (
                        <p className="text-[9px] md:text-[10px] text-emerald-600 font-medium animate-pulse">
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

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  APPLICATIONS LEVEL                                                 */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {navLevel === "applications" && selectedWardNav && (
        <>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by app no., name, phone…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 md:h-10 text-sm"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-44 h-9 md:h-10 text-sm">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="SUBMITTED">Submitted</SelectItem>
                    <SelectItem value="RECEIVED">Received</SelectItem>
                    <SelectItem value="UNDER_SCRUTINY">
                      Under Scrutiny
                    </SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                    <SelectItem value="VALID">Valid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
            <Card className="bg-blue-50 border-0 shadow-sm">
              <CardContent className="p-2.5 md:p-4">
                <FileText className="h-3.5 w-3.5 md:h-5 md:w-5 text-blue-600" />
                <p className="text-lg md:text-2xl font-bold text-slate-800 mt-1">
                  {
                    nominations.filter((n) => n.ward.id === selectedWardNav.id)
                      .length
                  }
                </p>
                <p className="text-[9px] md:text-xs text-slate-500">Total</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-0 shadow-sm">
              <CardContent className="p-2.5 md:p-4">
                <Clock className="h-3.5 w-3.5 md:h-5 md:w-5 text-amber-600" />
                <p className="text-lg md:text-2xl font-bold text-slate-800 mt-1">
                  {(statusStats["SUBMITTED"] || 0) +
                    (statusStats["RECEIVED"] || 0)}
                </p>
                <p className="text-[9px] md:text-xs text-slate-500">Pending</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-0 shadow-sm">
              <CardContent className="p-2.5 md:p-4">
                <Eye className="h-3.5 w-3.5 md:h-5 md:w-5 text-purple-600" />
                <p className="text-lg md:text-2xl font-bold text-slate-800 mt-1">
                  {statusStats["UNDER_SCRUTINY"] || 0}
                </p>
                <p className="text-[9px] md:text-xs text-slate-500">Scrutiny</p>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50 border-0 shadow-sm hidden md:block">
              <CardContent className="p-4">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {(statusStats["APPROVED"] || 0) + (statusStats["VALID"] || 0)}
                </p>
                <p className="text-xs text-slate-500">Approved</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-0 shadow-sm hidden md:block">
              <CardContent className="p-4">
                <XCircle className="h-5 w-5 text-red-600" />
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {statusStats["REJECTED"] || 0}
                </p>
                <p className="text-xs text-slate-500">Rejected</p>
              </CardContent>
            </Card>
          </div>

          {/* Desktop Table */}
          <Card className="border-0 shadow-sm hidden md:block">
            <CardContent className="p-0">
              {error ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <AlertTriangle className="h-12 w-12 text-amber-500" />
                  <p className="text-slate-600">{error}</p>
                  <Button onClick={fetchNominations} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">
                          Application No.
                        </TableHead>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Party</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="w-[130px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentNominations.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-slate-500"
                          >
                            No applications found
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentNominations.map((n) => (
                          <TableRow key={n.id}>
                            <TableCell>
                              <span className="font-mono text-sm font-medium text-slate-800">
                                {n.applicationNo}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                  <User className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-800 truncate">
                                    {n.candidateName}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {n.applicantProfile?.user?.phone || ""}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {n.politicalParty ? (
                                <Badge variant="outline">
                                  {n.politicalParty.abbreviation}
                                </Badge>
                              ) : (
                                <span className="text-sm text-slate-400">
                                  Independent
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(n.status)}</TableCell>
                            <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                              {new Date(n.submittedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewNomination(n)}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDownloadForm(n.id)}
                                  title="Download FORM-18"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                {n.status === "SUBMITTED" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleStatusAction(n.id, "RECEIVE")
                                    }
                                    disabled={isActionLoading === n.id}
                                    title="Receive Application"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    {isActionLoading === n.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCheck className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                                {n.status === "RECEIVED" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleStatusAction(n.id, "SCRUTINY")
                                    }
                                    disabled={isActionLoading === n.id}
                                    title="Send to Scrutiny"
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    {isActionLoading === n.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Send className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-2.5">
            {error ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-10 flex flex-col items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                  <p className="text-slate-600 text-sm">{error}</p>
                  <Button
                    onClick={fetchNominations}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : currentNominations.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-10 text-center text-slate-500 text-sm">
                  No applications found
                </CardContent>
              </Card>
            ) : (
              currentNominations.map((n) => (
                <Card key={n.id} className="border shadow-sm">
                  <CardContent className="p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-medium text-slate-700 truncate">
                        {n.applicationNo}
                      </span>
                      {getStatusBadge(n.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-slate-800 truncate">
                          {n.candidateName}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {n.applicantProfile?.user?.phone || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        {n.politicalParty
                          ? n.politicalParty.abbreviation
                          : "Independent"}
                      </span>
                      <span>
                        {new Date(n.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => handleViewNomination(n)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownloadForm(n.id)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      {n.status === "SUBMITTED" && (
                        <Button
                          size="sm"
                          className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleStatusAction(n.id, "RECEIVE")}
                          disabled={isActionLoading === n.id}
                        >
                          {isActionLoading === n.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <CheckCheck className="h-3 w-3 mr-1" />
                              Receive
                            </>
                          )}
                        </Button>
                      )}
                      {n.status === "RECEIVED" && (
                        <Button
                          size="sm"
                          className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleStatusAction(n.id, "SCRUTINY")}
                          disabled={isActionLoading === n.id}
                        >
                          {isActionLoading === n.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-3 w-3 mr-1" />
                              Scrutiny
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  VIEW DIALOG                                                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto w-[95vw] rounded-xl">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <DialogTitle className="text-base md:text-lg">
                  Application Details
                </DialogTitle>
                <DialogDescription className="text-xs md:text-sm">
                  Application No: {selectedNomination?.applicationNo}
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-fit text-xs md:text-sm"
                onClick={() =>
                  selectedNomination &&
                  handleDownloadForm(selectedNomination.id)
                }
              >
                <Download className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
                Download PDF
              </Button>
            </div>
          </DialogHeader>
          {selectedNomination && (
            <Tabs defaultValue="candidate" className="mt-3 md:mt-4">
              <TabsList className="grid w-full grid-cols-4 h-9 md:h-10">
                <TabsTrigger
                  value="candidate"
                  className="text-[11px] md:text-sm px-1"
                >
                  Candidate
                </TabsTrigger>
                <TabsTrigger
                  value="ward"
                  className="text-[11px] md:text-sm px-1"
                >
                  Ward
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="text-[11px] md:text-sm px-1"
                >
                  Docs
                </TabsTrigger>
                <TabsTrigger
                  value="status"
                  className="text-[11px] md:text-sm px-1"
                >
                  Status
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="candidate"
                className="space-y-3 md:space-y-4 mt-3 md:mt-4"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <User className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base md:text-lg font-semibold truncate">
                      {selectedNomination.candidateName}
                    </h3>
                    {selectedNomination.dateOfBirth && (
                      <p className="text-xs md:text-sm text-slate-500">
                        DOB:{" "}
                        {new Date(
                          selectedNomination.dateOfBirth,
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pt-3 md:pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] md:text-xs text-slate-500">
                        Phone
                      </p>
                      <p className="font-medium text-sm md:text-base">
                        {selectedNomination.applicantProfile?.user?.phone ||
                          "N/A"}
                      </p>
                    </div>
                  </div>
                  {selectedNomination.applicantProfile?.user?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] md:text-xs text-slate-500">
                          Email
                        </p>
                        <p className="font-medium text-sm md:text-base truncate">
                          {selectedNomination.applicantProfile.user.email}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {selectedNomination.address && (
                  <div className="flex items-start gap-2 pt-3 md:pt-4 border-t">
                    <Building className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] md:text-xs text-slate-500">
                        Address
                      </p>
                      <p className="text-sm">{selectedNomination.address}</p>
                    </div>
                  </div>
                )}
                <div className="pt-3 md:pt-4 border-t">
                  <p className="text-xs md:text-sm text-slate-500">
                    Political Affiliation
                  </p>
                  <p className="font-medium text-sm md:text-base">
                    {selectedNomination.politicalParty?.name ||
                      "Independent Candidate"}
                  </p>
                </div>
              </TabsContent>

              <TabsContent
                value="ward"
                className="space-y-3 md:space-y-4 mt-3 md:mt-4"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm md:text-base">
                      Ward {selectedNomination.ward.wardNo}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-500">
                      {selectedNomination.ward.wardName}
                    </p>
                  </div>
                </div>
                <div className="pt-3 md:pt-4 border-t">
                  <p className="text-xs md:text-sm text-slate-500">
                    Reservation Status
                  </p>
                  <Badge className="mt-1 text-xs">
                    {(selectedNomination.ward.reservationType || "N/A").replace(
                      /-/g,
                      " ",
                    )}
                  </Badge>
                </div>
              </TabsContent>

              <TabsContent
                value="documents"
                className="space-y-3 md:space-y-4 mt-3 md:mt-4"
              >
                {selectedNomination.documents &&
                selectedNomination.documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedNomination.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2.5 md:p-3 bg-slate-50 rounded-lg gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs md:text-sm font-medium truncate">
                              {doc.type.replace(/_/g, " ")}
                            </p>
                            <p className="text-[10px] md:text-xs text-slate-400 truncate">
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
                              className="h-7 md:h-8 text-xs shrink-0"
                            >
                              <Eye className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                              View
                            </Button>
                          </a>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="h-7 md:h-8 text-xs shrink-0"
                          >
                            No File
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No documents uploaded
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="status"
                className="space-y-3 md:space-y-4 mt-3 md:mt-4"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs md:text-sm text-slate-500">
                      Submitted On
                    </p>
                    <p className="font-medium text-sm md:text-base">
                      {new Date(
                        selectedNomination.submittedAt,
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="pt-3 md:pt-4 border-t">
                  <p className="text-xs md:text-sm text-slate-500 mb-2">
                    Current Status
                  </p>
                  {getStatusBadge(selectedNomination.status)}
                </div>
                {selectedNomination.paymentStatus && (
                  <div className="pt-3 md:pt-4 border-t">
                    <p className="text-xs md:text-sm text-slate-500">
                      Payment Status
                    </p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {selectedNomination.paymentStatus}
                    </Badge>
                  </div>
                )}
                {selectedNomination.scrutinyAt && (
                  <div className="pt-3 md:pt-4 border-t">
                    <p className="text-xs md:text-sm text-slate-500">
                      Scrutiny Date
                    </p>
                    <p className="font-medium text-sm">
                      {new Date(selectedNomination.scrutinyAt).toLocaleString()}
                    </p>
                    {selectedNomination.scrutinyRemarks && (
                      <p className="text-xs md:text-sm text-slate-500 mt-2">
                        Remarks: {selectedNomination.scrutinyRemarks}
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  OTP RECEIVE DIALOG                                                 */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
              <Phone className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              Receive Application
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Enter the OTP sent to your registered phone to confirm receipt of
              this application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3 md:py-4">
            <div className="flex flex-col items-center gap-3 md:gap-4">
              {isSendingReceiveOtp && !receiveOtpSent ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm text-slate-500">Sending OTP...</p>
                </div>
              ) : (
                <>
                  <p className="text-xs md:text-sm text-muted-foreground text-center">
                    Enter the 6-digit OTP sent to your registered mobile number
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
                    <p className="text-xs md:text-sm text-red-600">
                      {receiveOtpError}
                    </p>
                  )}
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs md:text-sm"
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
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsReceiveDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReceive}
              disabled={isReceiving || receiveOtp.length !== 6}
              className="w-full sm:w-auto"
            >
              {isReceiving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CheckCheck className="h-4 w-4 mr-2" />
              Verify & Receive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

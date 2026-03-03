"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Users,
  FileCheck,
  MapPin,
  Calendar,
  CheckCircle,
  CircleDot,
  Clock,
  ClipboardList,
  User,
  Loader2,
  Search,
  CheckCircle2,
  Phone,
  FileBarChart,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Home,
  ArrowRight,
  FolderOpen,
  Download,
  Send,
  CheckCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRODashboard } from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadForm18PDF } from "@/lib/form18-template";

// ---- Layered navigation types ----
interface ULBData {
  id: string;
  name: string;
  type?: string;
  district?: { name: string };
  wardCount: number;
  nominationCount: number;
}

interface WardData {
  id: string;
  wardNo: number;
  wardName: string;
  reservationType?: string;
  nominationCount: number;
  acceptedCount: number;
  pendingCount: number;
}

interface NominationRow {
  id: string;
  applicationNo: string;
  candidateName: string;
  status: string;
  submittedAt: string;
  ward?: { wardNo: number };
  politicalParty?: { abbreviation: string };
  applicantProfile?: { user: { phone: string } };
}

type NavLayer = "ulbs" | "wards" | "applicants";

function OTPVerificationDialog({
  open,
  onOpenChange,
  onVerify,
  title,
  description,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (otp: string) => void;
  title: string;
  description: string;
  isLoading: boolean;
}) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }
    setError("");
    onVerify(otp);
  };

  useEffect(() => {
    if (!open) {
      setOtp("");
      setError("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[94vw] rounded-xl p-2.5 sm:p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-lg">
            <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-[9px] sm:text-[10px] md:text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2.5 sm:space-y-3 md:space-y-4 py-2 sm:py-3 md:py-4">
          <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4">
            <p className="text-[9px] sm:text-[10px] md:text-sm text-muted-foreground text-center">
              Enter the 6-digit OTP sent to your registered mobile number
            </p>
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
            {error && (
              <p className="text-[9px] sm:text-[10px] md:text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={isLoading}
            className="w-full sm:w-auto h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-sm"
          >
            {isLoading && (
              <Loader2 className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
            )}
            Verify & Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ROPanel() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const { data, isLoading, error, refetch } = useRODashboard();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpAction, setOtpAction] = useState<{
    type: string;
    nominationId: string;
    newStatus: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ---- Layered navigation state ----
  const [navLayer, setNavLayer] = useState<NavLayer>("ulbs");
  const [selectedULB, setSelectedULB] = useState<ULBData | null>(null);
  const [selectedWard, setSelectedWard] = useState<WardData | null>(null);
  const [ulbList, setUlbList] = useState<ULBData[]>([]);
  const [wardList, setWardList] = useState<WardData[]>([]);
  const [nominationRows, setNominationRows] = useState<NominationRow[]>([]);
  const [layerLoading, setLayerLoading] = useState(false);

  // Fetch wards scoped to RO's jurisdiction and group by ULB
  const fetchULBs = useCallback(async () => {
    setLayerLoading(true);
    try {
      const res = await fetch("/api/ro/wards");
      const result = await res.json();
      if (!result.success) return;
      const map = new Map<string, ULBData>();
      for (const w of result.data) {
        const uid = w.ulb?.id || "__unknown";
        if (!map.has(uid)) {
          map.set(uid, {
            id: uid,
            name: w.ulb?.name || "Unknown",
            type: w.ulb?.type,
            district: w.ulb?.district,
            wardCount: 0,
            nominationCount: 0,
          });
        }
        const entry = map.get(uid)!;
        entry.wardCount++;
        entry.nominationCount += w._count?.nominations || 0;
      }
      setUlbList(Array.from(map.values()));
    } finally {
      setLayerLoading(false);
    }
  }, []);

  // Fetch wards for a specific ULB from jurisdiction-scoped API
  const fetchWards = useCallback(async (ulbId: string) => {
    setLayerLoading(true);
    try {
      const res = await fetch("/api/ro/wards");
      const result = await res.json();
      if (!result.success) return;
      const filtered = (result.data as Array<{
        id: string; wardNo: number; wardName: string;
        reservationType?: string; ulb?: { id: string };
        _count?: { nominations: number };
      }>).filter((w) => w.ulb?.id === ulbId);

      const wardsWithStats: WardData[] = await Promise.all(
        filtered.map(async (w) => {
          try {
            const nr = await fetch(`/api/ro/applications?wardId=${w.id}`);
            const nResult = await nr.json();
            const noms: Array<{ status: string }> = nResult.success ? nResult.data : [];
            return {
              id: w.id,
              wardNo: w.wardNo,
              wardName: w.wardName,
              reservationType: w.reservationType,
              nominationCount: noms.length,
              acceptedCount: noms.filter((n) => n.status === "ACCEPTED" || n.status === "CONTESTING").length,
              pendingCount: noms.filter((n) => ["SUBMITTED", "RECEIVED", "UNDER_SCRUTINY"].includes(n.status)).length,
            };
          } catch {
            return {
              id: w.id, wardNo: w.wardNo, wardName: w.wardName,
              reservationType: w.reservationType,
              nominationCount: w._count?.nominations || 0,
              acceptedCount: 0, pendingCount: 0,
            };
          }
        })
      );
      setWardList(wardsWithStats);
    } finally {
      setLayerLoading(false);
    }
  }, []);

  // Fetch applications for a ward
  const fetchNominations = useCallback(async (wardId: string) => {
    setLayerLoading(true);
    try {
      const res = await fetch(`/api/ro/applications?wardId=${wardId}`);
      const result = await res.json();
      if (result.success) setNominationRows(result.data);
    } finally {
      setLayerLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchULBs();
  }, [fetchULBs]);

  const handleULBClick = (ulb: ULBData) => {
    setSelectedULB(ulb);
    setNavLayer("wards");
    fetchWards(ulb.id);
  };

  const handleWardClick = (ward: WardData) => {
    setSelectedWard(ward);
    setNavLayer("applicants");
    fetchNominations(ward.id);
  };

  const navTo = (layer: NavLayer) => {
    if (layer === "ulbs") { setSelectedULB(null); setSelectedWard(null); }
    if (layer === "wards") { setSelectedWard(null); }
    setNavLayer(layer);
  };

  const handleQuickReceive = async (nominationId: string) => {
    try {
      const r = await fetch(`/api/ro/applications/${nominationId}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RECEIPT_CONFIRMATION" }),
      });
      const rr = await r.json();
      if (!rr.success) return;
    } catch { return; }
    setOtpAction({ type: "RECEIVE", nominationId, newStatus: "RECEIVED" });
    setOtpDialogOpen(true);
  };

  const handleQuickScrutiny = async (nominationId: string) => {
    try {
      const r = await fetch(`/api/ro/applications/${nominationId}/scrutiny`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "START" }),
      });
      const rr = await r.json();
      if (rr.success && selectedWard) fetchNominations(selectedWard.id);
    } catch { /* ignore */ }
  };

  if (isLoading) {
    return (
      <div className="space-y-2.5 sm:space-y-3 md:space-y-5 p-2 sm:p-3 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <Skeleton className="h-4 sm:h-5 md:h-6 w-32 sm:w-40 md:w-48" />
            <Skeleton className="h-3 sm:h-3 md:h-4 w-20 sm:w-28 md:w-32 mt-1.5 sm:mt-2" />
          </div>
          <Skeleton className="h-7 sm:h-8 w-20 sm:w-24 md:w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5 sm:gap-2 md:gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border-0 shadow-sm rounded-xl">
              <CardContent className="p-2 sm:p-3 md:p-4">
                <Skeleton className="h-12 sm:h-14 md:h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 md:gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="border-0 shadow-sm rounded-xl">
              <CardContent className="p-2 sm:p-3 md:p-4">
                <Skeleton className="h-36 sm:h-44 md:h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] sm:min-h-[300px] md:min-h-[400px] gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4">
        <AlertTriangle className="h-7 w-7 sm:h-10 sm:w-10 md:h-12 md:w-12 text-amber-500" />
        <p className="text-[10px] sm:text-sm md:text-base text-slate-600 text-center">
          {error}
        </p>
        <Button
          onClick={refetch}
          variant="outline"
          size="sm"
          className="h-7 sm:h-8 text-[10px] sm:text-xs md:text-sm"
        >
          <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const {
    user,
    jurisdiction,
    stats,
    wardWiseStats,
    recentNominations,
    electionSchedule,
    daysRemaining,
    currentPhase,
  } = data;

  const nominationStatusData = [
    { name: "Submitted", value: stats.pendingReceipt, color: "#22c55e" },
    { name: "Received", value: stats.pendingScrutiny, color: "#3b82f6" },
    { name: "Approved", value: stats.approved, color: "#f59e0b" },
    { name: "Rejected", value: stats.rejected, color: "#ef4444" },
    { name: "Contesting", value: stats.contesting, color: "#8b5cf6" },
  ].filter((item) => item.value > 0);

  const wardChartData = wardWiseStats.map((w) => ({
    name: `W${w.wardNo}`,
    fullName: `Ward ${w.wardNo}`,
    total: w.total,
    pending: w.pending,
    approved: w.approved,
    rejected: w.rejected,
  }));

  const getStatusBadge = (status: string) => {
    const configMap: Record<string, { bg: string; text: string }> = {
      submitted: { bg: "bg-emerald-100", text: "text-emerald-700" },
      received: { bg: "bg-blue-100", text: "text-blue-700" },
      accepted: { bg: "bg-green-100", text: "text-green-700" },
      rejected: { bg: "bg-red-100", text: "text-red-700" },
      withdrawn: { bg: "bg-gray-100", text: "text-gray-700" },
      contesting: { bg: "bg-purple-100", text: "text-purple-700" },
    };
    const config = configMap[status.toLowerCase()] || {
      bg: "bg-slate-100",
      text: "text-slate-700",
    };
    return (
      <Badge
        className={`${config.bg} ${config.text} text-[8px] sm:text-[9px] md:text-xs`}
      >
        {status}
      </Badge>
    );
  };

  const handleStatusUpdate = async (
    nominationId: string,
    newStatus: string,
    actionType: string,
  ) => {
    try {
      let otpAction: string;
      switch (actionType.toUpperCase()) {
        case "RECEIVE":
          otpAction = "RECEIPT_CONFIRMATION";
          break;
        case "SCRUTINY":
          otpAction = "SCRUTINY";
          break;
        case "WITHDRAW":
          otpAction = "WITHDRAWAL";
          break;
        default:
          otpAction = "RECEIPT_CONFIRMATION";
      }

      const sendOtpRes = await fetch(
        `/api/ro/applications/${nominationId}/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: otpAction }),
        },
      );
      const sendOtpResult = await sendOtpRes.json();
      if (!sendOtpResult.success) {
        console.error("Failed to send OTP:", sendOtpResult.error);
        return;
      }
    } catch (err) {
      console.error("Failed to send OTP:", err);
      return;
    }

    setOtpAction({ type: actionType, nominationId, newStatus });
    setOtpDialogOpen(true);
  };

  const handleOtpVerify = async (otp: string) => {
    if (!otpAction) return;

    setIsProcessing(true);
    try {
      let endpoint: string;
      let body: Record<string, unknown>;

      switch (otpAction.type.toUpperCase()) {
        case "RECEIVE":
          endpoint = `/api/ro/applications/${otpAction.nominationId}/receive`;
          body = { otp };
          break;
        case "SCRUTINY":
          endpoint = `/api/ro/applications/${otpAction.nominationId}/scrutiny`;
          body = {
            decision:
              otpAction.newStatus === "ACCEPTED" ? "ACCEPTED" : "REJECTED",
            otp,
          };
          break;
        case "WITHDRAW":
          endpoint = `/api/ro/applications/${otpAction.nominationId}/withdraw`;
          body = { reason: "Withdrawal processed via dashboard", otp };
          break;
        default:
          endpoint = `/api/ro/applications/${otpAction.nominationId}/receive`;
          body = { otp };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (result.success) refetch();
    } catch (err) {
      console.error("Status update failed:", err);
    } finally {
      setIsProcessing(false);
      setOtpDialogOpen(false);
      setOtpAction(null);
    }
  };

  const getFilteredNominations = () => {
    let filtered = nominationRows;
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(
        (n) => n.status.toLowerCase() === statusFilter.toLowerCase(),
      );
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.candidateName?.toLowerCase().includes(q) ||
          n.applicationNo?.toLowerCase().includes(q),
      );
    }
    return filtered;
  };

  return (
    <div className="space-y-2.5 sm:space-y-3 md:space-y-5 p-2 sm:p-3 md:p-6 min-h-screen w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 md:gap-3">
        <div className="min-w-0">
          <h1 className="text-xs sm:text-sm md:text-xl font-semibold text-slate-800 truncate">
            Returning Officer Dashboard
          </h1>
          <p className="text-[9px] sm:text-[10px] md:text-sm text-slate-500 mt-0.5 truncate">
            {jurisdiction.ulb} - {jurisdiction.district}
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="h-6 sm:h-7 md:h-8 text-[9px] sm:text-[10px] md:text-sm px-2 sm:px-3"
          >
            <RefreshCw
              className={`h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 mr-0.5 sm:mr-1 md:mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white rounded-lg shadow-sm">
            <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-slate-500" />
            <span className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-700 truncate max-w-[80px] md:max-w-none">
              {user.name}
            </span>
          </div>
        </div>
      </div>

      {/* Jurisdiction Info */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-0 shadow-sm rounded-xl">
        <CardContent className="p-2 sm:p-2.5 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 min-w-0">
              <div className="p-1 sm:p-1.5 md:p-2 bg-white rounded-lg shadow-sm shrink-0">
                <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-5 md:w-5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] md:text-sm font-medium text-slate-800 truncate">
                  Your Jurisdiction
                </p>
                <p className="text-[8px] sm:text-[9px] md:text-xs text-slate-500 truncate">
                  {jurisdiction.district} • {jurisdiction.ulb} •{" "}
                  {jurisdiction.wards.length} Ward(s)
                </p>
              </div>
            </div>
            <Badge className="bg-indigo-100 text-indigo-700 text-[7px] sm:text-[9px] md:text-xs shrink-0">
              {currentPhase.replace("_", " ")}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-1 sm:gap-1.5 md:gap-4">
        {[
          {
            bg: "bg-emerald-50",
            icon: FileCheck,
            iconColor: "text-emerald-600",
            badgeBg: "bg-emerald-100",
            badgeText: "text-emerald-700",
            badge: "Total",
            value: stats.totalNominations,
            label: "Nominations",
          },
          {
            bg: "bg-blue-50",
            icon: Users,
            iconColor: "text-blue-600",
            badgeBg: "bg-blue-100",
            badgeText: "text-blue-700",
            badge: "Unique",
            value: stats.uniqueCandidates,
            label: "Candidates",
          },
          {
            bg: "bg-amber-50",
            icon: Clock,
            iconColor: "text-amber-600",
            badgeBg: "bg-amber-100",
            badgeText: "text-amber-700",
            badge: "Pending",
            value: stats.pendingReceipt + stats.pendingScrutiny,
            label: "Pending Actions",
          },
          {
            bg: "bg-green-50",
            icon: CheckCircle2,
            iconColor: "text-green-600",
            badgeBg: "bg-green-100",
            badgeText: "text-green-700",
            badge: "Done",
            value: stats.approved,
            label: "Accepted",
          },
          {
            bg: "bg-rose-50",
            icon: Calendar,
            iconColor: "text-rose-600",
            badgeBg: "bg-rose-100",
            badgeText: "text-rose-700",
            badge: electionSchedule.find((s) => s.highlight)?.date || "Mar 8",
            value:
              daysRemaining !== null && daysRemaining > 0 ? daysRemaining : "—",
            label: "Days Left",
            colSpan: true,
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className={`${stat.bg} border-0 shadow-sm rounded-xl ${stat.colSpan ? "col-span-2 md:col-span-1" : ""}`}
          >
            <CardContent className="p-1.5 sm:p-2 md:p-4">
              <div className="flex items-center justify-between">
                <stat.icon
                  className={`h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-5 md:w-5 ${stat.iconColor}`}
                />
                <Badge
                  className={`${stat.badgeBg} ${stat.badgeText} text-[7px] sm:text-[8px] md:text-xs px-0.5 sm:px-1 md:px-1.5 h-3.5 sm:h-4 md:h-auto`}
                >
                  {stat.badge}
                </Badge>
              </div>
              <div className="mt-1 sm:mt-1.5 md:mt-3">
                <p className="text-base sm:text-lg md:text-2xl font-bold text-slate-800">
                  {stat.value}
                </p>
                <p className="text-[7px] sm:text-[8px] md:text-xs text-slate-500 mt-0 md:mt-0.5">
                  {stat.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-6">
        {/* Pie Chart */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-0.5 sm:pb-1 md:pb-2 px-2 sm:px-3 md:px-4 pt-2 sm:pt-3 md:pt-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="p-0.5 sm:p-1 md:p-1.5 bg-indigo-100 rounded-lg">
                <FileBarChart className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-indigo-600" />
              </div>
              <CardTitle className="text-[9px] sm:text-[10px] md:text-sm font-semibold text-slate-800">
                Nomination Status
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4">
            {nominationStatusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie
                      data={nominationStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={50}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {nominationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 md:gap-4 mt-1.5 sm:mt-2 md:mt-4">
                  {nominationStatusData.map((status, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-0.5 sm:gap-1"
                    >
                      <div
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 rounded-full shrink-0"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="text-[7px] sm:text-[8px] md:text-xs text-slate-600">
                        {status.name}: {status.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[130px] flex items-center justify-center text-slate-400 text-[10px] sm:text-xs md:text-sm">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-0.5 sm:pb-1 md:pb-2 px-2 sm:px-3 md:px-4 pt-2 sm:pt-3 md:pt-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="p-0.5 sm:p-1 md:p-1.5 bg-purple-100 rounded-lg">
                <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-purple-600" />
              </div>
              <CardTitle className="text-[9px] sm:text-[10px] md:text-sm font-semibold text-slate-800">
                Ward-wise Nominations
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4">
            {wardChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={wardChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 7 }} />
                  <YAxis tick={{ fontSize: 7 }} />
                  <Tooltip
                    labelFormatter={(label) => {
                      const item = wardChartData.find((w) => w.name === label);
                      return item?.fullName || label;
                    }}
                  />
                  <Bar
                    dataKey="approved"
                    stackId="a"
                    fill="#22c55e"
                    name="Approved"
                  />
                  <Bar
                    dataKey="pending"
                    stackId="a"
                    fill="#f59e0b"
                    name="Pending"
                  />
                  <Bar
                    dataKey="rejected"
                    stackId="a"
                    fill="#ef4444"
                    name="Rejected"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[130px] flex items-center justify-center text-slate-400 text-[10px] sm:text-xs md:text-sm">
                No ward data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Layered Jurisdiction Navigation ── */}
      <Card className="bg-white border-0 shadow-sm rounded-xl">
        <CardHeader className="pb-1 px-2 sm:px-3 md:px-4 pt-2 sm:pt-3 md:pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] md:text-xs flex-wrap">
              <button
                onClick={() => navTo("ulbs")}
                className={`flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-slate-100 transition-colors ${
                  navLayer === "ulbs" ? "text-indigo-600 font-semibold" : "text-slate-500"
                }`}
              >
                <Home className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                <span>Municipalities</span>
              </button>
              {selectedULB && (
                <>
                  <ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-slate-300 shrink-0" />
                  <button
                    onClick={() => navTo("wards")}
                    className={`flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-slate-100 transition-colors ${
                      navLayer === "wards" ? "text-indigo-600 font-semibold" : "text-slate-500"
                    }`}
                  >
                    <Building2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                    <span className="truncate max-w-[80px] sm:max-w-none">{selectedULB.name}</span>
                  </button>
                </>
              )}
              {selectedWard && (
                <>
                  <ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-slate-300 shrink-0" />
                  <span className="text-indigo-600 font-semibold px-1 flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                    <span className="truncate max-w-[80px] sm:max-w-none">Ward {selectedWard.wardNo} – {selectedWard.wardName}</span>
                  </span>
                </>
              )}
            </nav>

            {/* Search (applicants layer only) */}
            {navLayer === "applicants" && (
              <div className="flex items-center gap-1">
                <div className="relative">
                  <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 sm:h-3 sm:w-3 text-slate-400" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-5 sm:pl-6 h-6 sm:h-7 w-28 sm:w-36 text-[9px] sm:text-[10px]"
                  />
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4">
          {layerLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 sm:h-24 rounded-xl" />)}
            </div>
          ) : (
            <>
              {/* ── ULB cards ── */}
              {navLayer === "ulbs" && (
                ulbList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-400 text-[10px] sm:text-xs">
                    <Building2 className="h-8 w-8 mb-1 opacity-40" />
                    No municipalities in your jurisdiction
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {ulbList.map((ulb) => (
                      <button
                        key={ulb.id}
                        onClick={() => handleULBClick(ulb)}
                        className="text-left p-2.5 sm:p-3 md:p-4 rounded-xl border border-slate-100 bg-gradient-to-br from-indigo-50 to-white hover:shadow-md hover:border-indigo-200 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors shrink-0">
                              <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[10px] sm:text-xs md:text-sm text-slate-800 truncate">{ulb.name}</p>
                              <p className="text-[8px] sm:text-[9px] text-slate-500 truncate">
                                {ulb.district?.name}{ulb.type ? ` • ${ulb.type}` : ""}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0 mt-0.5" />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 mt-2 sm:mt-3">
                          <div className="bg-white rounded-lg p-1.5 text-center shadow-sm">
                            <p className="text-sm sm:text-base font-bold text-slate-800">{ulb.wardCount}</p>
                            <p className="text-[8px] sm:text-[9px] text-slate-500">Wards</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-1.5 text-center">
                            <p className="text-sm sm:text-base font-bold text-blue-700">{ulb.nominationCount}</p>
                            <p className="text-[8px] sm:text-[9px] text-slate-500">Nominations</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              )}

              {/* ── Ward cards ── */}
              {navLayer === "wards" && (
                wardList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-400 text-[10px] sm:text-xs">
                    <MapPin className="h-8 w-8 mb-1 opacity-40" />
                    No wards found
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {wardList.map((ward) => (
                      <button
                        key={ward.id}
                        onClick={() => handleWardClick(ward)}
                        className="text-left p-2.5 sm:p-3 md:p-4 rounded-xl border border-slate-100 bg-gradient-to-br from-emerald-50 to-white hover:shadow-md hover:border-emerald-200 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors shrink-0">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[10px] sm:text-xs md:text-sm text-slate-800">
                                Ward {ward.wardNo}
                              </p>
                              <p className="text-[8px] sm:text-[9px] text-slate-500 truncate">{ward.wardName}</p>
                            </div>
                          </div>
                          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0 mt-0.5" />
                        </div>
                        {ward.reservationType && (
                          <Badge variant="outline" className="mt-1.5 text-[8px] sm:text-[9px] h-4">
                            {ward.reservationType}
                          </Badge>
                        )}
                        <div className="grid grid-cols-3 gap-1 mt-2">
                          <div className="bg-blue-50 rounded-lg p-1 text-center">
                            <p className="text-xs sm:text-sm font-bold text-blue-700">{ward.nominationCount}</p>
                            <p className="text-[7px] sm:text-[8px] text-slate-500">Total</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-1 text-center">
                            <p className="text-xs sm:text-sm font-bold text-green-700">{ward.acceptedCount}</p>
                            <p className="text-[7px] sm:text-[8px] text-slate-500">Accepted</p>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-1 text-center">
                            <p className="text-xs sm:text-sm font-bold text-amber-700">{ward.pendingCount}</p>
                            <p className="text-[7px] sm:text-[8px] text-slate-500">Pending</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              )}

              {/* ── Applicants table ── */}
              {navLayer === "applicants" && (
                getFilteredNominations().length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-400 text-[10px] sm:text-xs">
                    <FolderOpen className="h-8 w-8 mb-1 opacity-40" />
                    No applications found
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-1">
                    <Table className="text-[9px] sm:text-[10px] md:text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[8px] sm:text-[9px] md:text-xs">App No.</TableHead>
                          <TableHead className="text-[8px] sm:text-[9px] md:text-xs">Candidate</TableHead>
                          <TableHead className="text-[8px] sm:text-[9px] md:text-xs hidden sm:table-cell">Party</TableHead>
                          <TableHead className="text-[8px] sm:text-[9px] md:text-xs">Status</TableHead>
                          <TableHead className="text-[8px] sm:text-[9px] md:text-xs hidden md:table-cell">Submitted</TableHead>
                          <TableHead className="text-[8px] sm:text-[9px] md:text-xs w-[70px] sm:w-[90px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredNominations().map((n) => (
                          <TableRow key={n.id}>
                            <TableCell className="font-mono font-medium">{n.applicationNo}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 sm:gap-1.5">
                                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                  <User className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-indigo-600" />
                                </div>
                                <div>
                                  <p className="font-medium truncate max-w-[80px] sm:max-w-[120px]">{n.candidateName}</p>
                                  <p className="text-slate-400 text-[7px] sm:text-[8px] truncate">{n.applicantProfile?.user?.phone || ""}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {n.politicalParty
                                ? <Badge variant="outline" className="text-[7px] sm:text-[8px] h-4">{n.politicalParty.abbreviation}</Badge>
                                : <span className="text-slate-400">Ind.</span>}
                            </TableCell>
                            <TableCell>{getStatusBadge(n.status)}</TableCell>
                            <TableCell className="hidden md:table-cell text-slate-500">
                              {n.submittedAt ? new Date(n.submittedAt).toLocaleDateString() : ""}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-0.5">
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-5 w-5 sm:h-6 sm:w-6"
                                  onClick={() => downloadForm18PDF(n.id)}
                                  title="Download Form"
                                >
                                  <Download className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                </Button>
                                {n.status === "SUBMITTED" && (
                                  <Button
                                    variant="ghost" size="icon"
                                    className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 hover:bg-green-50"
                                    onClick={() => handleQuickReceive(n.id)}
                                    title="Receive Application"
                                  >
                                    <CheckCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  </Button>
                                )}
                                {n.status === "RECEIVED" && (
                                  <Button
                                    variant="ghost" size="icon"
                                    className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 hover:bg-blue-50"
                                    onClick={() => handleQuickScrutiny(n.id)}
                                    title="Start Scrutiny"
                                  >
                                    <Send className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Election Schedule */}
      <Card className="bg-white border-0 shadow-sm rounded-xl">
        <CardHeader className="pb-0.5 sm:pb-1 md:pb-2 px-2 sm:px-3 md:px-4 pt-2 sm:pt-3 md:pt-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="p-0.5 sm:p-1 md:p-1.5 bg-rose-100 rounded-lg">
              <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-rose-600" />
            </div>
            <CardTitle className="text-[9px] sm:text-[10px] md:text-sm font-semibold text-slate-800">
              Election Schedule
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4">
          <div className="space-y-0.5 sm:space-y-1 md:space-y-2">
            {electionSchedule.map((event, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-1 sm:p-1.5 md:p-3 rounded-lg transition-colors gap-1.5 sm:gap-2 ${
                  event.highlight
                    ? "bg-rose-50 border border-rose-200"
                    : event.status === "completed"
                      ? "bg-green-50"
                      : event.status === "current"
                        ? "bg-amber-50"
                        : "bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1 sm:gap-1.5 md:gap-3 min-w-0">
                  <div
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[7px] sm:text-[8px] md:text-xs font-medium shrink-0 ${
                      event.status === "completed"
                        ? "bg-green-200 text-green-700"
                        : event.status === "current"
                          ? "bg-amber-200 text-amber-700"
                          : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {event.slNo}
                  </div>
                  <span
                    className={`text-[8px] sm:text-[9px] md:text-sm truncate ${event.highlight ? "font-medium text-rose-700" : "text-slate-700"}`}
                  >
                    {event.event}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 shrink-0">
                  <span
                    className={`text-[7px] sm:text-[8px] md:text-sm whitespace-nowrap ${event.highlight ? "font-medium text-rose-700" : "text-slate-600"}`}
                  >
                    {event.date}
                  </span>
                  {event.status === "completed" && (
                    <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-green-500" />
                  )}
                  {event.status === "current" && (
                    <CircleDot className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-amber-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <OTPVerificationDialog
        open={otpDialogOpen}
        onOpenChange={setOtpDialogOpen}
        onVerify={handleOtpVerify}
        title={otpAction?.type || "Verify Action"}
        description="This action requires OTP verification for security."
        isLoading={isProcessing}
      />
    </div>
  );
}

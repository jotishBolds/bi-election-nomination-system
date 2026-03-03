"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Eye,
  Download,
  Loader2,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Phone,
  FileBarChart,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Home,
  ArrowRight,
  FolderOpen,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useRODashboard } from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadForm18PDF } from "@/lib/form18-template";

// Types for layered navigation
interface ULBData {
  id: string;
  name: string;
  type?: string;
  district?: { name: string };
  wardCount: number;
  nominationCount: number;
  statusCounts: {
    submitted: number;
    received: number;
    underScrutiny: number;
    accepted: number;
    rejected: number;
    withdrawn: number;
    contesting: number;
  };
}

interface WardData {
  id: string;
  wardNo: number;
  wardName: string;
  reservationType?: string;
  nominationCount: number;
  statusCounts: {
    submitted: number;
    received: number;
    underScrutiny: number;
    accepted: number;
    rejected: number;
    withdrawn: number;
    contesting: number;
  };
}

interface NominationData {
  id: string;
  applicationNo: string;
  candidateName: string;
  fatherHusbandName?: string;
  status: string;
  submittedAt: string;
  gender?: string;
  category?: string;
  ward: {
    id: string;
    wardNo: number;
    wardName: string;
    reservationType?: string;
    ulb?: { name: string; district?: { name: string } };
  };
  politicalParty?: { name: string; abbreviation: string };
  allocatedSymbol?: { name: string; imagePath?: string };
  applicantProfile?: { user: { name: string; phone: string; email?: string } };
  documents?: Array<{ id: string; type: string; fileName: string }>;
}

// Navigation layers
type NavigationLayer = "ulbs" | "wards" | "applicants";

// OTP Verification Dialog Component
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground text-center">
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
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleVerify} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify & Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ROPanel() {
  const { data, isLoading, error, refetch } = useRODashboard();

  // Layered navigation state
  const [currentLayer, setCurrentLayer] = useState<NavigationLayer>("ulbs");
  const [selectedULB, setSelectedULB] = useState<ULBData | null>(null);
  const [selectedWard, setSelectedWard] = useState<WardData | null>(null);

  // Data states
  const [ulbs, setUlbs] = useState<ULBData[]>([]);
  const [wardsList, setWardsList] = useState<WardData[]>([]);
  const [nominations, setNominations] = useState<NominationData[]>([]);
  const [isLayerLoading, setIsLayerLoading] = useState(false);

  // Search state (global search available at all layers)
  const [searchQuery, setSearchQuery] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState<
    NominationData[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // OTP Dialog states
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpAction, setOtpAction] = useState<{
    type: string;
    nominationId: string;
    newStatus: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch wards data and group by ULB
  const fetchWardsAndGroup = useCallback(async () => {
    setIsLayerLoading(true);
    try {
      const response = await fetch("/api/ro/wards");
      const result = await response.json();
      if (result.success && result.data) {
        // Group wards by ULB
        const ulbMap = new Map<string, ULBData>();
        for (const ward of result.data) {
          const ulbId = ward.ulb?.id || "unknown";
          if (!ulbMap.has(ulbId)) {
            ulbMap.set(ulbId, {
              id: ulbId,
              name: ward.ulb?.name || "Unknown ULB",
              type: ward.ulb?.type,
              district: ward.ulb?.district,
              wardCount: 0,
              nominationCount: 0,
              statusCounts: {
                submitted: 0,
                received: 0,
                underScrutiny: 0,
                accepted: 0,
                rejected: 0,
                withdrawn: 0,
                contesting: 0,
              },
            });
          }
          const ulb = ulbMap.get(ulbId)!;
          ulb.wardCount++;
          ulb.nominationCount += ward._count?.nominations || 0;
        }
        setUlbs(Array.from(ulbMap.values()));

        // Also store the full wards data
        const wardsData: WardData[] = result.data.map(
          (w: {
            id: string;
            wardNo: number;
            wardName: string;
            reservationType?: string;
            _count?: { nominations: number };
          }) => ({
            id: w.id,
            wardNo: w.wardNo,
            wardName: w.wardName,
            reservationType: w.reservationType,
            nominationCount: w._count?.nominations || 0,
            statusCounts: {
              submitted: 0,
              received: 0,
              underScrutiny: 0,
              accepted: 0,
              rejected: 0,
              withdrawn: 0,
              contesting: 0,
            },
          }),
        );
        setWardsList(wardsData);
      }
    } catch {
      console.error("Failed to fetch wards");
    } finally {
      setIsLayerLoading(false);
    }
  }, []);

  // Fetch nominations for a specific ward and update counts
  const fetchWardNominations = async (wardId: string) => {
    setIsLayerLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("wardId", wardId);
      const response = await fetch(`/api/ro/applications?${params}`);
      const result = await response.json();
      if (result.success) {
        setNominations(result.data);
      }
    } catch {
      console.error("Failed to fetch nominations");
    } finally {
      setIsLayerLoading(false);
    }
  };

  // Fetch ward-level stats when ULB is selected
  const fetchULBWardStats = async (ulbId: string) => {
    setIsLayerLoading(true);
    try {
      const response = await fetch("/api/ro/wards");
      const result = await response.json();
      if (result.success && result.data) {
        const filteredWards = result.data.filter(
          (w: { ulb?: { id: string } }) => w.ulb?.id === ulbId,
        );

        // For each ward, fetch nomination status counts
        const wardsWithCounts: WardData[] = [];
        for (const ward of filteredWards) {
          const params = new URLSearchParams();
          params.append("wardId", ward.id);
          try {
            const nomRes = await fetch(`/api/ro/applications?${params}`);
            const nomResult = await nomRes.json();
            const noms = nomResult.success ? nomResult.data : [];
            const statusCounts = {
              submitted: noms.filter(
                (n: NominationData) => n.status === "SUBMITTED",
              ).length,
              received: noms.filter(
                (n: NominationData) => n.status === "RECEIVED",
              ).length,
              underScrutiny: noms.filter(
                (n: NominationData) => n.status === "UNDER_SCRUTINY",
              ).length,
              accepted: noms.filter(
                (n: NominationData) => n.status === "ACCEPTED",
              ).length,
              rejected: noms.filter(
                (n: NominationData) => n.status === "REJECTED",
              ).length,
              withdrawn: noms.filter(
                (n: NominationData) => n.status === "WITHDRAWN",
              ).length,
              contesting: noms.filter(
                (n: NominationData) => n.status === "CONTESTING",
              ).length,
            };
            wardsWithCounts.push({
              id: ward.id,
              wardNo: ward.wardNo,
              wardName: ward.wardName,
              reservationType: ward.reservationType,
              nominationCount: noms.length,
              statusCounts,
            });
          } catch {
            wardsWithCounts.push({
              id: ward.id,
              wardNo: ward.wardNo,
              wardName: ward.wardName,
              reservationType: ward.reservationType,
              nominationCount: ward._count?.nominations || 0,
              statusCounts: {
                submitted: 0,
                received: 0,
                underScrutiny: 0,
                accepted: 0,
                rejected: 0,
                withdrawn: 0,
                contesting: 0,
              },
            });
          }
        }
        setWardsList(wardsWithCounts);
      }
    } catch {
      console.error("Failed to fetch ULB ward stats");
    } finally {
      setIsLayerLoading(false);
    }
  };

  // Global search across all nominations
  const handleGlobalSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setShowSearchResults(false);
      setGlobalSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      params.append("search", query);
      const response = await fetch(`/api/ro/applications?${params}`);
      const result = await response.json();
      if (result.success) {
        setGlobalSearchResults(result.data);
        setShowSearchResults(true);
      }
    } catch {
      console.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleGlobalSearch(searchQuery);
      } else {
        setShowSearchResults(false);
        setGlobalSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Initial data fetch
  useEffect(() => {
    fetchWardsAndGroup();
  }, [fetchWardsAndGroup]);

  // Navigation handlers
  const handleULBClick = (ulb: ULBData) => {
    setSelectedULB(ulb);
    setCurrentLayer("wards");
    setShowSearchResults(false);
    setSearchQuery("");
    fetchULBWardStats(ulb.id);
  };

  const handleWardClick = (ward: WardData) => {
    setSelectedWard(ward);
    setCurrentLayer("applicants");
    setShowSearchResults(false);
    setSearchQuery("");
    fetchWardNominations(ward.id);
  };

  const navigateToLayer = (layer: NavigationLayer) => {
    if (layer === "ulbs") {
      setSelectedULB(null);
      setSelectedWard(null);
      setCurrentLayer("ulbs");
      setShowSearchResults(false);
      setSearchQuery("");
    } else if (layer === "wards") {
      setSelectedWard(null);
      setCurrentLayer("wards");
      setShowSearchResults(false);
      setSearchQuery("");
    }
  };

  // OTP flow for receive action
  const handleReceiveAction = async (nominationId: string) => {
    try {
      const sendOtpRes = await fetch(
        `/api/ro/applications/${nominationId}/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "RECEIPT_CONFIRMATION" }),
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
    setOtpAction({
      type: "RECEIVE",
      nominationId,
      newStatus: "RECEIVED",
    });
    setOtpDialogOpen(true);
  };

  // Start scrutiny action (no OTP needed)
  const handleStartScrutiny = async (nominationId: string) => {
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
        // Refresh the current ward's nominations
        if (selectedWard) {
          fetchWardNominations(selectedWard.id);
        }
        refetch();
      }
    } catch (err) {
      console.error("Failed to start scrutiny:", err);
    }
  };

  const handleOtpVerify = async (otp: string) => {
    if (!otpAction) return;
    setIsProcessing(true);
    try {
      const endpoint = `/api/ro/applications/${otpAction.nominationId}/receive`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const result = await response.json();
      if (result.success) {
        if (selectedWard) {
          fetchWardNominations(selectedWard.id);
        }
        refetch();
      }
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setIsProcessing(false);
      setOtpDialogOpen(false);
      setOtpAction(null);
    }
  };

  const handleDownloadForm = async (nominationId: string) => {
    try {
      await downloadForm18PDF(nominationId);
    } catch (err) {
      console.error("Failed to download form:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string }> = {
      DRAFT: { bg: "bg-slate-100", text: "text-slate-700" },
      SUBMITTED: { bg: "bg-emerald-100", text: "text-emerald-700" },
      RECEIVED: { bg: "bg-blue-100", text: "text-blue-700" },
      UNDER_SCRUTINY: { bg: "bg-amber-100", text: "text-amber-700" },
      ACCEPTED: { bg: "bg-green-100", text: "text-green-700" },
      REJECTED: { bg: "bg-red-100", text: "text-red-700" },
      WITHDRAWN: { bg: "bg-gray-100", text: "text-gray-700" },
      CONTESTING: { bg: "bg-purple-100", text: "text-purple-700" },
      ELECTED_UNOPPOSED: { bg: "bg-indigo-100", text: "text-indigo-700" },
    };
    const c = configs[status] || configs.DRAFT;
    return (
      <Badge className={`${c.bg} ${c.text} text-xs`}>
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-5 p-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-sm rounded-xl">
              <CardContent className="p-4">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <p className="text-slate-600">{error}</p>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const {
    user: roUser,
    jurisdiction,
    stats,
    wardWiseStats,
    electionSchedule,
    daysRemaining,
    currentPhase,
  } = data;

  // Chart data
  const nominationStatusData = [
    { name: "Submitted", value: stats.pendingReceipt, color: "#22c55e" },
    { name: "Received", value: stats.pendingScrutiny, color: "#3b82f6" },
    { name: "Accepted", value: stats.approved, color: "#f59e0b" },
    { name: "Rejected", value: stats.rejected, color: "#ef4444" },
    { name: "Contesting", value: stats.contesting, color: "#8b5cf6" },
  ].filter((item) => item.value > 0);

  const wardChartData = wardWiseStats.map((w) => ({
    name: `Ward ${w.wardNo}`,
    total: w.total,
    pending: w.pending,
    approved: w.approved,
    rejected: w.rejected,
  }));

  return (
    <div className="space-y-5 p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Returning Officer Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {jurisdiction.ulb} - {jurisdiction.district}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              fetchWardsAndGroup();
            }}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm">
            <User className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              {roUser.name}
            </span>
          </div>
        </div>
      </div>

      {/* Global Search Bar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search applicant by name, application no, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
              )}
            </div>
            {showSearchResults && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchResults(false);
                }}
              >
                Clear Search
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {showSearchResults && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Search Results ({globalSearchResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application No.</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Ward</TableHead>
                  <TableHead>ULB</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {globalSearchResults.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-slate-500"
                    >
                      No results found for &quot;{searchQuery}&quot;
                    </TableCell>
                  </TableRow>
                ) : (
                  globalSearchResults.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {n.applicationNo}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <span className="font-medium text-sm">
                            {n.candidateName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        Ward {n.ward?.wardNo}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {n.ward?.ulb?.name || "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(n.status)}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {new Date(n.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDownloadForm(n.id)}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          {n.status === "SUBMITTED" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-600"
                              onClick={() => handleReceiveAction(n.id)}
                            >
                              <CheckCheck className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Don't show layered nav when search results are shown */}
      {!showSearchResults && (
        <>
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-sm">
            <button
              onClick={() => navigateToLayer("ulbs")}
              className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors ${
                currentLayer === "ulbs"
                  ? "text-blue-600 font-medium"
                  : "text-slate-500"
              }`}
            >
              <Home className="h-3.5 w-3.5" />
              Municipalities
            </button>
            {selectedULB && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <button
                  onClick={() => navigateToLayer("wards")}
                  className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors ${
                    currentLayer === "wards"
                      ? "text-blue-600 font-medium"
                      : "text-slate-500"
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {selectedULB.name}
                </button>
              </>
            )}
            {selectedWard && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-blue-600 font-medium px-2 py-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Ward {selectedWard.wardNo} - {selectedWard.wardName}
                  </span>
                </span>
              </>
            )}
          </nav>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-emerald-50 border-0 shadow-sm rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <FileCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-slate-800">
                    {stats.totalNominations}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Total Nominations
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-0 shadow-sm rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-slate-800">
                    {stats.uniqueCandidates}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Candidates</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-0 shadow-sm rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-slate-800">
                    {stats.pendingReceipt + stats.pendingScrutiny}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-0 shadow-sm rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-slate-800">
                    {stats.approved}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Accepted</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-rose-50 border-0 shadow-sm rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Calendar className="h-5 w-5 text-rose-600" />
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-slate-800">
                    {daysRemaining !== null && daysRemaining > 0
                      ? daysRemaining
                      : "—"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Days Left</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Layer Content */}
          {currentLayer === "ulbs" && (
            <>
              {/* ULB Cards */}
              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-3">
                  Municipalities
                </h2>
                {isLayerLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-36 rounded-xl" />
                    ))}
                  </div>
                ) : ulbs.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-8 text-center text-slate-400">
                      <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      No municipalities found in your jurisdiction
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ulbs.map((ulb) => (
                      <Card
                        key={ulb.id}
                        className="border-0 shadow-sm rounded-xl cursor-pointer hover:shadow-md transition-shadow group"
                        onClick={() => handleULBClick(ulb)}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                                <Building2 className="h-5 w-5 text-indigo-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-800">
                                  {ulb.name}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {ulb.district?.name || ""}
                                  {ulb.type ? ` • ${ulb.type}` : ""}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors mt-1" />
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                              <p className="text-lg font-bold text-slate-800">
                                {ulb.wardCount}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                Wards
                              </p>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-2.5 text-center">
                              <p className="text-lg font-bold text-blue-700">
                                {ulb.nominationCount}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                Nominations
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Charts Section (only on ULB layer) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white border-0 shadow-sm rounded-xl">
                  <CardHeader className="pb-2 px-4 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-100 rounded-lg">
                        <FileBarChart className="h-4 w-4 text-indigo-600" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-slate-800">
                        Nomination Status
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {nominationStatusData.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={nominationStatusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
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
                        <div className="flex flex-wrap justify-center gap-4 mt-4">
                          {nominationStatusData.map((status, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: status.color }}
                              />
                              <span className="text-xs text-slate-600">
                                {status.name}: {status.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-slate-400">
                        No nomination data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-sm rounded-xl">
                  <CardHeader className="pb-2 px-4 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 rounded-lg">
                        <MapPin className="h-4 w-4 text-purple-600" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-slate-800">
                        Ward-wise Nominations
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {wardChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={wardChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
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
                      <div className="h-[200px] flex items-center justify-center text-slate-400">
                        No ward data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Election Schedule */}
              <Card className="bg-white border-0 shadow-sm rounded-xl">
                <CardHeader className="pb-2 px-4 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-rose-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-rose-600" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-slate-800">
                      Election Schedule
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {electionSchedule.map((event, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                          event.highlight
                            ? "bg-rose-50 border border-rose-200"
                            : event.status === "completed"
                              ? "bg-green-50"
                              : event.status === "current"
                                ? "bg-amber-50"
                                : "bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
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
                            className={`text-sm ${
                              event.highlight
                                ? "font-medium text-rose-700"
                                : "text-slate-700"
                            }`}
                          >
                            {event.event}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm ${
                              event.highlight
                                ? "font-medium text-rose-700"
                                : "text-slate-600"
                            }`}
                          >
                            {event.date}
                          </span>
                          {event.status === "completed" && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {event.status === "current" && (
                            <CircleDot className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Wards Layer */}
          {currentLayer === "wards" && (
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">
                Wards in {selectedULB?.name}
              </h2>
              {isLayerLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-40 rounded-xl" />
                  ))}
                </div>
              ) : wardsList.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center text-slate-400">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    No wards found
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wardsList.map((ward) => (
                    <Card
                      key={ward.id}
                      className="border-0 shadow-sm rounded-xl cursor-pointer hover:shadow-md transition-shadow group"
                      onClick={() => handleWardClick(ward)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                              <MapPin className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-800">
                                Ward {ward.wardNo}
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {ward.wardName}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors mt-1" />
                        </div>
                        {ward.reservationType && (
                          <Badge
                            variant="outline"
                            className="mt-3 text-xs"
                          >
                            {ward.reservationType}
                          </Badge>
                        )}
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="bg-blue-50 rounded-lg p-2 text-center">
                            <p className="text-sm font-bold text-blue-700">
                              {ward.nominationCount}
                            </p>
                            <p className="text-[10px] text-slate-500">Total</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2 text-center">
                            <p className="text-sm font-bold text-green-700">
                              {ward.statusCounts.accepted}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Accepted
                            </p>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-2 text-center">
                            <p className="text-sm font-bold text-amber-700">
                              {ward.statusCounts.submitted +
                                ward.statusCounts.received +
                                ward.statusCounts.underScrutiny}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Pending
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Applicants Layer */}
          {currentLayer === "applicants" && (
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">
                Applications in Ward {selectedWard?.wardNo} -{" "}
                {selectedWard?.wardName}
              </h2>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  {isLayerLoading ? (
                    <div className="p-6">
                      <Skeleton className="h-[300px] w-full" />
                    </div>
                  ) : nominations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <FolderOpen className="h-12 w-12 mb-2 opacity-50" />
                      <p>No applications found in this ward</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Application No.</TableHead>
                          <TableHead>Candidate</TableHead>
                          <TableHead>Party</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead className="w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {nominations.map((n) => (
                          <TableRow key={n.id}>
                            <TableCell className="font-mono text-sm font-medium">
                              {n.applicationNo}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                                  <User className="h-3.5 w-3.5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-slate-800">
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
                                <Badge variant="outline" className="text-xs">
                                  {n.politicalParty.abbreviation}
                                </Badge>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  Independent
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(n.status)}</TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {new Date(n.submittedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleDownloadForm(n.id)}
                                  title="Download Form"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                                {n.status === "SUBMITTED" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => handleReceiveAction(n.id)}
                                    title="Receive Application"
                                  >
                                    <CheckCheck className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {n.status === "RECEIVED" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => handleStartScrutiny(n.id)}
                                    title="Start Scrutiny"
                                  >
                                    <Send className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* OTP Verification Dialog */}
      <OTPVerificationDialog
        open={otpDialogOpen}
        onOpenChange={setOtpDialogOpen}
        onVerify={handleOtpVerify}
        title="Receive Application"
        description="This action requires OTP verification for security."
        isLoading={isProcessing}
      />
    </div>
  );
}

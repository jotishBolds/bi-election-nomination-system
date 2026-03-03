"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Building2,
  Users,
  FileCheck,
  MapPin,
  Calendar,
  CheckCircle,
  CircleDot,
  Clock,
  ClipboardList,
  TrendingUp,
  User,
  Eye,
  Download,
  Loader2,
  FileText,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Phone,
  FileBarChart,
  MoreVertical,
  RefreshCw,
  AlertTriangle,
  Trophy,
  UserX,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useRODashboard } from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

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
      <DialogContent className="sm:max-w-md w-[95vw] rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
            <Phone className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-3 md:py-4">
          <div className="flex flex-col items-center gap-3 md:gap-4">
            <p className="text-xs md:text-sm text-muted-foreground text-center">
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
              <p className="text-xs md:text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [wardFilter, setWardFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // OTP Dialog states
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpAction, setOtpAction] = useState<{
    type: string;
    nominationId: string;
    newStatus: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-5 p-3 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Skeleton className="h-5 md:h-6 w-40 md:w-48" />
            <Skeleton className="h-3 md:h-4 w-28 md:w-32 mt-2" />
          </div>
          <Skeleton className="h-8 w-24 md:w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border-0 shadow-sm rounded-xl">
              <CardContent className="p-3 md:p-4">
                <Skeleton className="h-16 md:h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="border-0 shadow-sm rounded-xl">
              <CardContent className="p-3 md:p-4">
                <Skeleton className="h-48 md:h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] gap-3 md:gap-4 p-4">
        <AlertTriangle className="h-10 w-10 md:h-12 md:w-12 text-amber-500" />
        <p className="text-sm md:text-base text-slate-600 text-center">
          {error}
        </p>
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

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

  // Status chart data
  const nominationStatusData = [
    { name: "Submitted", value: stats.pendingReceipt, color: "#22c55e" },
    { name: "Received", value: stats.pendingScrutiny, color: "#3b82f6" },
    { name: "Approved", value: stats.approved, color: "#f59e0b" },
    { name: "Rejected", value: stats.rejected, color: "#ef4444" },
    { name: "Contesting", value: stats.contesting, color: "#8b5cf6" },
  ].filter((item) => item.value > 0);

  // Ward chart data
  const wardChartData = wardWiseStats.map((w) => ({
    name: `W${w.wardNo}`,
    fullName: `Ward ${w.wardNo}`,
    total: w.total,
    pending: w.pending,
    approved: w.approved,
    rejected: w.rejected,
  }));

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "submitted":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 text-[10px] md:text-xs">
            Submitted
          </Badge>
        );
      case "received":
        return (
          <Badge className="bg-blue-100 text-blue-700 text-[10px] md:text-xs">
            Received
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="bg-green-100 text-green-700 text-[10px] md:text-xs">
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 text-[10px] md:text-xs">
            Rejected
          </Badge>
        );
      case "withdrawn":
        return (
          <Badge className="bg-gray-100 text-gray-700 text-[10px] md:text-xs">
            Withdrawn
          </Badge>
        );
      case "contesting":
        return (
          <Badge className="bg-purple-100 text-purple-700 text-[10px] md:text-xs">
            Contesting
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 text-[10px] md:text-xs">
            {status}
          </Badge>
        );
    }
  };

  // Handle status update with OTP
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
      if (result.success) {
        refetch();
      }
    } catch (err) {
      console.error("Status update failed:", err);
    } finally {
      setIsProcessing(false);
      setOtpDialogOpen(false);
      setOtpAction(null);
    }
  };

  // Filter nominations
  const getFilteredNominations = () => {
    let filtered = recentNominations;

    if (wardFilter && wardFilter !== "all") {
      filtered = filtered.filter((n) => n.wardName === wardFilter);
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(
        (n) => n.status.toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.candidateName?.toLowerCase().includes(query) ||
          n.applicationNo?.toLowerCase().includes(query) ||
          n.wardName?.toLowerCase().includes(query),
      );
    }

    return filtered;
  };

  // ==================== DASHBOARD VIEW ====================
  return (
    <div className="space-y-4 md:space-y-5 p-3 md:p-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3">
        <div>
          <h1 className="text-base md:text-xl font-semibold text-slate-800">
            Returning Officer Dashboard
          </h1>
          <p className="text-[11px] md:text-sm text-slate-500 mt-0.5">
            {jurisdiction.ulb} - {jurisdiction.district}
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="h-8 text-xs md:text-sm"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm">
            <User className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              {user.name}
            </span>
          </div>
        </div>
      </div>

      {/* Jurisdiction Info */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-0 shadow-sm rounded-xl">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 md:gap-4 min-w-0">
              <div className="p-1.5 md:p-2 bg-white rounded-lg shadow-sm shrink-0">
                <Building2 className="h-4 w-4 md:h-5 md:w-5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm font-medium text-slate-800 truncate">
                  Your Jurisdiction
                </p>
                <p className="text-[10px] md:text-xs text-slate-500 truncate">
                  {jurisdiction.district} • {jurisdiction.ulb} •{" "}
                  {jurisdiction.wards.length} Ward(s)
                </p>
              </div>
            </div>
            <Badge className="bg-indigo-100 text-indigo-700 text-[10px] md:text-xs shrink-0">
              {currentPhase.replace("_", " ")}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
        <Card className="bg-emerald-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <FileCheck className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
              <Badge className="bg-emerald-100 text-emerald-700 text-[9px] md:text-xs">
                Total
              </Badge>
            </div>
            <div className="mt-2 md:mt-3">
              <p className="text-xl md:text-2xl font-bold text-slate-800">
                {stats.totalNominations}
              </p>
              <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">
                Nominations
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-700 text-[9px] md:text-xs">
                Unique
              </Badge>
            </div>
            <div className="mt-2 md:mt-3">
              <p className="text-xl md:text-2xl font-bold text-slate-800">
                {stats.uniqueCandidates}
              </p>
              <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">
                Candidates
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
              <Badge className="bg-amber-100 text-amber-700 text-[9px] md:text-xs">
                Pending
              </Badge>
            </div>
            <div className="mt-2 md:mt-3">
              <p className="text-xl md:text-2xl font-bold text-slate-800">
                {stats.pendingReceipt + stats.pendingScrutiny}
              </p>
              <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">
                Pending Actions
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
              <Badge className="bg-green-100 text-green-700 text-[9px] md:text-xs">
                Done
              </Badge>
            </div>
            <div className="mt-2 md:mt-3">
              <p className="text-xl md:text-2xl font-bold text-slate-800">
                {stats.approved}
              </p>
              <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">
                Accepted
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50 border-0 shadow-sm rounded-xl col-span-2 md:col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-rose-600" />
              <span className="text-[10px] md:text-xs text-slate-500">
                {electionSchedule.find((s) => s.highlight)?.date || "Mar 8"}
              </span>
            </div>
            <div className="mt-2 md:mt-3">
              <p className="text-xl md:text-2xl font-bold text-slate-800">
                {daysRemaining !== null && daysRemaining > 0
                  ? daysRemaining
                  : "—"}
              </p>
              <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">
                Days Left
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Status Chart */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-1 md:pb-2 px-3 md:px-4 pt-3 md:pt-4">
            <div className="flex items-center gap-2">
              <div className="p-1 md:p-1.5 bg-indigo-100 rounded-lg">
                <FileBarChart className="h-3.5 w-3.5 md:h-4 md:w-4 text-indigo-600" />
              </div>
              <CardTitle className="text-xs md:text-sm font-semibold text-slate-800">
                Nomination Status
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-3 md:px-4 pb-3 md:pb-4">
            {nominationStatusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={nominationStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
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
                <div className="flex flex-wrap justify-center gap-2 md:gap-4 mt-3 md:mt-4">
                  {nominationStatusData.map((status, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="text-[10px] md:text-xs text-slate-600">
                        {status.name}: {status.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">
                No nomination data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ward-wise Stats */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-1 md:pb-2 px-3 md:px-4 pt-3 md:pt-4">
            <div className="flex items-center gap-2">
              <div className="p-1 md:p-1.5 bg-purple-100 rounded-lg">
                <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-600" />
              </div>
              <CardTitle className="text-xs md:text-sm font-semibold text-slate-800">
                Ward-wise Nominations
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-3 md:px-4 pb-3 md:pb-4">
            {wardChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={wardChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
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
              <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">
                No ward data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Nominations */}
      <Card className="bg-white border-0 shadow-sm rounded-xl">
        <CardHeader className="pb-2 px-3 md:px-4 pt-3 md:pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1 md:p-1.5 bg-emerald-100 rounded-lg">
                <ClipboardList className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-600" />
              </div>
              <CardTitle className="text-xs md:text-sm font-semibold text-slate-800">
                Recent Nominations
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 h-8 w-full sm:w-36 md:w-40 text-xs"
                />
              </div>
              <Select value={wardFilter} onValueChange={setWardFilter}>
                <SelectTrigger className="h-8 w-28 md:w-32 text-xs">
                  <SelectValue placeholder="All Wards" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wards</SelectItem>
                  {jurisdiction.wards.map((ward) => (
                    <SelectItem key={ward} value={ward}>
                      {ward}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 md:px-4 pb-3 md:pb-4">
          <div className="space-y-1.5 md:space-y-2">
            {getFilteredNominations().length > 0 ? (
              getFilteredNominations().map((nomination) => (
                <div
                  key={nomination.id}
                  className="flex items-center justify-between p-2.5 md:p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors gap-2"
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium text-slate-800 truncate">
                        {nomination.candidateName}
                      </p>
                      <p className="text-[10px] md:text-xs text-slate-500 truncate">
                        {nomination.applicationNo} • {nomination.wardName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                    {getStatusBadge(nomination.status)}
                    <span className="text-[10px] md:text-xs text-slate-400 hidden sm:inline">
                      {nomination.submittedAt
                        ? new Date(nomination.submittedAt).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 md:py-8 text-slate-400 text-sm">
                No nominations found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Election Schedule */}
      <Card className="bg-white border-0 shadow-sm rounded-xl">
        <CardHeader className="pb-1 md:pb-2 px-3 md:px-4 pt-3 md:pt-4">
          <div className="flex items-center gap-2">
            <div className="p-1 md:p-1.5 bg-rose-100 rounded-lg">
              <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-rose-600" />
            </div>
            <CardTitle className="text-xs md:text-sm font-semibold text-slate-800">
              Election Schedule
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-3 md:px-4 pb-3 md:pb-4">
          <div className="space-y-1.5 md:space-y-2">
            {electionSchedule.map((event, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 md:p-3 rounded-lg transition-colors gap-2 ${
                  event.highlight
                    ? "bg-rose-50 border border-rose-200"
                    : event.status === "completed"
                      ? "bg-green-50"
                      : event.status === "current"
                        ? "bg-amber-50"
                        : "bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div
                    className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[9px] md:text-xs font-medium shrink-0 ${
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
                    className={`text-[11px] md:text-sm truncate ${event.highlight ? "font-medium text-rose-700" : "text-slate-700"}`}
                  >
                    {event.event}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                  <span
                    className={`text-[10px] md:text-sm whitespace-nowrap ${event.highlight ? "font-medium text-rose-700" : "text-slate-600"}`}
                  >
                    {event.date}
                  </span>
                  {event.status === "completed" && (
                    <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500" />
                  )}
                  {event.status === "current" && (
                    <CircleDot className="h-3.5 w-3.5 md:h-4 md:w-4 text-amber-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* OTP Verification Dialog */}
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

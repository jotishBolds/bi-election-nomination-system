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
      <div className="space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border-0 shadow-sm rounded-xl">
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="border-0 shadow-sm rounded-xl">
              <CardContent className="p-4">
                <Skeleton className="h-64 w-full" />
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
    name: `Ward ${w.wardNo}`,
    total: w.total,
    pending: w.pending,
    approved: w.approved,
    rejected: w.rejected,
  }));

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "submitted":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 text-xs">
            Submitted
          </Badge>
        );
      case "received":
        return (
          <Badge className="bg-blue-100 text-blue-700 text-xs">Received</Badge>
        );
      case "accepted":
        return (
          <Badge className="bg-green-100 text-green-700 text-xs">
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 text-xs">Rejected</Badge>
        );
      case "withdrawn":
        return (
          <Badge className="bg-gray-100 text-gray-700 text-xs">Withdrawn</Badge>
        );
      case "contesting":
        return (
          <Badge className="bg-purple-100 text-purple-700 text-xs">
            Contesting
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 text-xs">
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
    // First send the OTP
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

    // Apply ward filter
    if (wardFilter && wardFilter !== "all") {
      filtered = filtered.filter((n) => n.wardName === wardFilter);
    }

    // Apply status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(
        (n) => n.status.toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    // Apply search filter
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
            onClick={refetch}
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
              {user.name}
            </span>
          </div>
        </div>
      </div>

      {/* Jurisdiction Info */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-0 shadow-sm rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Building2 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Your Jurisdiction
                </p>
                <p className="text-xs text-slate-500">
                  {jurisdiction.district} • {jurisdiction.ulb} •{" "}
                  {jurisdiction.wards.length} Ward(s)
                </p>
              </div>
            </div>
            <Badge className="bg-indigo-100 text-indigo-700">
              {currentPhase.replace("_", " ")}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-emerald-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <FileCheck className="h-5 w-5 text-emerald-600" />
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                Total
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {stats.totalNominations}
              </p>
              <p className="text-xs text-slate-500 mt-1">Nominations</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-700 text-xs">
                Unique
              </Badge>
            </div>
            <div className="mt-3">
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
              <Badge className="bg-amber-100 text-amber-700 text-xs">
                Pending
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {stats.pendingReceipt + stats.pendingScrutiny}
              </p>
              <p className="text-xs text-slate-500 mt-1">Pending Actions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <Badge className="bg-green-100 text-green-700 text-xs">
                Done
              </Badge>
            </div>
            <div className="mt-3">
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
              <span className="text-xs text-slate-500">
                {electionSchedule.find((s) => s.highlight)?.date || "Mar 8"}
              </span>
            </div>
            <div className="mt-3">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Chart */}
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
                    <div key={index} className="flex items-center gap-2">
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

        {/* Ward-wise Stats */}
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

      {/* Recent Nominations */}
      <Card className="bg-white border-0 shadow-sm rounded-xl">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <ClipboardList className="h-4 w-4 text-emerald-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-800">
                Recent Nominations
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 h-8 w-40 text-xs"
                />
              </div>
              <Select value={wardFilter} onValueChange={setWardFilter}>
                <SelectTrigger className="h-8 w-32 text-xs">
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
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {getFilteredNominations().length > 0 ? (
              getFilteredNominations().map((nomination) => (
                <div
                  key={nomination.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {nomination.candidateName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {nomination.applicationNo} • {nomination.wardName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(nomination.status)}
                    <span className="text-xs text-slate-400">
                      {nomination.submittedAt
                        ? new Date(nomination.submittedAt).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                No nominations found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
                    className={`text-sm ${event.highlight ? "font-medium text-rose-700" : "text-slate-700"}`}
                  >
                    {event.event}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${event.highlight ? "font-medium text-rose-700" : "text-slate-600"}`}
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

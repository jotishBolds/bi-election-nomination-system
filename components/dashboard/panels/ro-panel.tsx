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
  ArrowRight,
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
  FileSearch,
  UserX,
  Trophy,
  FileBarChart,
  MoreVertical,
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
import html2PDF from "jspdf-html2canvas";

import { electionData } from "@/lib/election-data";
import {
  getRONominations,
  getUniqueNominations,
  getUniqueCandidatesCount,
  getTotalNominationsCount,
  StoredNomination,
  NominationStatus,
  updateNominationStatus,
  getAllWardsFromNominations,
} from "@/lib/nomination-storage";

// Mock OTP for demo
const MOCK_OTP = "123456";

// Calculate stats from election data
const totalDistricts = electionData.districts.length;
const totalULBs = electionData.districts.reduce(
  (sum, d) => sum + d.ulbs.length,
  0,
);

// Wards per constituency for chart
const wardsPerConstituency = () => {
  const constituencyMap = new Map<string, number>();

  electionData.districts.forEach((district) => {
    district.ulbs.forEach((ulb) => {
      ulb.wards.forEach((ward) => {
        if (ward.constituency) {
          constituencyMap.set(
            ward.constituency,
            (constituencyMap.get(ward.constituency) || 0) + 1,
          );
        }
      });
    });
  });

  return Array.from(constituencyMap.entries()).map(([name, wards]) => ({
    name,
    wards,
  }));
};

// Election schedule with dates
const electionSchedule = [
  {
    slNo: "i",
    event: "Issue of Notification",
    date: "01.03.2026",
    highlight: false,
  },
  {
    slNo: "ii",
    event: "Last date for making nomination",
    date: "08.03.2026",
    highlight: true,
  },
  {
    slNo: "iii",
    event: "Date for scrutiny of Nomination",
    date: "09.03.2026",
    highlight: false,
  },
  {
    slNo: "iv",
    event: "Last date for withdrawal",
    date: "11.03.2026",
    highlight: false,
  },
  {
    slNo: "v",
    event: "Date of Poll (if necessary)",
    date: "31.03.2026",
    highlight: false,
  },
  {
    slNo: "vi",
    event: "Election completion date",
    date: "06.04.2026",
    highlight: false,
  },
  {
    slNo: "-",
    event: "Counting of votes",
    date: "03.04.2026",
    highlight: false,
  },
];

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

  const handleVerify = () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }
    if (otp !== MOCK_OTP) {
      setError("Invalid OTP. Use 123456 for demo.");
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
            <p className="text-xs text-muted-foreground">
              Demo OTP: <span className="font-mono font-bold">123456</span>
            </p>
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

  const [nominations, setNominations] = useState<StoredNomination[]>([]);
  const [uniqueCandidates, setUniqueCandidates] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [selectedSubmission, setSelectedSubmission] =
    useState<StoredNomination | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [wardFilter, setWardFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [availableWards, setAvailableWards] = useState<string[]>([]);

  // OTP Dialog states
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpAction, setOtpAction] = useState<{
    type: string;
    nominationId: string;
    newStatus: NominationStatus;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load nominations data
  useEffect(() => {
    const loadNominations = () => {
      const allNominations = getUniqueNominations();
      setNominations(allNominations);
      setUniqueCandidates(getUniqueCandidatesCount());
      setTotalSubmissions(getTotalNominationsCount());
      setAvailableWards(getAllWardsFromNominations());
    };

    loadNominations();
    const interval = setInterval(loadNominations, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter nominations
  const getFilteredNominations = (
    allowedStatuses?: NominationStatus | NominationStatus[],
  ) => {
    let filtered = nominations;

    // Apply allowed status filter (from tab requirements)
    if (allowedStatuses) {
      const statusArray = Array.isArray(allowedStatuses)
        ? allowedStatuses
        : [allowedStatuses];
      filtered = filtered.filter((n) => statusArray.includes(n.status));
    }

    // Apply user-selected status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((n) => n.status === statusFilter);
    }

    // Apply ward filter
    if (wardFilter && wardFilter !== "all") {
      filtered = filtered.filter(
        (n) => n.formData?.municipalWard === wardFilter,
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.formData?.candidateName?.toLowerCase().includes(query) ||
          n.applicationId?.toLowerCase().includes(query) ||
          n.formData?.municipalWard?.toLowerCase().includes(query),
      );
    }

    return filtered;
  };

  // Handle status update with OTP
  const handleStatusUpdate = (
    nominationId: string,
    newStatus: NominationStatus,
    actionType: string,
  ) => {
    setOtpAction({ type: actionType, nominationId, newStatus });
    setOtpDialogOpen(true);
  };

  const handleOtpVerify = () => {
    if (!otpAction) return;

    setIsProcessing(true);

    // Simulate processing
    setTimeout(() => {
      const additionalData: Partial<StoredNomination> = {};

      if (otpAction.newStatus === "received") {
        additionalData.receivedAt = new Date().toISOString();
      } else if (otpAction.newStatus === "approved") {
        additionalData.scrutinyDate = new Date().toISOString();
        additionalData.scrutinyResult = "accepted";
      } else if (otpAction.newStatus === "rejected") {
        additionalData.scrutinyDate = new Date().toISOString();
        additionalData.scrutinyResult = "rejected";
      } else if (otpAction.newStatus === "withdrawn") {
        additionalData.withdrawnAt = new Date().toISOString();
      }

      const success = updateNominationStatus(
        otpAction.nominationId,
        otpAction.newStatus,
        additionalData,
      );

      if (success) {
        // Reload nominations
        const allNominations = getUniqueNominations();
        setNominations(allNominations);
      }

      setIsProcessing(false);
      setOtpDialogOpen(false);
      setOtpAction(null);
    }, 1000);
  };

  // Dynamic nomination status data
  const nominationStatusData = [
    {
      name: "Submitted",
      value: nominations.filter((n) => n.status === "submitted").length,
      color: "#22c55e",
    },
    {
      name: "Received",
      value: nominations.filter((n) => n.status === "received").length,
      color: "#3b82f6",
    },
    {
      name: "Approved",
      value: nominations.filter((n) => n.status === "approved").length,
      color: "#f59e0b",
    },
    {
      name: "Rejected",
      value: nominations.filter((n) => n.status === "rejected").length,
      color: "#ef4444",
    },
    {
      name: "Contesting",
      value: nominations.filter((n) => n.status === "contesting").length,
      color: "#8b5cf6",
    },
  ];

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: "General",
      sc: "Scheduled Caste",
      st_bl: "Scheduled Tribe (BL)",
      st_lt: "Scheduled Tribe (LT)",
      obc_central: "OBC (Central List)",
      obc_state: "OBC (State List)",
    };
    return labels[category] || category;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
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
      case "under_review":
        return (
          <Badge className="bg-amber-100 text-amber-700 text-xs">
            Under Review
          </Badge>
        );
      case "approved":
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
          <Badge className="bg-slate-100 text-slate-700 text-xs">Draft</Badge>
        );
    }
  };

  const generateFormHTML = (
    formData: NominationFormData,
    submissionNumber: number,
    applicationId: string,
  ) => {
    const currentDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    return `
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 18pt; font-weight: bold; margin: 0 0 8px 0;">FORM-18</h1>
        <p style="font-size: 10pt; color: #666666; margin: 0 0 8px 0;">[See sub-rule (3) of rule 25]</p>
        <h2 style="font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 0 0 8px 0;">NOMINATION PAPER</h2>
        <p style="font-size: 11pt; color: #666666; margin: 0;">Municipality Election 2026</p>
      </div>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      <div style="margin-bottom: 24px;">
        <p style="margin: 12px 0;">* I nominate as an applicant for election to the <strong>${formData.municipality || ""}</strong> Municipality from the <strong>${formData.municipalWard || ""}</strong> Municipal ward.</p>
        <p style="margin: 12px 0;">Applicant's name: <strong>${formData.candidateName || ""}</strong></p>
        <p style="margin: 12px 0;">Father's / Husband's name: <strong>${formData.fatherOrHusbandName || ""}</strong></p>
        <p style="margin: 12px 0;">Full postal address: <strong>${formData.fullPostalAddress || ""}</strong></p>
        <p style="margin: 16px 0;">Proposer name: <strong>${formData.proposerName || ""}</strong> at Serial No. <strong>${formData.proposerSerialNo || ""}</strong> in Part No. <strong>${formData.proposerPartNo || ""}</strong></p>
        <p style="margin: 12px 0;">Date of Birth: <strong>${formData.dateOfBirth || ""}</strong> | Age: <strong>${formData.age || ""}</strong> years</p>
        <p style="margin: 12px 0;">Political Party: <strong>${formData.politicalParty || ""}</strong></p>
        <p style="margin: 12px 0;">Symbol: <strong>${formData.partySymbol || ""}</strong></p>
        ${formData.category && formData.category !== "general" ? `<p style="margin: 12px 0;">Category: <strong>${getCategoryLabel(formData.category)}</strong></p>` : ""}
      </div>
      <div style="padding: 16px; background-color: #f0fdf4; border-radius: 8px; margin-top: 20px;">
        <p style="margin: 8px 0;"><strong>Application ID:</strong> ${applicationId}</p>
        <p style="margin: 8px 0;"><strong>Submission #:</strong> ${submissionNumber} of 3</p>
        <p style="margin: 8px 0;"><strong>Generated:</strong> ${currentDate}</p>
      </div>
    `;
  };

  const generatePDF = async (nomination: StoredNomination) => {
    setSelectedSubmission(nomination);
    setIsGeneratingPdf(true);

    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    tempDiv.style.width = "794px";
    tempDiv.style.fontFamily = "'Times New Roman', Times, serif";
    tempDiv.style.fontSize = "12pt";
    tempDiv.style.lineHeight = "1.6";
    tempDiv.style.backgroundColor = "#ffffff";
    tempDiv.style.color = "#000000";
    tempDiv.style.padding = "40px";

    tempDiv.innerHTML = generateFormHTML(
      nomination.formData,
      nomination.submissionNumber,
      nomination.applicationId,
    );

    document.body.appendChild(tempDiv);

    try {
      await html2PDF(tempDiv, {
        jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          scrollX: 0,
          scrollY: -window.scrollY,
          logging: false,
        },
        imageType: "image/jpeg",
        imageQuality: 0.98,
        margin: { top: 40, right: 40, bottom: 40, left: 40 },
        autoResize: true,
        output: `FORM-18_${nomination.formData.candidateName?.replace(/\s+/g, "_") || "Nomination"}_${nomination.applicationId}.pdf`,
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      document.body.removeChild(tempDiv);
      setIsGeneratingPdf(false);
    }
  };

  // Professional Filter/Search Component
  const FilterBar = ({
    showStatusFilter = false,
    statusOptions = [] as { value: string; label: string }[],
  }) => (
    <div className="p-4 mb-4 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Filter className="h-4 w-4 text-indigo-600" />
          </div>
          <span className="text-sm font-medium text-slate-700">Filters</span>
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search candidate, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <Select value={wardFilter} onValueChange={setWardFilter}>
            <SelectTrigger className="bg-white">
              <MapPin className="h-4 w-4 mr-2 text-slate-500" />
              <SelectValue placeholder="Select Ward" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Wards</SelectItem>
              {availableWards.map((ward) => (
                <SelectItem key={ward} value={ward}>
                  {ward}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showStatusFilter && statusOptions.length > 0 ? (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white">
                <CircleDot className="h-4 w-4 mr-2 text-slate-500" />
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-600 px-3 py-2 bg-white rounded-md border border-slate-200">
              <Badge variant="outline" className="bg-slate-50">
                {wardFilter === "all" ? "All Wards" : wardFilter}
              </Badge>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-500">
                {searchQuery
                  ? `Searching: "${searchQuery}"`
                  : "No search filter"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Nomination Card Component
  const NominationCard = ({
    nomination,
    actions,
  }: {
    nomination: StoredNomination;
    actions?: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
          <User className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">
            {nomination.formData.candidateName || "Unknown Candidate"}
          </p>
          <p className="text-xs text-slate-500">
            {nomination.applicationId} • {nomination.formData.municipality} -{" "}
            {nomination.formData.municipalWard}
          </p>
          <p className="text-xs text-slate-400">
            Submitted: {new Date(nomination.submittedAt).toLocaleString()} • #
            {nomination.submissionNumber}/3
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {getStatusBadge(nomination.status)}
        {actions}
      </div>
    </div>
  );

  // Import NominationFormData type
  type NominationFormData = StoredNomination["formData"];

  // ==================== APPLICATION LIST VIEW ====================
  if (activeTab === "applications") {
    const filteredNominations = getFilteredNominations([
      "submitted",
      "received",
    ]);

    return (
      <div className="space-y-5 p-6 min-h-screen">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">
                Application List
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {electionData.election} - All Submitted Applications
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm">
            <User className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              RO-GANGTOK
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  {totalSubmissions}
                </p>
                <p className="text-xs text-slate-500 mt-1">Total Submissions</p>
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
                  {uniqueCandidates}
                </p>
                <p className="text-xs text-slate-500 mt-1">Unique Candidates</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-0 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Clock className="h-5 w-5 text-amber-600" />
                <Badge className="bg-amber-100 text-amber-700 text-xs">
                  New
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-slate-800">
                  {nominations.filter((n) => n.status === "submitted").length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Pending Receipt</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-indigo-50 border-0 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <CheckCircle className="h-5 w-5 text-indigo-600" />
                <Badge className="bg-indigo-100 text-indigo-700 text-xs">
                  Received
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-slate-800">
                  {nominations.filter((n) => n.status === "received").length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Marked Received</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Nominations Table */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <ClipboardList className="h-4 w-4 text-indigo-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  All Applications
                </CardTitle>
              </div>
              <Badge className="bg-indigo-100 text-indigo-700 text-xs">
                {filteredNominations.length} records
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <FilterBar
              showStatusFilter={true}
              statusOptions={[
                { value: "submitted", label: "Submitted" },
                { value: "received", label: "Received" },
              ]}
            />

            {filteredNominations.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-600 mb-2">
                  No Applications Found
                </h3>
                <p className="text-sm text-slate-400">
                  No applications match your search criteria.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNominations.map((nomination) => (
                  <NominationCard
                    key={nomination.id}
                    nomination={nomination}
                    actions={
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  Nomination Form -{" "}
                                  {nomination.formData.candidateName}
                                </DialogTitle>
                              </DialogHeader>
                              <div
                                className="p-6 bg-white"
                                style={{
                                  fontFamily: "'Times New Roman', Times, serif",
                                  fontSize: "12pt",
                                  lineHeight: "1.6",
                                }}
                              >
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: generateFormHTML(
                                      nomination.formData,
                                      nomination.submissionNumber,
                                      nomination.applicationId,
                                    ),
                                  }}
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                          <DropdownMenuItem
                            onClick={() => generatePDF(nomination)}
                            disabled={isGeneratingPdf}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {nomination.status === "submitted" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(
                                  nomination.id,
                                  "received",
                                  "Mark as Received",
                                )
                              }
                              className="text-blue-600"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark as Received
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* OTP Dialog */}
        <OTPVerificationDialog
          open={otpDialogOpen}
          onOpenChange={setOtpDialogOpen}
          onVerify={handleOtpVerify}
          title="Verify Status Change"
          description="Please verify with OTP to mark this application as received."
          isLoading={isProcessing}
        />
      </div>
    );
  }

  // ==================== SCRUTINY VIEW ====================
  if (activeTab === "scrutiny") {
    const receivedNominations = getFilteredNominations("received");

    return (
      <div className="space-y-5 p-6 min-h-screen">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">Scrutiny</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Review and verify received nominations
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-0 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <FileSearch className="h-5 w-5 text-blue-600" />
                <Badge className="bg-blue-100 text-blue-700 text-xs">
                  Pending
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-slate-800">
                  {nominations.filter((n) => n.status === "received").length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Awaiting Scrutiny</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-0 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <Badge className="bg-green-100 text-green-700 text-xs">
                  Accepted
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-slate-800">
                  {nominations.filter((n) => n.status === "approved").length}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Nominations Accepted
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-0 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <XCircle className="h-5 w-5 text-red-600" />
                <Badge className="bg-red-100 text-red-700 text-xs">
                  Rejected
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-slate-800">
                  {nominations.filter((n) => n.status === "rejected").length}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Nominations Rejected
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scrutiny List */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-lg">
                  <FileSearch className="h-4 w-4 text-amber-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Scrutiny Queue
                </CardTitle>
              </div>
              <Badge className="bg-amber-100 text-amber-700 text-xs">
                {receivedNominations.length} pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <FilterBar
              showStatusFilter={true}
              statusOptions={[
                { value: "received", label: "Pending Scrutiny" },
                { value: "approved", label: "Accepted" },
                { value: "rejected", label: "Rejected" },
              ]}
            />

            {receivedNominations.length === 0 ? (
              <div className="text-center py-12">
                <FileSearch className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-600 mb-2">
                  No Nominations for Scrutiny
                </h3>
                <p className="text-sm text-slate-400">
                  All received nominations have been processed.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {receivedNominations.map((nomination) => (
                  <NominationCard
                    key={nomination.id}
                    nomination={nomination}
                    actions={
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  Nomination Form -{" "}
                                  {nomination.formData.candidateName}
                                </DialogTitle>
                              </DialogHeader>
                              <div
                                className="p-6 bg-white"
                                style={{
                                  fontFamily: "'Times New Roman', Times, serif",
                                  fontSize: "12pt",
                                  lineHeight: "1.6",
                                }}
                              >
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: generateFormHTML(
                                      nomination.formData,
                                      nomination.submissionNumber,
                                      nomination.applicationId,
                                    ),
                                  }}
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                          <DropdownMenuSeparator />
                          {nomination.status === "received" && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusUpdate(
                                    nomination.id,
                                    "approved",
                                    "Accept Nomination",
                                  )
                                }
                                className="text-green-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Accept Nomination
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusUpdate(
                                    nomination.id,
                                    "rejected",
                                    "Reject Nomination",
                                  )
                                }
                                className="text-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject Nomination
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <OTPVerificationDialog
          open={otpDialogOpen}
          onOpenChange={setOtpDialogOpen}
          onVerify={handleOtpVerify}
          title="Verify Scrutiny Decision"
          description="Please verify with OTP to confirm the scrutiny decision."
          isLoading={isProcessing}
        />
      </div>
    );
  }

  // ==================== WITHDRAW VIEW ====================
  if (activeTab === "withdraw") {
    const acceptedNominations = getFilteredNominations("approved");
    const withdrawnNominations = getFilteredNominations("withdrawn");

    return (
      <div className="space-y-5 p-6 min-h-screen">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">
                Withdraw Management
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Process withdrawal requests from accepted candidates
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-green-50 border-0 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <Badge className="bg-green-100 text-green-700 text-xs">
                  Active
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-slate-800">
                  {acceptedNominations.length}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Accepted Nominations
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-50 border-0 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <UserX className="h-5 w-5 text-gray-600" />
                <Badge className="bg-gray-100 text-gray-700 text-xs">
                  Withdrawn
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-slate-800">
                  {withdrawnNominations.length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Total Withdrawals</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accepted Candidates for Withdrawal */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <UserX className="h-4 w-4 text-green-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Accepted Candidates
                </CardTitle>
              </div>
              <Badge className="bg-green-100 text-green-700 text-xs">
                {acceptedNominations.length} active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <FilterBar
              showStatusFilter={true}
              statusOptions={[
                { value: "approved", label: "Accepted / Active" },
                { value: "withdrawn", label: "Withdrawn" },
              ]}
            />

            {acceptedNominations.length === 0 ? (
              <div className="text-center py-12">
                <UserX className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-600 mb-2">
                  No Accepted Nominations
                </h3>
                <p className="text-sm text-slate-400">
                  Accepted nominations will appear here for withdrawal
                  processing.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {acceptedNominations.map((nomination) => (
                  <NominationCard
                    key={nomination.id}
                    nomination={nomination}
                    actions={
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  Nomination Form -{" "}
                                  {nomination.formData.candidateName}
                                </DialogTitle>
                              </DialogHeader>
                              <div
                                className="p-6 bg-white"
                                style={{
                                  fontFamily: "'Times New Roman', Times, serif",
                                  fontSize: "12pt",
                                  lineHeight: "1.6",
                                }}
                              >
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: generateFormHTML(
                                      nomination.formData,
                                      nomination.submissionNumber,
                                      nomination.applicationId,
                                    ),
                                  }}
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                          <DropdownMenuSeparator />
                          {nomination.status === "approved" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(
                                  nomination.id,
                                  "withdrawn",
                                  "Process Withdrawal",
                                )
                              }
                              className="text-amber-600"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Process Withdrawal
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawn List */}
        {withdrawnNominations.length > 0 && (
          <Card className="bg-white border-0 shadow-sm rounded-xl">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gray-100 rounded-lg">
                    <UserX className="h-4 w-4 text-gray-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-slate-800">
                    Withdrawn Candidates
                  </CardTitle>
                </div>
                <Badge className="bg-gray-100 text-gray-700 text-xs">
                  {withdrawnNominations.length} withdrawn
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-3">
                {withdrawnNominations.map((nomination) => (
                  <NominationCard key={nomination.id} nomination={nomination} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <OTPVerificationDialog
          open={otpDialogOpen}
          onOpenChange={setOtpDialogOpen}
          onVerify={handleOtpVerify}
          title="Verify Withdrawal"
          description="Please verify with OTP to process the withdrawal request."
          isLoading={isProcessing}
        />
      </div>
    );
  }

  // ==================== CONTEST LIST VIEW ====================
  if (activeTab === "contest") {
    const acceptedNominations = getFilteredNominations("approved");
    const contestingCandidates = getFilteredNominations("contesting");

    return (
      <div className="space-y-5 p-6 min-h-screen">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">
                Contest List
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Final list of contesting candidates
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-green-50 border-0 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <Badge className="bg-green-100 text-green-700 text-xs">
                  Accepted
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-slate-800">
                  {acceptedNominations.length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Ready for Contest</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-0 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Trophy className="h-5 w-5 text-purple-600" />
                <Badge className="bg-purple-100 text-purple-700 text-xs">
                  Final
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-slate-800">
                  {contestingCandidates.length}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Contesting Candidates
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accepted Candidates - Ready to Contest */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Accepted Candidates - Ready to Finalize
                </CardTitle>
              </div>
              <Badge className="bg-green-100 text-green-700 text-xs">
                {acceptedNominations.length} pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <FilterBar
              showStatusFilter={true}
              statusOptions={[
                { value: "approved", label: "Ready to Finalize" },
                { value: "contesting", label: "Finalized / Contesting" },
              ]}
            />

            {acceptedNominations.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-600 mb-2">
                  No Candidates Ready
                </h3>
                <p className="text-sm text-slate-400">
                  Accepted candidates who haven&apos;t withdrawn will appear
                  here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {acceptedNominations.map((nomination) => (
                  <NominationCard
                    key={nomination.id}
                    nomination={nomination}
                    actions={
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  Nomination Form -{" "}
                                  {nomination.formData.candidateName}
                                </DialogTitle>
                              </DialogHeader>
                              <div
                                className="p-6 bg-white"
                                style={{
                                  fontFamily: "'Times New Roman', Times, serif",
                                  fontSize: "12pt",
                                  lineHeight: "1.6",
                                }}
                              >
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: generateFormHTML(
                                      nomination.formData,
                                      nomination.submissionNumber,
                                      nomination.applicationId,
                                    ),
                                  }}
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                          <DropdownMenuSeparator />
                          {nomination.status === "approved" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(
                                  nomination.id,
                                  "contesting",
                                  "Finalize as Contesting",
                                )
                              }
                              className="text-purple-600"
                            >
                              <Trophy className="h-4 w-4 mr-2" />
                              Finalize as Contesting
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Final Contesting Candidates */}
        {contestingCandidates.length > 0 && (
          <Card className="bg-white border-0 shadow-sm rounded-xl border-purple-200">
            <CardHeader className="pb-2 px-4 pt-4 bg-purple-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <Trophy className="h-4 w-4 text-purple-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-slate-800">
                    Final Contesting Candidates
                  </CardTitle>
                </div>
                <Badge className="bg-purple-100 text-purple-700 text-xs">
                  {contestingCandidates.length} contesting
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-3">
                {contestingCandidates.map((nomination) => (
                  <div
                    key={nomination.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-purple-50 border border-purple-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {nomination.formData.candidateName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {nomination.formData.politicalParty} •{" "}
                          {nomination.formData.partySymbol}
                        </p>
                        <p className="text-xs text-slate-400">
                          {nomination.formData.municipality} -{" "}
                          {nomination.formData.municipalWard}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {nomination.formData.partySymbolImage && (
                        <img
                          src={nomination.formData.partySymbolImage}
                          alt={nomination.formData.partySymbol}
                          className="w-10 h-10 object-contain rounded border bg-white p-1"
                        />
                      )}
                      {getStatusBadge(nomination.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <OTPVerificationDialog
          open={otpDialogOpen}
          onOpenChange={setOtpDialogOpen}
          onVerify={handleOtpVerify}
          title="Finalize Contesting Candidate"
          description="Please verify with OTP to finalize this candidate as contesting."
          isLoading={isProcessing}
        />
      </div>
    );
  }

  // ==================== REPORTS VIEW ====================
  if (activeTab === "reports") {
    // Report definitions with simple, professional descriptions
    const reportForms = [
      {
        id: "form19",
        formTitle: "Nomination List",
        description:
          "Complete list of all nominations received for the election. Includes all candidates who have submitted their nomination papers.",
        color: "blue",
        icon: FileText,
        statusFilter: ["submitted", "received"] as NominationStatus[],
        filterLabel: "Total Nominations",
        buttonLabel: "Generate Report",
      },
      {
        id: "form20",
        formTitle: "Valid Candidates",
        description:
          "List of candidates whose nominations have been verified and accepted after the scrutiny process.",
        color: "green",
        icon: CheckCircle,
        statusFilter: ["approved", "contesting"] as NominationStatus[],
        filterLabel: "Accepted Nominations",
        buttonLabel: "Generate Report",
      },
      {
        id: "form22",
        formTitle: "Withdrawal Notice",
        description:
          "Record of candidates who have officially withdrawn their candidature from the election.",
        color: "amber",
        icon: UserX,
        statusFilter: ["withdrawn"] as NominationStatus[],
        filterLabel: "Withdrawn Candidates",
        buttonLabel: "Generate Report",
      },
      {
        id: "form23",
        formTitle: "Contesting Candidates",
        description:
          "Final list of candidates who will be contesting in the election after all withdrawals.",
        color: "purple",
        icon: Trophy,
        statusFilter: ["contesting"] as NominationStatus[],
        filterLabel: "Final Contestants",
        buttonLabel: "Generate Report",
      },
    ];

    const getColorClasses = (color: string) => {
      const colors: Record<
        string,
        {
          bg: string;
          border: string;
          text: string;
          iconBg: string;
          btnBg: string;
        }
      > = {
        blue: {
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-700",
          iconBg: "bg-blue-100",
          btnBg: "bg-blue-600 hover:bg-blue-700",
        },
        green: {
          bg: "bg-green-50",
          border: "border-green-200",
          text: "text-green-700",
          iconBg: "bg-green-100",
          btnBg: "bg-green-600 hover:bg-green-700",
        },
        amber: {
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-700",
          iconBg: "bg-amber-100",
          btnBg: "bg-amber-600 hover:bg-amber-700",
        },
        purple: {
          bg: "bg-purple-50",
          border: "border-purple-200",
          text: "text-purple-700",
          iconBg: "bg-purple-100",
          btnBg: "bg-purple-600 hover:bg-purple-700",
        },
      };
      return colors[color] || colors.blue;
    };

    // Get nominations filtered by status and ward
    const getReportNominations = (statusFilter: NominationStatus[]) => {
      let filtered = nominations.filter((n) => statusFilter.includes(n.status));
      if (wardFilter && wardFilter !== "all") {
        filtered = filtered.filter(
          (n) => n.formData?.municipalWard === wardFilter,
        );
      }
      return filtered;
    };

    // Group nominations by ward for ward-wise reporting
    const nominationsByWard = nominations.reduce(
      (acc, nom) => {
        const ward = nom.formData?.municipalWard || "Unknown";
        if (!acc[ward]) acc[ward] = [];
        acc[ward].push(nom);
        return acc;
      },
      {} as Record<string, StoredNomination[]>,
    );

    // Mock report generation (opens PDF or shows alert for demo)
    const generateReport = (
      formId: string,
      formTitle: string,
      statusFilter: NominationStatus[],
    ) => {
      const reportData = getReportNominations(statusFilter);
      if (reportData.length === 0) {
        alert(
          `No data available for ${formTitle}. Please select a ward with relevant nominations.`,
        );
        return;
      }
      // For demo, open the corresponding blank form PDF
      window.open(
        `/forms/FORM ${formId.replace("form", "").toUpperCase()}.pdf`,
        "_blank",
      );
    };

    return (
      <div className="space-y-5 p-6 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">
                Reports Generation
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Generate election reports as per ward selection
              </p>
            </div>
          </div>
        </div>

        {/* Professional Filter Bar */}
        <Card className="bg-white border shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Filter className="h-4 w-4 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  Filter Reports
                </span>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select value={wardFilter} onValueChange={setWardFilter}>
                  <SelectTrigger className="bg-white">
                    <MapPin className="h-4 w-4 mr-2 text-slate-500" />
                    <SelectValue placeholder="Select Ward" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Wards</SelectItem>
                    {availableWards.map((ward) => (
                      <SelectItem key={ward} value={ward}>
                        {ward}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search candidate..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-white"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Badge variant="outline" className="bg-slate-50">
                    {wardFilter === "all" ? "All Wards" : wardFilter}
                  </Badge>
                  <span>•</span>
                  <span>{nominations.length} Total Records</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Forms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {reportForms.map((form) => {
            const colors = getColorClasses(form.color);
            const reportData = getReportNominations(form.statusFilter);

            return (
              <Card
                key={form.id}
                className={`${colors.bg} ${colors.border} border shadow-sm rounded-xl overflow-hidden p-0`}
              >
                {/* Form Header */}
                <div
                  className={`px-4 py-3 ${colors.iconBg} border-b ${colors.border}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-white rounded-lg shadow-sm`}>
                        <form.icon className={`h-5 w-5 ${colors.text}`} />
                      </div>
                      <h3 className="font-semibold text-slate-800">
                        {form.formTitle}
                      </h3>
                    </div>
                    <Badge
                      className={`${colors.iconBg} ${colors.text} text-xs font-semibold`}
                    >
                      {reportData.length} Records
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4 space-y-4">
                  {/* Form Description */}
                  <p className="text-sm text-slate-600">{form.description}</p>

                  {/* Quick Stats */}
                  <div className="flex items-center justify-between text-sm p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-600">{form.filterLabel}</span>
                    <span className={`font-semibold ${colors.text}`}>
                      {wardFilter === "all"
                        ? `${reportData.length} across all wards`
                        : `${reportData.length} in ${wardFilter}`}
                    </span>
                  </div>

                  {/* Preview List (top 3) */}
                  {reportData.length > 0 && (
                    <div className="space-y-2">
                      {reportData.slice(0, 3).map((nom) => (
                        <div
                          key={nom.id}
                          className="flex items-center justify-between p-2 bg-white rounded-md text-xs"
                        >
                          <span className="font-medium text-slate-700">
                            {nom.formData.candidateName}
                          </span>
                          <span className="text-slate-500">
                            {nom.formData.municipalWard}
                          </span>
                        </div>
                      ))}
                      {reportData.length > 3 && (
                        <p className="text-xs text-slate-500 text-center">
                          + {reportData.length - 3} more
                        </p>
                      )}
                    </div>
                  )}

                  {/* Generate Button */}
                  <Button
                    className={`w-full ${colors.btnBg} text-white`}
                    onClick={() =>
                      generateReport(form.id, form.formTitle, form.statusFilter)
                    }
                    disabled={reportData.length === 0}
                  >
                    <FileBarChart className="h-4 w-4 mr-2" />
                    {form.buttonLabel}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Ward-wise Summary Table */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <FileBarChart className="h-4 w-4 text-indigo-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Ward-wise Summary
                </CardTitle>
              </div>
              <Badge variant="outline">
                {Object.keys(nominationsByWard).length} Wards
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Ward
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">
                      Total
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">
                      Submitted
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">
                      Received
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">
                      Accepted
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">
                      Rejected
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">
                      Withdrawn
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">
                      Contesting
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(nominationsByWard).map(([ward, noms]) => (
                    <tr key={ward} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium">{ward}</td>
                      <td className="text-center py-3 px-4">{noms.length}</td>
                      <td className="text-center py-3 px-4">
                        {noms.filter((n) => n.status === "submitted").length}
                      </td>
                      <td className="text-center py-3 px-4">
                        {noms.filter((n) => n.status === "received").length}
                      </td>
                      <td className="text-center py-3 px-4 text-green-600 font-medium">
                        {noms.filter((n) => n.status === "approved").length}
                      </td>
                      <td className="text-center py-3 px-4 text-red-600 font-medium">
                        {noms.filter((n) => n.status === "rejected").length}
                      </td>
                      <td className="text-center py-3 px-4 text-gray-600">
                        {noms.filter((n) => n.status === "withdrawn").length}
                      </td>
                      <td className="text-center py-3 px-4 text-purple-600 font-medium">
                        {noms.filter((n) => n.status === "contesting").length}
                      </td>
                    </tr>
                  ))}
                  {Object.keys(nominationsByWard).length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-8 text-slate-400"
                      >
                        No nominations data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==================== DEFAULT DASHBOARD VIEW ====================
  return (
    <div className="space-y-5 p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Returning Officer Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {electionData.election}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm">
          <User className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">RO-GANGTOK</span>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-blue-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="text-xs text-slate-500">
                {totalDistricts} Districts
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {electionData.totalWards}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total Wards</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Building2 className="h-5 w-5 text-purple-600" />
              <span className="text-xs text-slate-500">Municipal</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">{totalULBs}</p>
              <p className="text-xs text-slate-500 mt-1">Total ULBs</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <FileCheck className="h-5 w-5 text-amber-600" />
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs font-medium">
                Action
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {nominations.filter((n) => n.status === "submitted").length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Pending Receipt</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-emerald-600" />
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs font-medium">
                Active
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {uniqueCandidates}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total Candidates</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Calendar className="h-5 w-5 text-rose-600" />
              <span className="text-xs text-slate-500">Mar 8, 2026</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">40</p>
              <p className="text-xs text-slate-500 mt-1">Days Remaining</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {totalSubmissions > 0 && (
        <Card className="bg-indigo-50 border-indigo-200 border shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-indigo-800">
                    Applications Received
                  </h3>
                  <p className="text-sm text-indigo-600">
                    {totalSubmissions} application(s) from {uniqueCandidates}{" "}
                    candidate(s)
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                onClick={() =>
                  (window.location.href = "/dashboard?tab=applications")
                }
              >
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Wards by Constituency */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <MapPin className="h-4 w-4 text-indigo-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Wards by Constituency
                </CardTitle>
              </div>
              <span className="text-xs text-slate-400">
                {wardsPerConstituency().length} constituencies
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={wardsPerConstituency()}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 8, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="wards" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Nomination Status */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-teal-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Nomination Status
                </CardTitle>
              </div>
              <span className="text-xs text-slate-400">
                {totalSubmissions} total
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={nominationStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {nominationStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {nominationStatusData.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-600">{item.name}</span>
                  <span className="font-semibold text-slate-800">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Nominations */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-lg">
                  <ClipboardList className="h-4 w-4 text-amber-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Recent Applications
                </CardTitle>
              </div>
              <Badge className="bg-amber-100 text-amber-700 text-xs">
                {nominations.filter((n) => n.status === "submitted").length}{" "}
                pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {nominations.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No applications yet</p>
                <p className="text-xs text-slate-400">
                  Applications will appear here when submitted
                </p>
              </div>
            ) : (
              <>
                {nominations.slice(0, 4).map((nomination) => (
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
                          {nomination.formData.candidateName || "Unknown"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {nomination.formData.municipalWard},{" "}
                          {nomination.formData.district}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(nomination.status)}
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-slate-800 hover:bg-slate-700"
                        onClick={() =>
                          (window.location.href = "/dashboard?tab=applications")
                        }
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
                {nominations.length > 4 && (
                  <Button
                    variant="ghost"
                    className="w-full mt-2 text-slate-600"
                    onClick={() =>
                      (window.location.href = "/dashboard?tab=applications")
                    }
                  >
                    View All ({nominations.length}) Applications
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Election Schedule */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-pink-100 rounded-lg">
                <Calendar className="h-4 w-4 text-pink-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-800">
                Election Schedule
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {electionSchedule.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${item.highlight ? "bg-rose-100 border-2 border-rose-300" : "bg-slate-50 hover:bg-slate-100"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-xs font-medium text-slate-500">
                      {item.slNo}
                    </span>
                    {item.highlight ? (
                      <Clock className="h-4 w-4 text-rose-600" />
                    ) : (
                      <CircleDot className="h-4 w-4 text-slate-400" />
                    )}
                    <span
                      className={`text-xs ${item.highlight ? "text-rose-800 font-semibold" : "text-slate-700"}`}
                    >
                      {item.event}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-md ${item.highlight ? "bg-rose-200 text-rose-800" : "bg-slate-100 text-slate-600"}`}
                  >
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
            {/* Countdown */}
            <div className="mt-3 p-3 rounded-xl bg-primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Nomination Deadline</p>
                  <p className="text-sm font-medium text-white mt-0.5">
                    March 8, 2026
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">40</p>
                  <p className="text-xs text-slate-400">days left</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

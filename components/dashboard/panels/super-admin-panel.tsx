"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  UserCog,
  Settings,
  Shield,
  Search,
  Plus,
  MoreHorizontal,
  Activity,
  Server,
  Database,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  User,
  Building2,
  Vote,
  MapPin,
  TrendingUp,
  FileText,
  Lock,
  RefreshCw,
  Eye,
  Calendar,
  ClipboardList,
  Download,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import html2PDF from "jspdf-html2canvas";

import { electionData } from "@/lib/election-data";
import {
  getAllNominations,
  getNominationsByStatus,
  getTotalPendingActionsCount,
  getUniqueCandidatesCount,
  StoredNomination,
} from "@/lib/nomination-storage";

const usersByRole = [
  { name: "Candidates", value: 156, color: "#6366f1" },
  { name: "ROs", value: 12, color: "#22c55e" },
  { name: "SES", value: 3, color: "#f59e0b" },
  { name: "Admins", value: 2, color: "#ec4899" },
];

const userActivityData = [
  { date: "Jan 20", logins: 45, actions: 120 },
  { date: "Jan 21", logins: 52, actions: 145 },
  { date: "Jan 22", logins: 78, actions: 210 },
  { date: "Jan 23", logins: 65, actions: 180 },
  { date: "Jan 24", logins: 88, actions: 245 },
  { date: "Jan 25", logins: 72, actions: 195 },
  { date: "Jan 26", logins: 89, actions: 260 },
];

const recentUsers = [
  {
    id: 1,
    name: "Tenzin Dorji",
    email: "tenzin@election.gov",
    role: "CANDIDATE",
    district: "GANGTOK",
    status: "active",
    lastLogin: "2 mins ago",
  },
  {
    id: 2,
    name: "Pema Sherpa",
    email: "pema@election.gov",
    role: "RO",
    district: "MANGAN",
    status: "active",
    lastLogin: "15 mins ago",
  },
  {
    id: 3,
    name: "Karma Wangchuk",
    email: "karma@election.gov",
    role: "SES",
    district: "STATE",
    status: "active",
    lastLogin: "1 hour ago",
  },
  {
    id: 4,
    name: "Dawa Lama",
    email: "dawa@election.gov",
    role: "CANDIDATE",
    district: "NAMCHI",
    status: "inactive",
    lastLogin: "2 days ago",
  },
  {
    id: 5,
    name: "Sonam Bhutia",
    email: "sonam@election.gov",
    role: "RO",
    district: "SORENG",
    status: "active",
    lastLogin: "30 mins ago",
  },
];

const roleConfigs = [
  {
    role: "SUPER_ADMIN",
    description: "Full system access",
    color: "bg-rose-50 text-rose-700",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
  {
    role: "SES",
    description: "State-level oversight",
    color: "bg-amber-50 text-amber-700",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    role: "RO",
    description: "District management",
    color: "bg-emerald-50 text-emerald-700",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    role: "CANDIDATE",
    description: "Nomination access",
    color: "bg-blue-50 text-blue-700",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
];

const systemHealth = [
  { metric: "API Response", value: 98.5, status: "good" },
  { metric: "Database", value: 99.9, status: "good" },
  { metric: "Storage", value: 67, status: "warning" },
  { metric: "Memory", value: 45, status: "good" },
];

const auditLogs = [
  {
    action: "User Created",
    user: "Admin",
    time: "10 mins ago",
    type: "create",
  },
  {
    action: "Role Updated",
    user: "Admin",
    time: "25 mins ago",
    type: "update",
  },
  {
    action: "Login Failed",
    user: "Unknown",
    time: "1 hour ago",
    type: "warning",
  },
  {
    action: "Backup Completed",
    user: "System",
    time: "2 hours ago",
    type: "system",
  },
];

const lastNominationDate = new Date("2026-03-08");
const today = new Date();
const daysRemaining = Math.ceil(
  (lastNominationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
);

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

export function SuperAdminPanel() {
  const [nominations, setNominations] = useState<StoredNomination[]>([]);
  const [nominationStatus, setNominationStatus] = useState({
    submitted: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
  });
  const [uniqueCandidates, setUniqueCandidates] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNomination, setSelectedNomination] =
    useState<StoredNomination | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const totalUsers = usersByRole.reduce((sum, r) => sum + r.value, 0);

  const loadData = () => {
    setIsLoading(true);
    try {
      setNominations(getAllNominations());
      setNominationStatus(getNominationsByStatus());
      setUniqueCandidates(getUniqueCandidatesCount());
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 text-xs">
            Submitted
          </Badge>
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
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 text-xs">Rejected</Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 text-xs">Draft</Badge>
        );
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-rose-100 text-rose-700";
      case "SES":
        return "bg-amber-100 text-amber-700";
      case "RO":
        return "bg-emerald-100 text-emerald-700";
      case "CANDIDATE":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const generateFormHTML = (
    formData: any,
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
        <p style="margin: 12px 0;">* I nominate as an applicant for election to the <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 200px;">${formData.municipality || ""}</span> Municipality from the <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 150px;">${formData.municipalWard || ""}</span> Municipal ward.</p>
        <p style="margin: 12px 0;">Applicant's name: <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 280px;">${formData.candidateName || ""}</span></p>
        <p style="margin: 12px 0;">Father's / Husband's name: <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 230px;">${formData.fatherOrHusbandName || ""}</span></p>
        <p style="margin: 12px 0;">Full postal address: <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 300px;">${formData.fullPostalAddress || ""}</span></p>
        <p style="margin: 16px 0;">My name is <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 120px;">${formData.proposerName || ""}</span> and it is entered at Serial No. <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 60px;">${formData.proposerSerialNo || ""}</span> in Part No. <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 60px;">${formData.proposerPartNo || ""}</span> of the electoral roll of the Municipality.</p>
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px;">
          <p style="margin: 0;">Date: <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 140px;">${currentDate}</span></p>
          <div style="text-align: center;"><div style="border-top: 1px solid #000; width: 200px; padding-top: 5px; margin-top: 30px;"><span style="font-size: 10pt;">(Signature of the proposer)</span></div></div>
        </div>
        <p style="font-style: italic; font-size: 10pt; margin-top: 12px;">* Appropriate particulars of the election to be inserted here.</p>
      </div>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      <div style="margin-bottom: 24px;">
        <p style="font-weight: 500; margin-bottom: 16px;">I, the above mentioned applicant, assent to this nomination and hereby declare:-</p>
        <div style="margin-left: 20px;">
          <p style="margin: 10px 0;">(a) that I have completed <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 40px;">${formData.age || ""}</span> years of age.</p>
          <p style="margin: 10px 0;">(b) that the symbol I have chosen is:</p>
          <div style="display: flex; align-items: center; gap: 16px; margin: 12px 0 12px 30px; padding: 12px; background-color: #f5f5f5; border-radius: 6px;">
            ${formData.partySymbolImage ? `<img src="${formData.partySymbolImage}" alt="${formData.partySymbol || ""}" style="width: 60px; height: 60px; object-fit: contain; border: 1px solid #ddd; background-color: white; padding: 4px; border-radius: 4px;" />` : ""}
            <div><p style="font-weight: 600; margin: 0 0 4px 0;">${formData.partySymbol || ""}</p><span style="display: inline-block; padding: 2px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 10pt; background-color: #fff;">${formData.politicalParty || ""}</span></div>
          </div>
          <p style="margin: 10px 0;">(c) that I am set up at this election by <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 180px;">${formData.politicalParty || ""}</span> Political Party.</p>
          <p style="margin: 10px 0;">(d) that my name and my *father's / husband's name have been correctly spelt out above;</p>
          <p style="margin: 10px 0;">(e) that to the best of my knowledge and belief, I am qualified and not also disqualified for being chosen to fill the seat in the <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 200px;">${formData.municipality || ""}</span> Municipality.</p>
          ${formData.category && formData.category !== "general" ? `<p style="margin: 10px 0;">* I further declare that I am a member of the <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 150px;">${formData.casteTribeName || ""}</span> caste/tribe, which is a <strong>${getCategoryLabel(formData.category)}</strong> of the State of Sikkim.</p>` : ""}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px;">
          <p style="margin: 0;">Date: <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 140px;">${currentDate}</span></p>
          <div style="text-align: center;"><div style="border-top: 1px solid #000; width: 200px; padding-top: 5px; margin-top: 30px;"><span style="font-size: 10pt;">(Signature of applicant)</span></div></div>
        </div>
        <p style="font-style: italic; font-size: 10pt; margin-top: 12px;">* Strike out whatever is not applicable.</p>
      </div>
      <div style="margin-top: 40px; text-align: center; font-size: 10pt; color: #666;">
        <p style="margin: 0;">Application ID: ${applicationId} | Submission: ${submissionNumber}/3</p>
        <p style="margin: 4px 0 0 0;">Generated on: ${currentDate}</p>
      </div>
    `;
  };

  const generatePDF = async (nomination: StoredNomination) => {
    setSelectedNomination(nomination);
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

  return (
    <div className="space-y-5 p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Super Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            System configuration and user management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm">
            <Shield className="h-4 w-4 text-rose-500" />
            <span className="text-sm font-medium text-slate-700">
              SUPER_ADMIN
            </span>
          </div>
          <Button className="bg-slate-800 hover:bg-slate-700 h-9">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-indigo-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-indigo-600" />
              <Badge className="bg-indigo-100 text-indigo-700 text-xs">
                +12 today
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">{totalUsers}</p>
              <p className="text-xs text-slate-500 mt-1">Total Users</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-emerald-600" />
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                Live
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {nominations.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total Nominations</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <UserCog className="h-5 w-5 text-purple-600" />
              <span className="text-xs text-slate-500">Configured</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">4</p>
              <p className="text-xs text-slate-500 mt-1">Roles Defined</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-sky-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Server className="h-5 w-5 text-sky-600" />
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                Healthy
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">99.9%</p>
              <p className="text-xs text-slate-500 mt-1">System Uptime</p>
            </div>
          </CardContent>
        </Card>

        {/* <Card className="bg-amber-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Database className="h-5 w-5 text-amber-600" />
              <span className="text-xs text-slate-500">2h ago</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">156</p>
              <p className="text-xs text-slate-500 mt-1">Backups</p>
            </div>
          </CardContent>
        </Card> */}

        <Card className="bg-rose-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Calendar className="h-5 w-5 text-rose-600" />
              <span className="text-xs text-slate-500">Mar 8</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">7</p>
              <p className="text-xs text-slate-500 mt-1">Days to Deadline</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nominations Alert */}
      {nominations.length > 0 && (
        <Card className="bg-indigo-50 border-indigo-200 border shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <ClipboardList className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-indigo-800">
                    System-wide Nominations
                  </h3>
                  <p className="text-sm text-indigo-600">
                    {nominations.length} nomination(s) from {uniqueCandidates}{" "}
                    candidate(s)
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-green-100 text-green-700">
                  {nominationStatus.approved} Approved
                </Badge>
                <Badge className="bg-amber-100 text-amber-700">
                  {nominationStatus.submitted + nominationStatus.under_review}{" "}
                  Pending
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-sky-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  User Activity
                </CardTitle>
              </div>
              <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                Last 7 days
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={userActivityData}>
                <defs>
                  <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorActions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
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
                <Area
                  type="monotone"
                  dataKey="logins"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLogins)"
                  name="Logins"
                />
                <Area
                  type="monotone"
                  dataKey="actions"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorActions)"
                  name="Actions"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-slate-600">Logins</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Actions</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <UserCog className="h-4 w-4 text-purple-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Users by Role
                </CardTitle>
              </div>
              <span className="text-xs text-slate-400">{totalUsers} total</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={usersByRole}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {usersByRole.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-1">
              {usersByRole.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-500">{item.name}</span>
                  <span className="font-semibold text-slate-700">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management Table */}
      <Card className="bg-white border-0 shadow-sm rounded-xl">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Users className="h-4 w-4 text-indigo-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-800">
                User Management
              </CardTitle>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search users..."
                className="pl-9 h-8 text-sm bg-slate-50 border-0"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-3 text-left text-xs font-medium text-slate-500">
                    User
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-slate-500">
                    Role
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-slate-500">
                    District
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-slate-500">
                    Status
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-slate-500">
                    Last Login
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${index === recentUsers.length - 1 ? "border-b-0" : ""}`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${user.role === "CANDIDATE" ? "bg-blue-100" : user.role === "RO" ? "bg-emerald-100" : "bg-amber-100"}`}
                        >
                          <User
                            className={`h-4 w-4 ${user.role === "CANDIDATE" ? "text-blue-600" : user.role === "RO" ? "text-emerald-600" : "text-amber-600"}`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {user.name}
                          </p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge
                        className={`text-xs ${getRoleBadgeColor(user.role)}`}
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-slate-600">
                        {user.district}
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge
                        className={`text-xs ${user.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-xs text-slate-500">
                        {user.lastLogin}
                      </span>
                    </td>
                    <td className="p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit User</DropdownMenuItem>
                          <DropdownMenuItem>Change Role</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button variant="ghost" className="w-full mt-3 text-slate-600">
            View All Users
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* All Nominations */}
      {nominations.length > 0 && (
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-violet-100 rounded-lg">
                  <ClipboardList className="h-4 w-4 text-violet-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  All Nominations
                </CardTitle>
              </div>
              <Badge className="bg-violet-100 text-violet-700 text-xs">
                {nominations.length} records
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {nominations.map((nomination) => (
                <div
                  key={nomination.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {nomination.formData.candidateName || "Unknown"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {nomination.applicationId} •{" "}
                        {nomination.formData.municipality}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(nomination.status)}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setSelectedNomination(nomination)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
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
                            style={{
                              textAlign: "center",
                              marginBottom: "24px",
                            }}
                          >
                            <h1
                              style={{
                                fontSize: "18pt",
                                fontWeight: "bold",
                                margin: "0 0 8px 0",
                              }}
                            >
                              FORM-18
                            </h1>
                            <p
                              style={{
                                fontSize: "10pt",
                                color: "#666666",
                                margin: "0 0 8px 0",
                              }}
                            >
                              [See sub-rule (3) of rule 25]
                            </p>
                            <h2
                              style={{
                                fontSize: "14pt",
                                fontWeight: "bold",
                                textDecoration: "underline",
                                margin: "0 0 8px 0",
                              }}
                            >
                              NOMINATION PAPER
                            </h2>
                            <p
                              style={{
                                fontSize: "11pt",
                                color: "#666666",
                                margin: "0",
                              }}
                            >
                              Municipality Election 2026
                            </p>
                          </div>
                          <hr
                            style={{
                              border: "none",
                              borderTop: "1px solid #e0e0e0",
                              margin: "20px 0",
                            }}
                          />
                          <div style={{ marginBottom: "24px" }}>
                            <p style={{ margin: "12px 0" }}>
                              * I nominate as an applicant for election to the{" "}
                              <strong>
                                {nomination.formData.municipality}
                              </strong>{" "}
                              Municipality from the{" "}
                              <strong>
                                {nomination.formData.municipalWard}
                              </strong>{" "}
                              Municipal ward.
                            </p>
                            <p style={{ margin: "12px 0" }}>
                              Applicant&apos;s name:{" "}
                              <strong>
                                {nomination.formData.candidateName}
                              </strong>
                            </p>
                            <p style={{ margin: "12px 0" }}>
                              Father&apos;s / Husband&apos;s name:{" "}
                              <strong>
                                {nomination.formData.fatherOrHusbandName}
                              </strong>
                            </p>
                            <p style={{ margin: "12px 0" }}>
                              Full postal address:{" "}
                              <strong>
                                {nomination.formData.fullPostalAddress}
                              </strong>
                            </p>
                            <p style={{ margin: "16px 0" }}>
                              Proposer name:{" "}
                              <strong>
                                {nomination.formData.proposerName}
                              </strong>{" "}
                              at Serial No.{" "}
                              <strong>
                                {nomination.formData.proposerSerialNo}
                              </strong>{" "}
                              in Part No.{" "}
                              <strong>
                                {nomination.formData.proposerPartNo}
                              </strong>{" "}
                              of the electoral roll.
                            </p>
                            <p style={{ margin: "12px 0" }}>
                              Date of Birth:{" "}
                              <strong>{nomination.formData.dateOfBirth}</strong>{" "}
                              | Age: <strong>{nomination.formData.age}</strong>{" "}
                              years
                            </p>
                            <p style={{ margin: "12px 0" }}>
                              Political Party:{" "}
                              <strong>
                                {nomination.formData.politicalParty}
                              </strong>
                            </p>
                            <p style={{ margin: "12px 0" }}>
                              Symbol:{" "}
                              <strong>{nomination.formData.partySymbol}</strong>
                            </p>
                            {nomination.formData.partySymbolImage && (
                              <div
                                style={{
                                  margin: "12px 0",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                }}
                              >
                                <span>Symbol Image:</span>
                                <img
                                  src={nomination.formData.partySymbolImage}
                                  alt="Party Symbol"
                                  style={{
                                    width: "60px",
                                    height: "60px",
                                    objectFit: "contain",
                                    border: "1px solid #ddd",
                                    borderRadius: "4px",
                                  }}
                                />
                              </div>
                            )}
                            {nomination.formData.category !== "general" && (
                              <p style={{ margin: "12px 0" }}>
                                Category:{" "}
                                <strong>
                                  {getCategoryLabel(
                                    nomination.formData.category,
                                  )}
                                </strong>{" "}
                                - {nomination.formData.casteTribeName}
                              </p>
                            )}
                          </div>
                          <hr
                            style={{
                              border: "none",
                              borderTop: "1px solid #e0e0e0",
                              margin: "20px 0",
                            }}
                          />
                          <div
                            style={{
                              padding: "16px",
                              backgroundColor: "#f0fdf4",
                              borderRadius: "8px",
                              marginTop: "20px",
                            }}
                          >
                            <p style={{ margin: "8px 0" }}>
                              <strong>Application ID:</strong>{" "}
                              {nomination.applicationId}
                            </p>
                            <p style={{ margin: "8px 0" }}>
                              <strong>Candidate ID:</strong>{" "}
                              {nomination.candidateId}
                            </p>
                            <p style={{ margin: "8px 0" }}>
                              <strong>Submission #:</strong>{" "}
                              {nomination.submissionNumber} of 3
                            </p>
                            <p style={{ margin: "8px 0" }}>
                              <strong>Submitted:</strong>{" "}
                              {new Date(
                                nomination.submittedAt,
                              ).toLocaleString()}
                            </p>
                            <p style={{ margin: "8px 0" }}>
                              <strong>Status:</strong> {nomination.status}
                            </p>
                            <p style={{ margin: "8px 0" }}>
                              <strong>Payment:</strong>{" "}
                              {nomination.paymentStatus}
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-slate-800 hover:bg-slate-700"
                      onClick={() => generatePDF(nomination)}
                      disabled={isGeneratingPdf}
                    >
                      {isGeneratingPdf &&
                      selectedNomination?.id === nomination.id ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3 mr-1" />
                      )}
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-violet-100 rounded-lg">
                <UserCog className="h-4 w-4 text-violet-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-800">
                Role Configuration
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {roleConfigs.map((config) => {
              const roleCount =
                usersByRole.find(
                  (r) =>
                    r.name ===
                    (config.role === "SUPER_ADMIN"
                      ? "Admins"
                      : config.role === "CANDIDATE"
                        ? "Candidates"
                        : config.role === "RO"
                          ? "ROs"
                          : "SES"),
                )?.value || 0;
              return (
                <div
                  key={config.role}
                  className={`flex items-center justify-between p-3 rounded-lg ${config.color.split(" ")[0]}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full ${config.iconBg} flex items-center justify-center`}
                    >
                      <Shield className={`h-4 w-4 ${config.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {config.role}
                      </p>
                      <p className="text-xs text-slate-500">
                        {config.description}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${config.color} text-xs`}>
                    {roleCount}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-teal-100 rounded-lg">
                <Activity className="h-4 w-4 text-teal-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-800">
                System Health
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {systemHealth.map((item) => (
              <div key={item.metric} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">{item.metric}</span>
                  <span
                    className={`text-xs font-medium ${item.status === "good" ? "text-emerald-600" : "text-amber-600"}`}
                  >
                    {item.value}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.status === "good" ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 rounded-lg">
                  <FileText className="h-4 w-4 text-orange-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Audit Logs
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-slate-500"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {auditLogs.map((log, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2.5 rounded-lg ${log.type === "warning" ? "bg-rose-50" : log.type === "create" ? "bg-emerald-50" : log.type === "update" ? "bg-blue-50" : "bg-slate-50"}`}
              >
                <div className="flex items-center gap-2">
                  {log.type === "warning" ? (
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                  ) : log.type === "create" ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  ) : log.type === "update" ? (
                    <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
                  ) : (
                    <Server className="h-3.5 w-3.5 text-slate-600" />
                  )}
                  <div>
                    <p className="text-xs font-medium text-slate-700">
                      {log.action}
                    </p>
                    <p className="text-xs text-slate-500">{log.user}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">{log.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* System Configuration */}
      <Card className="bg-white border-0 shadow-sm rounded-xl">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-100 rounded-lg">
              <Settings className="h-4 w-4 text-slate-600" />
            </div>
            <CardTitle className="text-sm font-semibold text-slate-800">
              System Configuration
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Lock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Authentication
                  </p>
                  <p className="text-xs text-slate-500">
                    Password policies, 2FA
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Database className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Backup & Recovery
                  </p>
                  <p className="text-xs text-slate-500">Last: 2 hours ago</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Vote className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Election Settings
                  </p>
                  <p className="text-xs text-slate-500">Configure elections</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

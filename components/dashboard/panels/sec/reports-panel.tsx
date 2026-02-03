"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Download,
  RefreshCw,
  FileText,
  Users,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ReportStats {
  totalNominations: number;
  approvedNominations: number;
  rejectedNominations: number;
  pendingNominations: number;
  withdrawnNominations: number;
  totalCandidates: number;
  totalWards: number;
  totalULBs: number;
  totalDistricts: number;
  byDistrict: Array<{ name: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  byPartyType: Array<{ type: string; count: number }>;
  byReservation: Array<{ reservation: string; count: number }>;
  timeline: Array<{ date: string; count: number }>;
}

interface District {
  id: string;
  name: string;
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
];

export function ReportsPanel() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [districtFilter, setDistrictFilter] = useState<string>("all");

  const fetchDistricts = async () => {
    try {
      const response = await fetch("/api/sec/districts");
      const result = await response.json();
      if (result.success) {
        setDistricts(result.data);
      }
    } catch {
      console.error("Failed to fetch districts");
    }
  };

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (districtFilter && districtFilter !== "all") {
        params.append("districtId", districtFilter);
      }

      const response = await fetch(`/api/sec/reports?${params}`);
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error || "Failed to fetch report data");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, [districtFilter]);

  useEffect(() => {
    fetchDistricts();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleExportCSV = () => {
    if (!stats) return;

    const csvData = [
      ["Metric", "Value"],
      ["Total Nominations", stats.totalNominations],
      ["Approved Nominations", stats.approvedNominations],
      ["Rejected Nominations", stats.rejectedNominations],
      ["Pending Nominations", stats.pendingNominations],
      ["Withdrawn Nominations", stats.withdrawnNominations],
      ["Total Candidates", stats.totalCandidates],
      ["Total Wards", stats.totalWards],
      ["Total ULBs", stats.totalULBs],
      ["Total Districts", stats.totalDistricts],
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sec-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading && !stats) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <p className="text-slate-600">{error}</p>
        <Button onClick={fetchStats} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Comprehensive overview of nomination statistics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={districtFilter} onValueChange={setDistrictFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Districts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {districts.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchStats}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-blue-600" />
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {stats?.totalNominations || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total Nominations</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                {stats?.totalNominations
                  ? Math.round(
                      (stats.approvedNominations / stats.totalNominations) *
                        100,
                    )
                  : 0}
                %
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {stats?.approvedNominations || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-amber-600" />
              <Badge className="bg-amber-100 text-amber-700 text-xs">
                Pending
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {stats?.pendingNominations || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">Under Review</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <XCircle className="h-5 w-5 text-red-600" />
              <Badge className="bg-red-100 text-red-700 text-xs">
                {stats?.totalNominations
                  ? Math.round(
                      (stats.rejectedNominations / stats.totalNominations) *
                        100,
                    )
                  : 0}
                %
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {stats?.rejectedNominations || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coverage Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">
                {stats?.totalCandidates || 0}
              </p>
              <p className="text-xs text-slate-500">Candidates</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">
                {stats?.totalWards || 0}
              </p>
              <p className="text-xs text-slate-500">Wards</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">
                {stats?.totalULBs || 0}
              </p>
              <p className="text-xs text-slate-500">ULBs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
              <BarChart className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">
                {stats?.totalDistricts || 0}
              </p>
              <p className="text-xs text-slate-500">Districts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.byStatus && stats.byStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.byStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ status, percent }) =>
                      `${status} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {stats.byStatus.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-slate-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* District-wise Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              District-wise Nominations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.byDistrict && stats.byDistrict.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsBarChart data={stats.byDistrict}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-slate-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Party Type Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Party Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.byPartyType && stats.byPartyType.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.byPartyType}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ type, percent }) =>
                      `${type} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {stats.byPartyType.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[(index + 2) % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-slate-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reservation-wise Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Reservation-wise Nominations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.byReservation && stats.byReservation.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsBarChart data={stats.byReservation} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="reservation"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={80}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-slate-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

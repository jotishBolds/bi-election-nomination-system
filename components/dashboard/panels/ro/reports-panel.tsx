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
  Download,
  RefreshCw,
  FileText,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Ban,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ROReportStats {
  totalApplications: number;
  pendingScrutiny: number;
  underScrutiny: number;
  approved: number;
  rejected: number;
  withdrawn: number;
  validContestants: number;
  totalWards: number;
  byWard: Array<{ wardNo: number; wardName: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  byParty: Array<{ party: string; count: number }>;
  timeline: Array<{ date: string; submissions: number; approvals: number }>;
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
];

export function ROReportsPanel() {
  const [stats, setStats] = useState<ROReportStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wardFilter, setWardFilter] = useState<string>("all");
  const [wards, setWards] = useState<
    Array<{ id: string; wardNo: number; wardName: string }>
  >([]);

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

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (wardFilter && wardFilter !== "all") {
        params.append("wardId", wardFilter);
      }

      const response = await fetch(`/api/ro/reports?${params}`);
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
  }, [wardFilter]);

  useEffect(() => {
    fetchWards();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleExportCSV = () => {
    if (!stats) return;

    const csvData = [
      ["Metric", "Value"],
      ["Total Applications", stats.totalApplications],
      ["Pending Scrutiny", stats.pendingScrutiny],
      ["Under Scrutiny", stats.underScrutiny],
      ["Approved", stats.approved],
      ["Rejected", stats.rejected],
      ["Withdrawn", stats.withdrawn],
      ["Valid Contestants", stats.validContestants],
      ["Total Wards", stats.totalWards],
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ro-report-${new Date().toISOString().split("T")[0]}.csv`;
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
            Reports & Statistics
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Comprehensive overview of nominations in your jurisdiction
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={wardFilter} onValueChange={setWardFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Wards" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Wards</SelectItem>
              {wards.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  Ward {w.wardNo}
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

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-blue-600" />
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {stats?.totalApplications || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total Applications</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-amber-600" />
              <Badge className="bg-amber-100 text-amber-700 text-xs">
                {stats?.totalApplications
                  ? Math.round(
                      ((stats.pendingScrutiny + stats.underScrutiny) /
                        stats.totalApplications) *
                        100,
                    )
                  : 0}
                %
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {(stats?.pendingScrutiny || 0) + (stats?.underScrutiny || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                {stats?.totalApplications
                  ? Math.round((stats.approved / stats.totalApplications) * 100)
                  : 0}
                %
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {stats?.approved || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <XCircle className="h-5 w-5 text-red-600" />
              <Badge className="bg-red-100 text-red-700 text-xs">
                {stats?.totalApplications
                  ? Math.round((stats.rejected / stats.totalApplications) * 100)
                  : 0}
                %
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {stats?.rejected || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">
                {stats?.validContestants || 0}
              </p>
              <p className="text-xs text-slate-500">Valid Contestants</p>
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
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Ban className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">
                {stats?.withdrawn || 0}
              </p>
              <p className="text-xs text-slate-500">Withdrawn</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">
                {stats?.totalWards
                  ? Math.round(
                      (stats.validContestants / stats.totalWards) * 10,
                    ) / 10
                  : 0}
              </p>
              <p className="text-xs text-slate-500">Avg per Ward</p>
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

        {/* Ward-wise Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Ward-wise Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.byWard && stats.byWard.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.byWard}>
                  <XAxis
                    dataKey="wardNo"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val) => `W${val}`}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value, name) => [value, "Applications"]}
                    labelFormatter={(label) => `Ward ${label}`}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-slate-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Party-wise Distribution */}
        <Card className="border-0 shadow-sm md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Party-wise Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.byParty && stats.byParty.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.byParty} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="party"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={100}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-slate-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

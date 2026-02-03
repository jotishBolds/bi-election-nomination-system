"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  FileText,
  MapPin,
  Users,
  Building2,
  Calendar,
  CircleDot,
  User,
  ClipboardList,
  Shield,
  BarChart3,
  RefreshCw,
  Download,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useSECDashboard } from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export function SESPanel() {
  const { data, isLoading, error, refetch } = useSECDashboard();
  const [selectedNomination, setSelectedNomination] = useState<any | null>(
    null,
  );

  if (isLoading) {
    return (
      <div className="space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-72" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
    stats,
    districtWiseStats,
    ulbWiseStats,
    categoryWiseStats,
    electionSchedule,
    daysRemaining,
    currentPhase,
  } = data;

  // Prepare chart data
  const nominationStatusData = Object.entries(stats.byStatus)
    .map(([status, value]) => ({
      name: status.replace(/_/g, " "),
      value,
      color:
        status === "ACCEPTED"
          ? "#22c55e"
          : status === "REJECTED"
            ? "#ef4444"
            : status === "SUBMITTED"
              ? "#f59e0b"
              : "#6366f1",
    }))
    .filter((item) => item.value > 0);

  const districtChartData = districtWiseStats.map((d) => ({
    name: d.districtName.substring(0, 10),
    total: d.totalNominations,
    approved: d.approved,
    pending: d.pending,
    rejected: d.rejected,
  }));

  const categoryChartData = Object.entries(categoryWiseStats).map(
    ([category, count]) => ({
      name: getCategoryLabel(category),
      value: count,
      color: getCategoryColor(category),
    }),
  );

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "SUBMITTED":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 text-xs">
            Submitted
          </Badge>
        );
      case "PENDING_SCRUTINY":
      case "UNDER_REVIEW":
        return (
          <Badge className="bg-amber-100 text-amber-700 text-xs">
            Under Review
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge className="bg-green-100 text-green-700 text-xs">
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-700 text-xs">Rejected</Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 text-xs">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-5 p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            State Election Commission Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Municipality Election 2026
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm">
            <Shield className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-slate-700">
              {user.name}
            </span>
          </div>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="bg-indigo-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <MapPin className="h-5 w-5 text-indigo-600" />
              <span className="text-xs text-slate-500">Active</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {stats.totalDistricts}
              </p>
              <p className="text-xs text-slate-500 mt-1">Districts</p>
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
              <p className="text-2xl font-bold text-slate-800">
                {stats.totalULBs}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total ULBs</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="text-xs text-slate-500">Wards</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {stats.totalWards}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total Wards</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <ClipboardList className="h-5 w-5 text-emerald-600" />
              <span className="text-xs text-slate-500">Total</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {stats.totalNominations}
              </p>
              <p className="text-xs text-slate-500 mt-1">Nominations</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-amber-600" />
              <span className="text-xs text-slate-500">Unique</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {stats.uniqueCandidates}
              </p>
              <p className="text-xs text-slate-500 mt-1">Candidates</p>
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nomination Status Pie Chart */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <BarChart3 className="h-4 w-4 text-indigo-600" />
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
                      <span className="text-xs text-slate-600 capitalize">
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

        {/* District-wise Bar Chart */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <MapPin className="h-4 w-4 text-purple-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-800">
                District-wise Nominations
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {districtChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={districtChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="approved" stackId="a" fill="#22c55e" />
                  <Bar dataKey="pending" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="rejected" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-400">
                No district data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category-wise Stats */}
      <Card className="bg-white border-0 shadow-sm rounded-xl">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <Users className="h-4 w-4 text-amber-600" />
            </div>
            <CardTitle className="text-sm font-semibold text-slate-800">
              Category-wise Distribution
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {categoryChartData.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categoryChartData.map((category, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-slate-50 text-center"
                >
                  <p className="text-lg font-bold text-slate-800">
                    {category.value}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{category.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              No category data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* District Details */}
      <Card className="bg-white border-0 shadow-sm rounded-xl">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 rounded-lg">
              <MapPin className="h-4 w-4 text-emerald-600" />
            </div>
            <CardTitle className="text-sm font-semibold text-slate-800">
              District Details
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {districtWiseStats.length > 0 ? (
              districtWiseStats.map((district) => (
                <div
                  key={district.districtId}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {district.districtName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {district.totalNominations} nominations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-green-600">
                        {district.approved}
                      </p>
                      <p className="text-xs text-slate-400">Approved</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-amber-600">
                        {district.pending}
                      </p>
                      <p className="text-xs text-slate-400">Pending</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-red-600">
                        {district.rejected}
                      </p>
                      <p className="text-xs text-slate-400">Rejected</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                No district data available
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
    </div>
  );
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    GENERAL: "General",
    SC: "SC",
    ST: "ST",
    ST_BL: "ST (BL)",
    ST_LT: "ST (LT)",
    OBC_CENTRAL: "OBC (Central)",
    OBC_STATE: "OBC (State)",
    OBC: "OBC",
  };
  return labels[category.toUpperCase()] || category;
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    GENERAL: "#6366f1",
    SC: "#8b5cf6",
    ST: "#ec4899",
    ST_BL: "#f43f5e",
    ST_LT: "#ef4444",
    OBC_CENTRAL: "#f59e0b",
    OBC_STATE: "#eab308",
    OBC: "#22c55e",
  };
  return colors[category.toUpperCase()] || "#94a3b8";
}

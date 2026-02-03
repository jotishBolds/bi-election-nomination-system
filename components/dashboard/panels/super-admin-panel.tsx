"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCog,
  Settings,
  Shield,
  Plus,
  Activity,
  Server,
  Database,
  CheckCircle,
  AlertCircle,
  User,
  Building2,
  Vote,
  TrendingUp,
  FileText,
  Lock,
  RefreshCw,
  Eye,
  Calendar,
  ClipboardList,
  Download,
  Loader2,
  AlertTriangle,
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
import { useAdminDashboard } from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export function SuperAdminPanel() {
  const { data, isLoading, error, refetch } = useAdminDashboard();
  const [selectedNomination, setSelectedNomination] = useState<any | null>(
    null,
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-sm rounded-xl">
              <CardContent className="p-4">
                <Skeleton className="h-24 w-full" />
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
    userStats,
    systemHealth,
    nominationStats,
    recentUsers,
    recentAuditLogs,
    electionConfig,
    electionSchedule,
    daysRemaining,
  } = data;

  // Prepare chart data
  const usersByRoleData = Object.entries(userStats.byRole).map(
    ([role, count]) => ({
      name:
        role === "SUPER_ADMIN"
          ? "Admins"
          : role === "SES"
            ? "SEC"
            : role === "RO"
              ? "ROs"
              : "Candidates",
      value: count,
      color:
        role === "SUPER_ADMIN"
          ? "#ec4899"
          : role === "SES"
            ? "#f59e0b"
            : role === "RO"
              ? "#22c55e"
              : "#6366f1",
    }),
  );

  const nominationStatusData = Object.entries(nominationStats.byStatus).map(
    ([status, count]) => ({
      name: status.replace("_", " "),
      value: count,
      color:
        status === "SUBMITTED"
          ? "#22c55e"
          : status === "ACCEPTED"
            ? "#3b82f6"
            : status === "REJECTED"
              ? "#ef4444"
              : "#f59e0b",
    }),
  );

  const getStatusColor = (status: string) => {
    if (status === "healthy") return "text-green-500";
    if (status === "degraded") return "text-amber-500";
    return "text-red-500";
  };

  const getStatusIcon = (status: string) => {
    if (status === "healthy")
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === "degraded")
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    return <AlertCircle className="h-4 w-4 text-red-500" />;
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

  return (
    <div className="space-y-6 p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            System Overview & Management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm">
            <Shield className="h-4 w-4 text-rose-500" />
            <span className="text-sm font-medium text-slate-700">
              {user.name}
            </span>
          </div>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-indigo-600" />
              <Badge className="bg-indigo-100 text-indigo-700 text-xs">
                Total
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {userStats.total}
              </p>
              <p className="text-xs text-slate-500 mt-1">Registered Users</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Activity className="h-5 w-5 text-emerald-600" />
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                Today
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {userStats.activeToday}
              </p>
              <p className="text-xs text-slate-500 mt-1">Active Users Today</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-amber-600" />
              <Badge className="bg-amber-100 text-amber-700 text-xs">
                Nominations
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {nominationStats.total}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total Applications</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Calendar className="h-5 w-5 text-rose-600" />
              <span className="text-xs text-slate-500">
                {electionSchedule.find((s) => s.highlight)?.date ||
                  "Mar 8, 2026"}
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {daysRemaining !== null && daysRemaining > 0
                  ? daysRemaining
                  : "—"}
              </p>
              <p className="text-xs text-slate-500 mt-1">Days to Deadline</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card className="bg-white border-0 shadow-sm rounded-xl">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-100 rounded-lg">
                <Server className="h-4 w-4 text-slate-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-800">
                System Health
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Database</span>
                {getStatusIcon(systemHealth.database.status)}
              </div>
              <p className="text-sm font-medium text-slate-800">
                {systemHealth.database.latency}ms latency
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Redis</span>
                {getStatusIcon(systemHealth.redis.status)}
              </div>
              <p className="text-sm font-medium text-slate-800">
                {systemHealth.redis.latency >= 0
                  ? `${systemHealth.redis.latency}ms latency`
                  : "Not connected"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Storage</span>
                {getStatusIcon(systemHealth.storage.status)}
              </div>
              <p className="text-sm font-medium text-slate-800">
                {systemHealth.storage.usedPercent}% used
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Users by Role */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <Users className="h-4 w-4 text-indigo-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Users by Role
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {usersByRoleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={usersByRoleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {usersByRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-400">
                No user data available
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {usersByRoleData.map((role, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: role.color }}
                  />
                  <span className="text-xs text-slate-600">
                    {role.name}: {role.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Nomination Status */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-lg">
                  <ClipboardList className="h-4 w-4 text-amber-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Nomination Status
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {nominationStatusData.length > 0 ? (
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
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-400">
                No nomination data available
              </div>
            )}
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
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card className="bg-white border-0 shadow-sm rounded-xl">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <UserCog className="h-4 w-4 text-emerald-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-800">
                Recent Users
              </CardTitle>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {recentUsers.length > 0 ? (
              recentUsers.slice(0, 5).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {u.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {u.email || "No email"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getRoleBadgeColor(u.role)}`}>
                      {u.role}
                    </Badge>
                    <span
                      className={`text-xs ${u.status === "active" ? "text-green-600" : "text-slate-400"}`}
                    >
                      {u.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                No users found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Audit Logs */}
      <Card className="bg-white border-0 shadow-sm rounded-xl">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-100 rounded-lg">
                <Activity className="h-4 w-4 text-slate-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-800">
                Recent Activity
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {recentAuditLogs.length > 0 ? (
              recentAuditLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                    <div>
                      <p className="text-sm text-slate-800">
                        {log.action.replace("_", " ")}
                      </p>
                      <p className="text-xs text-slate-500">
                        {log.entityType} • {log.userName || "System"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                No recent activity
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Election Config */}
      {electionConfig && (
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-100 rounded-lg">
                  <Settings className="h-4 w-4 text-rose-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Election Configuration
                </CardTitle>
              </div>
              <Badge
                className={`text-xs ${electionConfig.isLocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
              >
                {electionConfig.isLocked ? (
                  <>
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </>
                ) : (
                  "Active"
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500">Election Name</p>
                <p className="text-sm font-medium text-slate-800 mt-1">
                  {electionConfig.name}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500">Year</p>
                <p className="text-sm font-medium text-slate-800 mt-1">
                  {electionConfig.year}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500">Current Phase</p>
                <p className="text-sm font-medium text-slate-800 mt-1 capitalize">
                  {electionConfig.currentPhase.replace("_", " ")}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500">Nomination Period</p>
                <p className="text-sm font-medium text-slate-800 mt-1">
                  {new Date(
                    electionConfig.nominationStartDate,
                  ).toLocaleDateString()}{" "}
                  -{" "}
                  {new Date(
                    electionConfig.nominationEndDate,
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

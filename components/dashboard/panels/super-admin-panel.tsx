"use client";

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
  Clock,
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

import { electionData } from "@/lib/election-data";

// User activity data
const userActivityData = [
  { date: "Jan 18", logins: 45, actions: 120 },
  { date: "Jan 19", logins: 52, actions: 145 },
  { date: "Jan 20", logins: 78, actions: 210 },
  { date: "Jan 21", logins: 65, actions: 180 },
  { date: "Jan 22", logins: 88, actions: 245 },
  { date: "Jan 23", logins: 72, actions: 195 },
  { date: "Jan 24", logins: 89, actions: 260 },
];

// Users by role
const usersByRole = [
  { name: "Candidates", value: 1156, color: "#6366f1" },
  { name: "ROs", value: 48, color: "#22c55e" },
  { name: "SES", value: 12, color: "#f59e0b" },
  { name: "Admins", value: 5, color: "#ec4899" },
];

// System health metrics
const systemHealth = [
  { metric: "API Response", value: 98.5, status: "good" },
  { metric: "Database", value: 99.9, status: "good" },
  { metric: "Storage", value: 67, status: "warning" },
  { metric: "Memory", value: 45, status: "good" },
];

// Recent users
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

// Role configurations
const roleConfigs = [
  {
    role: "SUPER_ADMIN",
    description: "Full system access",
    users: 5,
    color: "bg-rose-50 text-rose-700",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
  {
    role: "SES",
    description: "State-level oversight",
    users: 12,
    color: "bg-amber-50 text-amber-700",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    role: "RO",
    description: "District management",
    users: 48,
    color: "bg-emerald-50 text-emerald-700",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    role: "CANDIDATE",
    description: "Nomination access",
    users: 1156,
    color: "bg-blue-50 text-blue-700",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
];

// Audit log entries
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

export function SuperAdminPanel() {
  const totalUsers = usersByRole.reduce((sum, r) => sum + r.value, 0);

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
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="bg-indigo-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-indigo-600" />
              <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 text-xs font-medium">
                +12 today
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {totalUsers.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total Users</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Activity className="h-5 w-5 text-emerald-600" />
              <span className="text-xs text-slate-500">Live</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">89</p>
              <p className="text-xs text-slate-500 mt-1">Active Sessions</p>
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
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs font-medium">
                Healthy
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">99.9%</p>
              <p className="text-xs text-slate-500 mt-1">System Uptime</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-0 shadow-sm rounded-xl">
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
        </Card>

        <Card className="bg-rose-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <MapPin className="h-5 w-5 text-rose-600" />
              <span className="text-xs text-slate-500">Election</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {electionData.districts.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Districts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Activity */}
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

        {/* Users by Role */}
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
              <span className="text-xs text-slate-400">
                {totalUsers.toLocaleString()} total
              </span>
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
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      index === recentUsers.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            user.role === "CANDIDATE"
                              ? "bg-blue-100"
                              : user.role === "RO"
                                ? "bg-emerald-100"
                                : "bg-amber-100"
                          }`}
                        >
                          <User
                            className={`h-4 w-4 ${
                              user.role === "CANDIDATE"
                                ? "text-blue-600"
                                : user.role === "RO"
                                  ? "text-emerald-600"
                                  : "text-amber-600"
                            }`}
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
                        className={`text-xs ${
                          user.role === "CANDIDATE"
                            ? "bg-blue-100 text-blue-700"
                            : user.role === "RO"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
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
                        className={`text-xs ${
                          user.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
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

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Role Configuration */}
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
            {roleConfigs.map((config) => (
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
                  {config.users}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System Health */}
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
                    className={`text-xs font-medium ${
                      item.status === "good"
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  >
                    {item.value}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      item.status === "good" ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Audit Logs */}
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
                className={`flex items-center justify-between p-2.5 rounded-lg ${
                  log.type === "warning"
                    ? "bg-rose-50"
                    : log.type === "create"
                      ? "bg-emerald-50"
                      : log.type === "update"
                        ? "bg-blue-50"
                        : "bg-slate-50"
                }`}
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

      {/* System Configuration Cards */}
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

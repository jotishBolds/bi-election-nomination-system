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
import {
  Eye,
  CheckCircle,
  FileText,
  MapPin,
  Users,
  AlertTriangle,
  Building2,
  Calendar,
  TrendingUp,
  ArrowRight,
  CircleDot,
  User,
  ClipboardList,
  Shield,
  BarChart3,
  Vote,
} from "lucide-react";
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
} from "recharts";

import { electionData } from "@/lib/election-data";

// Calculate stats from election data
const totalDistricts = electionData.districts.length;
const totalULBs = electionData.districts.reduce(
  (sum, d) => sum + d.ulbs.length,
  0,
);

// Wards per district for chart
const wardsPerDistrict = electionData.districts.map((district) => {
  const totalWards = district.ulbs.reduce(
    (sum, ulb) => sum + ulb.wards.length,
    0,
  );
  return {
    name: district.district,
    wards: totalWards,
    ulbs: district.ulbs.length,
  };
});

// Nomination trend data
const nominationTrendData = [
  { date: "Jan 20", nominations: 8 },
  { date: "Jan 21", nominations: 15 },
  { date: "Jan 22", nominations: 22 },
  { date: "Jan 23", nominations: 35 },
  { date: "Jan 24", nominations: 48 },
  { date: "Jan 25", nominations: 63 },
];

// District-wise nomination status
const districtNominationStatus = electionData.districts.map(
  (district, index) => {
    const colors = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4"];
    const wardCount = district.ulbs.reduce(
      (sum, ulb) => sum + ulb.wards.length,
      0,
    );
    return {
      name: district.district,
      nominations: Math.floor(Math.random() * 15) + 5,
      wards: wardCount,
      color: colors[index % colors.length],
    };
  },
);

// Overall nomination status
const overallNominationStatus = [
  { name: "Approved", value: 28, color: "#22c55e" },
  { name: "Pending", value: 18, color: "#f59e0b" },
  { name: "Rejected", value: 5, color: "#ef4444" },
  { name: "Under Review", value: 12, color: "#6366f1" },
];

// Pending RO actions
const pendingActions = [
  {
    id: 1,
    type: "Nomination Approval",
    ro: "RO Gangtok",
    district: "GANGTOK",
    count: 8,
    priority: "high",
  },
  {
    id: 2,
    type: "Document Verification",
    ro: "RO Namchi",
    district: "NAMCHI",
    count: 5,
    priority: "medium",
  },
  {
    id: 3,
    type: "Ward Reassignment",
    ro: "RO Mangan",
    district: "MANGAN",
    count: 2,
    priority: "low",
  },
  {
    id: 4,
    type: "Scrutiny Schedule",
    ro: "RO Soreng",
    district: "SORENG",
    count: 3,
    priority: "medium",
  },
];

// Important dates
const importantDates = [
  { event: "Nomination Opens", date: "Jan 20, 2026", status: "completed" },
  { event: "Last Date", date: "Feb 15, 2026", status: "upcoming" },
  { event: "Scrutiny", date: "Feb 18, 2026", status: "upcoming" },
  { event: "Election Day", date: "Mar 5, 2026", status: "upcoming" },
];

// RO performance
const roPerformance = [
  { name: "GANGTOK", processed: 18, pending: 4 },
  { name: "NAMCHI", processed: 12, pending: 6 },
  { name: "MANGAN", processed: 8, pending: 3 },
  { name: "SORENG", processed: 6, pending: 2 },
  { name: "GYALSHING", processed: 4, pending: 3 },
];

export function SESPanel() {
  const totalNominations = overallNominationStatus.reduce(
    (sum, s) => sum + s.value,
    0,
  );

  return (
    <div className="space-y-5 p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            State Election Commission Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {electionData.election}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm">
          <Shield className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-medium text-slate-700">SEC-SIKKIM</span>
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
                {totalDistricts}
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
              <p className="text-2xl font-bold text-slate-800">{totalULBs}</p>
              <p className="text-xs text-slate-500 mt-1">Total ULBs</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Vote className="h-5 w-5 text-blue-600" />
              <span className="text-xs text-slate-500">Constituencies</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {electionData.totalWards}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total Wards</p>
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
                {totalNominations}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total Nominations</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs font-medium">
                Action
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">18</p>
              <p className="text-xs text-slate-500 mt-1">Pending Actions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Calendar className="h-5 w-5 text-rose-600" />
              <span className="text-xs text-slate-500">Mar 5, 2026</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">42</p>
              <p className="text-xs text-slate-500 mt-1">Days to Election</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nomination Trend */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-sky-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Nomination Trend
                </CardTitle>
              </div>
              <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                +15 today
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={nominationTrendData}>
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
                <Line
                  type="monotone"
                  dataKey="nominations"
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  dot={{
                    fill: "#0ea5e9",
                    r: 4,
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Overall Nomination Status */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 rounded-lg">
                  <BarChart3 className="h-4 w-4 text-teal-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Nomination Status
                </CardTitle>
              </div>
              <span className="text-xs text-slate-400">
                {totalNominations} total
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={overallNominationStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {overallNominationStatus.map((entry, index) => (
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
            <div className="flex justify-center gap-3 mt-1">
              {overallNominationStatus.map((item, index) => (
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

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* District-wise Wards */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <MapPin className="h-4 w-4 text-indigo-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Wards by District
                </CardTitle>
              </div>
              <span className="text-xs text-slate-400">
                {electionData.totalWards} total
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={wardsPerDistrict}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: "#64748b" }}
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
                <Bar dataKey="wards" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RO Performance */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-violet-100 rounded-lg">
                  <Users className="h-4 w-4 text-violet-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  RO Performance
                </CardTitle>
              </div>
              <span className="text-xs text-slate-400">
                {totalDistricts} ROs
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={roPerformance} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 9, fill: "#64748b" }}
                  width={70}
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
                <Bar
                  dataKey="processed"
                  fill="#22c55e"
                  radius={[0, 6, 6, 0]}
                  name="Processed"
                />
                <Bar
                  dataKey="pending"
                  fill="#f59e0b"
                  radius={[0, 6, 6, 0]}
                  name="Pending"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending RO Actions */}
        <Card className="bg-white border-0 shadow-sm rounded-xl md:col-span-2">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-lg">
                  <ClipboardList className="h-4 w-4 text-amber-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Pending RO Actions
                </CardTitle>
              </div>
              <Badge className="bg-amber-100 text-amber-700 text-xs">
                {pendingActions.length} pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {pendingActions.map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      action.priority === "high"
                        ? "bg-rose-100"
                        : action.priority === "medium"
                          ? "bg-amber-100"
                          : "bg-slate-100"
                    }`}
                  >
                    <User
                      className={`h-4 w-4 ${
                        action.priority === "high"
                          ? "text-rose-600"
                          : action.priority === "medium"
                            ? "text-amber-600"
                            : "text-slate-600"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {action.type}
                    </p>
                    <p className="text-xs text-slate-500">
                      {action.ro} • {action.district}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-xs ${
                      action.priority === "high"
                        ? "bg-rose-100 text-rose-700"
                        : action.priority === "medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {action.count} items
                  </Badge>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-slate-800 hover:bg-slate-700"
                  >
                    Review
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="ghost" className="w-full mt-2 text-slate-600">
              View All Actions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Election Monitoring */}
          <Card className="bg-white border-0 shadow-sm rounded-xl">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-100 rounded-lg">
                  <Eye className="h-4 w-4 text-cyan-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Election Status
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <div className="flex justify-between items-center p-2.5 bg-emerald-50 rounded-lg">
                <span className="text-sm text-slate-700">On Track</span>
                <span className="text-sm font-bold text-emerald-700">3</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-amber-50 rounded-lg">
                <span className="text-sm text-slate-700">Minor Issues</span>
                <span className="text-sm font-bold text-amber-700">1</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-rose-50 rounded-lg">
                <span className="text-sm text-slate-700">Attention Needed</span>
                <span className="text-sm font-bold text-rose-700">1</span>
              </div>
            </CardContent>
          </Card>

          {/* Important Dates */}
          <Card className="bg-white border-0 shadow-sm rounded-xl">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-pink-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-pink-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Key Dates
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {importantDates.slice(0, 3).map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    item.status === "completed"
                      ? "bg-emerald-50"
                      : "bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.status === "completed" ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <CircleDot className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    <span className="text-xs text-slate-700">{item.event}</span>
                  </div>
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      item.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.date}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* District Cards */}
      <Card className="bg-white border-0 shadow-sm rounded-xl">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-violet-100 rounded-lg">
                <Building2 className="h-4 w-4 text-violet-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-800">
                District Overview
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-slate-500"
            >
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {electionData.districts.map((district, index) => {
              const colors = [
                {
                  bg: "bg-blue-50",
                  text: "text-blue-700",
                  badge: "bg-blue-100",
                },
                {
                  bg: "bg-purple-50",
                  text: "text-purple-700",
                  badge: "bg-purple-100",
                },
                {
                  bg: "bg-emerald-50",
                  text: "text-emerald-700",
                  badge: "bg-emerald-100",
                },
                {
                  bg: "bg-rose-50",
                  text: "text-rose-700",
                  badge: "bg-rose-100",
                },
                {
                  bg: "bg-amber-50",
                  text: "text-amber-700",
                  badge: "bg-amber-100",
                },
              ];
              const color = colors[index % colors.length];
              const wardCount = district.ulbs.reduce(
                (sum, ulb) => sum + ulb.wards.length,
                0,
              );
              return (
                <div
                  key={district.district}
                  className={`p-3 rounded-lg ${color.bg}`}
                >
                  <p className="text-xs text-slate-500">
                    {district.ulbs.length} ULB
                  </p>
                  <p className={`text-sm font-bold mt-0.5 ${color.text}`}>
                    {district.district}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-500">
                      {wardCount} Wards
                    </span>
                    <span
                      className={`text-xs font-medium px-1.5 py-0.5 rounded ${color.badge} ${color.text}`}
                    >
                      {Math.floor(Math.random() * 10) + 5} apps
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

    
    </div>
  );
}

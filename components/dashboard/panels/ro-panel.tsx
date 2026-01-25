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
  AlertCircle,
  TrendingUp,
  User,
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
  };
});

// Nomination status data (simulated)
const nominationStatusData = [
  { name: "Approved", value: 28, color: "#22c55e" },
  { name: "Pending", value: 18, color: "#f59e0b" },
  { name: "Rejected", value: 5, color: "#ef4444" },
  { name: "Under Review", value: 12, color: "#6366f1" },
];

// Pending approvals (simulated based on wards)
const pendingApprovals = [
  {
    id: 1,
    name: "Tenzin Dorji",
    ward: "Upper Burtuk",
    district: "GANGTOK",
    status: "pending",
  },
  {
    id: 2,
    name: "Pema Sherpa",
    ward: "Pentok",
    district: "MANGAN",
    status: "pending",
  },
  {
    id: 3,
    name: "Karma Wangchuk",
    ward: "Soreng Bazar",
    district: "SORENG",
    status: "review",
  },
  {
    id: 4,
    name: "Dawa Lama",
    ward: "Central Gyalshing",
    district: "GYALSHING",
    status: "pending",
  },
];

// Important dates
const importantDates = [
  { event: "Nomination Opens", date: "Jan 20, 2026", status: "completed" },
  { event: "Last Date", date: "Feb 15, 2026", status: "upcoming" },
  { event: "Scrutiny", date: "Feb 18, 2026", status: "upcoming" },
  { event: "Election Day", date: "Mar 5, 2026", status: "upcoming" },
];

export function ROPanel() {
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
              <p className="text-2xl font-bold text-slate-800">18</p>
              <p className="text-xs text-slate-500 mt-1">Pending Approvals</p>
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
              <p className="text-2xl font-bold text-slate-800">63</p>
              <p className="text-xs text-slate-500 mt-1">Total Candidates</p>
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
              <p className="text-xs text-slate-500 mt-1">Days Remaining</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Wards by District */}
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
              <span className="text-xs text-slate-400">63 total</span>
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
            <div className="flex justify-center gap-4 mt-2">
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
        {/* Pending Approvals */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-lg">
                  <ClipboardList className="h-4 w-4 text-amber-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Pending Approvals
                </CardTitle>
              </div>
              <Badge className="bg-amber-100 text-amber-700 text-xs">
                {pendingApprovals.length} pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {pendingApprovals.map((candidate) => (
              <div
                key={candidate.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {candidate.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {candidate.ward}, {candidate.district}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      candidate.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-indigo-100 text-indigo-700"
                    }
                  >
                    {candidate.status}
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
              View All Approvals
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Important Dates & District Overview */}
        <div className="space-y-4">
          {/* Important Dates */}
          <Card className="bg-white border-0 shadow-sm rounded-xl">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-pink-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-pink-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Important Dates
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {importantDates.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2.5 rounded-lg ${
                    item.status === "completed"
                      ? "bg-emerald-50"
                      : "bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.status === "completed" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <CircleDot className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="text-sm text-slate-700">{item.event}</span>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-md ${
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

          {/* District Quick Stats */}
          <Card className="bg-white border-0 shadow-sm rounded-xl">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-100 rounded-lg">
                  <Building2 className="h-4 w-4 text-cyan-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  District Overview
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 gap-2">
                {electionData.districts.slice(0, 4).map((district, index) => {
                  const colors = [
                    "bg-blue-50 text-blue-700",
                    "bg-purple-50 text-purple-700",
                    "bg-emerald-50 text-emerald-700",
                    "bg-rose-50 text-rose-700",
                  ];
                  const wardCount = district.ulbs.reduce(
                    (sum, ulb) => sum + ulb.wards.length,
                    0,
                  );
                  return (
                    <div
                      key={district.district}
                      className={`p-3 rounded-lg ${colors[index]}`}
                    >
                      <p className="text-xs opacity-70">
                        {district.ulbs.length} ULB
                      </p>
                      <p className="text-base font-bold mt-0.5">
                        {district.district}
                      </p>
                      <p className="text-xs mt-1">{wardCount} Wards</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

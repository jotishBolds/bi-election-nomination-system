"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Vote,
  CheckCircle,
  Calendar,
  IndianRupee,
  User,
  TrendingUp,
  FileCheck,
  MapPin,
  ArrowUpRight,
  CircleDot,
  ClipboardCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Cell,
} from "recharts";

import { electionData } from "@/lib/election-data";

// Timeline data for application progress
const timelineData = [
  { date: "Jan 15", progress: 25 },
  { date: "Jan 18", progress: 40 },
  { date: "Jan 20", progress: 60 },
  { date: "Jan 24", progress: 75 },
  { date: "Feb 1", progress: 85 },
  { date: "Feb 15", progress: 100 },
];

// Process steps data
const processStepsData = [
  { step: "Form", completed: 100, fill: "#22c55e" },
  { step: "Documents", completed: 75, fill: "#6366f1" },
  { step: "Payment", completed: 100, fill: "#22c55e" },
  { step: "Review", completed: 30, fill: "#f59e0b" },
  { step: "Scrutiny", completed: 0, fill: "#e2e8f0" },
];

// Important dates data
const importantDates = [
  { event: "Nomination Opens", date: "Jan 20, 2026", status: "completed" },
  { event: "Last Date", date: "Feb 15, 2026", status: "upcoming" },
  { event: "Scrutiny", date: "Feb 18, 2026", status: "upcoming" },
  { event: "Election Day", date: "Mar 5, 2026", status: "upcoming" },
];

export function CandidatePanel() {
  return (
    <div className="space-y-5 p-6  min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Applicant Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {electionData.election}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm">
          <User className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">
            MC2026-0142
          </span>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-amber-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <FileCheck className="h-5 w-5 text-amber-600" />
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs font-medium">
                Pending
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">Review</p>
              <p className="text-xs text-slate-500 mt-1">
                Updated Jan 20, 2026
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <ClipboardCheck className="h-5 w-5 text-emerald-600" />
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs font-medium">
                Submitted
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">1/1</p>
              <p className="text-xs text-slate-500 mt-1">Nomination Form</p>
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

        <Card className="bg-blue-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <IndianRupee className="h-5 w-5 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs font-medium">
                Paid
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">₹500</p>
              <p className="text-xs text-slate-500 mt-1">Application Fee</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
                  Application Progress
                </CardTitle>
              </div>
              <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                75%
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={timelineData}>
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
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => `${value}%`}
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
                  dataKey="progress"
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

        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-lime-100 rounded-lg">
                  <Vote className="h-4 w-4 text-lime-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Nomination Steps
                </CardTitle>
              </div>
              <span className="text-xs text-slate-400">3 of 5 complete</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={processStepsData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="step"
                  type="category"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  width={65}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => `${value}%`}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="completed" radius={[0, 6, 6, 0]}>
                  {processStepsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className={`flex items-center justify-between p-3 rounded-lg ${
                  item.status === "completed" ? "bg-emerald-50" : "bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.status === "completed" ? (
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <CircleDot className="h-4 w-4 text-slate-400" />
                  )}
                  <span className="text-sm text-slate-700">{item.event}</span>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-md ${
                    item.status === "completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.date}
                </span>
              </div>
            ))}

            {/* Countdown */}
            <div className="mt-3 p-4 rounded-xl bg-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Submission Deadline</p>
                  <p className="text-sm font-medium text-white mt-0.5">
                    February 15, 2026
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">22</p>
                  <p className="text-xs text-slate-400">days left</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Constituency Details */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-100 rounded-lg">
                  <MapPin className="h-4 w-4 text-cyan-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Your Constituency
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-slate-500 hover:text-slate-800"
              >
                Edit
                <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-blue-50">
                <p className="text-xs text-slate-500">District</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">
                  GANGTOK
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <p className="text-xs text-slate-500">ULB</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">
                  Gangtok MC
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <p className="text-xs text-slate-500">Ward Number</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">
                  Ward 2
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <p className="text-xs text-slate-500">Reservation</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">
                  UR (General)
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-cyan-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Ward Name</p>
                  <p className="text-base font-bold text-slate-800 mt-0.5">
                    Upper Burtuk
                  </p>
                </div>
                <span className="text-xs font-medium text-cyan-700 bg-cyan-100 px-2 py-1 rounded-md">
                  28-Upper Burtuk
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

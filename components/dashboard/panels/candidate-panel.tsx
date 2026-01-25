"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Calendar,
  IndianRupee,
  User,
  FileCheck,
  MapPin,
  ArrowUpRight,
  CircleDot,
  ClipboardCheck,
  RotateCcw,
} from "lucide-react";

import { electionData } from "@/lib/election-data";
import { useNominationSubmission } from "@/app/context/nomination-submission-context";

// Important dates data
const importantDates = [
  { event: "Nomination Opens", date: "Jan 20, 2026", status: "completed" },
  { event: "Last Date", date: "Feb 15, 2026", status: "upcoming" },
  { event: "Scrutiny", date: "Feb 18, 2026", status: "upcoming" },
  { event: "Election Day", date: "Mar 5, 2026", status: "upcoming" },
];

export function CandidatePanel() {
  const { submissionData, resetNomination } = useNominationSubmission();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs font-medium">
            Submitted
          </Badge>
        );
      case "under_review":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs font-medium">
            Under Review
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs font-medium">
            Approved
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 text-xs font-medium">
            Draft
          </Badge>
        );
    }
  };

  const getPaymentBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "paid":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs font-medium">
            Paid
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs font-medium">
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs font-medium">
            Pending
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
            Applicant Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {electionData.election}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Developer Reset Button */}
          {/* <Button
            variant="outline"
            size="sm"
            onClick={resetNomination}
            className="flex items-center gap-2 border-dashed"
          >
            <RotateCcw className="h-4 w-4" />
            Dev Reset
          </Button> */}
          {submissionData.isSubmitted && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetNomination}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm">
            <User className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              MC2026-0142
            </span>
          </div>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-amber-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <FileCheck className="h-5 w-5 text-amber-600" />
              {getStatusBadge(submissionData.status)}
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {submissionData.status === "draft" ? "Draft" : "Review"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {submissionData.submissionDate
                  ? `Updated ${new Date(submissionData.submissionDate).toLocaleDateString()}`
                  : "Not submitted yet"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <ClipboardCheck className="h-5 w-5 text-emerald-600" />
              {getStatusBadge(submissionData.status)}
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {submissionData.isSubmitted ? "1/1" : "0/1"}
              </p>
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
              {getPaymentBadge(submissionData.paymentStatus)}
            </div>
            <div className="mt-3">
              {submissionData.paymentStatus === "paid" ? (
                <>
                  <p className="text-2xl font-bold text-slate-800">
                    ₹{submissionData.applicationFee}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Application Fee Paid
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-slate-800">--</p>
                  <p className="text-xs text-slate-500 mt-1">Application Fee</p>
                </>
              )}
            </div>
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
              {!submissionData.isSubmitted && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-slate-500 hover:text-slate-800"
                >
                  Edit
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {submissionData.isSubmitted ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-blue-50">
                    <p className="text-xs text-slate-500">District</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">
                      {submissionData.district}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50">
                    <p className="text-xs text-slate-500">ULB</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">
                      {submissionData.ulb}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50">
                    <p className="text-xs text-slate-500">Ward Number</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">
                      {submissionData.wardNumber}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-50">
                    <p className="text-xs text-slate-500">Reservation</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">
                      {submissionData.reservation}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-cyan-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Ward Name</p>
                      <p className="text-base font-bold text-slate-800 mt-0.5">
                        {submissionData.wardName}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-cyan-700 bg-cyan-100 px-2 py-1 rounded-md">
                      {submissionData.constituency}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-2">
                  No constituency selected
                </p>
                <p className="text-xs text-slate-400">
                  Complete your nomination form to see constituency details
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  IndianRupee,
  User,
  FileCheck,
  MapPin,
  CircleDot,
  ClipboardCheck,
  Download,
  Eye,
  AlertTriangle,
  Loader2,
  FileText,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import html2PDF from "jspdf-html2canvas";
import { useCandidateDashboard } from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export function CandidatePanel() {
  const { data, isLoading, error, refetch } = useCandidateDashboard();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "submitted":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs font-medium">
            Submitted
          </Badge>
        );
      case "received":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs font-medium">
            Received
          </Badge>
        );
      case "under_review":
      case "under_scrutiny":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs font-medium">
            Under Review
          </Badge>
        );
      case "approved":
      case "accepted":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs font-medium">
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs font-medium">
            Rejected
          </Badge>
        );
      case "withdrawn":
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 text-xs font-medium">
            Withdrawn
          </Badge>
        );
      case "contesting":
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-xs font-medium">
            Contesting
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
    const statusLower = paymentStatus?.toLowerCase() || "pending";
    switch (statusLower) {
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

  const generatePDF = async (nomination: any) => {
    setSelectedSubmissionId(nomination.id);
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

    const currentDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    tempDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 18pt; font-weight: bold; margin: 0 0 8px 0;">FORM-18</h1>
        <p style="font-size: 10pt; color: #666666; margin: 0 0 8px 0;">[See sub-rule (3) of rule 25]</p>
        <h2 style="font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 0 0 8px 0;">NOMINATION PAPER</h2>
        <p style="font-size: 11pt; color: #666666; margin: 0;">Municipality Election 2026</p>
      </div>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      <div style="margin-bottom: 24px;">
        <p style="margin: 12px 0;">Application No: <strong>${nomination.applicationNo}</strong></p>
        <p style="margin: 12px 0;">Ward: <strong>${nomination.wardName}</strong></p>
        <p style="margin: 12px 0;">ULB: <strong>${nomination.ulbName}</strong></p>
        <p style="margin: 12px 0;">District: <strong>${nomination.districtName}</strong></p>
        <p style="margin: 12px 0;">Status: <strong>${nomination.status.toUpperCase()}</strong></p>
      </div>
      <div style="margin-top: 40px; text-align: center; font-size: 10pt; color: #666;">
        <p style="margin: 0;">Application ID: ${nomination.applicationNo}</p>
        <p style="margin: 4px 0 0 0;">Generated on: ${currentDate}</p>
      </div>
    `;

    document.body.appendChild(tempDiv);

    try {
      await html2PDF(tempDiv, {
        jsPDF: {
          unit: "pt",
          format: "a4",
          orientation: "portrait",
        },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          scrollX: 0,
          scrollY: 0,
          logging: false,
        },
        imageType: "image/jpeg",
        imageQuality: 0.98,
        margin: {
          top: 40,
          right: 40,
          bottom: 40,
          left: 40,
        },
        autoResize: true,
        output: `FORM-18_Nomination_${nomination.applicationNo}.pdf`,
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      document.body.removeChild(tempDiv);
      setIsGeneratingPdf(false);
      setSelectedSubmissionId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5 p-6 min-h-screen">
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
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
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
    submissions,
    latestNomination,
    electionSchedule,
    daysRemaining,
  } = data;
  const status = latestNomination?.status || "draft";
  const paymentStatus = latestNomination?.paymentStatus || "pending";

  return (
    <div className="space-y-5 p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Applicant Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Municipal Election 2026
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm">
            <User className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              {user.applicationId || user.name}
            </span>
          </div>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          className={`border-0 shadow-sm rounded-xl ${
            status === "approved" ||
            status === "accepted" ||
            status === "contesting"
              ? "bg-green-50"
              : status === "rejected"
                ? "bg-red-50"
                : status === "received"
                  ? "bg-blue-50"
                  : "bg-amber-50"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <FileCheck
                className={`h-5 w-5 ${
                  status === "approved" ||
                  status === "accepted" ||
                  status === "contesting"
                    ? "text-green-600"
                    : status === "rejected"
                      ? "text-red-600"
                      : status === "received"
                        ? "text-blue-600"
                        : "text-amber-600"
                }`}
              />
              {getStatusBadge(status)}
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800 capitalize">
                {status === "draft" ? "Draft" : status.replace("_", " ")}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {latestNomination?.submittedAt
                  ? `Updated ${new Date(latestNomination.submittedAt).toLocaleDateString()}`
                  : "Not submitted yet"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submission Counter Card */}
        <Card
          className={`border-0 shadow-sm rounded-xl ${!submissions.canSubmitMore ? "bg-red-50" : "bg-emerald-50"}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <ClipboardCheck
                className={`h-5 w-5 ${!submissions.canSubmitMore ? "text-red-600" : "text-emerald-600"}`}
              />
              <Badge
                className={`text-xs font-medium ${!submissions.canSubmitMore ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
              >
                {!submissions.canSubmitMore ? "Max Reached" : "Active"}
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {submissions.count}/{submissions.maxAllowed}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Online Forms Submitted
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Calendar className="h-5 w-5 text-rose-600" />
              <span className="text-xs text-slate-500">
                {electionSchedule.find((s) => s.highlight)?.date || "TBD"}
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {daysRemaining !== null && daysRemaining > 0
                  ? daysRemaining
                  : "—"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Days Remaining for Nomination
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <IndianRupee className="h-5 w-5 text-blue-600" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Payment Status</span>
                {getPaymentBadge(paymentStatus)}
              </div>
            </div>
            <div className="mt-3">
              {paymentStatus === "paid" ? (
                <>
                  <p className="text-2xl font-bold text-slate-800">
                    ₹{latestNomination?.paymentAmount || 0}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Payment Completed
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-slate-800">--</p>
                  <p className="text-xs text-slate-500 mt-1">Payment Pending</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Max Nominations Alert */}
      {!submissions.canSubmitMore && (
        <Card className="bg-amber-50 border-amber-200 border shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800">
                  Maximum Nominations Reached
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  You have submitted the maximum allowed{" "}
                  {submissions.maxAllowed} nomination forms online. For any
                  additional nominations, please submit them offline directly to
                  the Returning Officer (RO) at your ward office.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Latest Nomination / Draft Card */}
      {latestNomination ? (
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <FileText className="h-4 w-4 text-indigo-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Your Nomination
                </CardTitle>
              </div>
              <Badge className="bg-indigo-100 text-indigo-700 text-xs">
                Latest Submission
              </Badge>
            </div>
          </CardHeader>
          <div className="px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-r-lg -mt-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-800 font-medium">
                📋 Important: Please download and save your nomination form
                before the scrutiny date
              </p>
            </div>
          </div>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-700 font-bold">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Nomination Application
                  </p>
                  <p className="text-xs text-slate-500">
                    {latestNomination.applicationNo} • Submitted{" "}
                    {new Date(
                      latestNomination.submittedAt,
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(latestNomination.status)}

                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        Nomination - {latestNomination.applicationNo}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-slate-50">
                          <p className="text-xs text-slate-500">Status</p>
                          <p className="text-sm font-medium capitalize">
                            {latestNomination.status}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50">
                          <p className="text-xs text-slate-500">Payment</p>
                          <p className="text-sm font-medium capitalize">
                            {latestNomination.paymentStatus}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50">
                          <p className="text-xs text-slate-500">Ward</p>
                          <p className="text-sm font-medium">
                            {latestNomination.wardName}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50">
                          <p className="text-xs text-slate-500">ULB</p>
                          <p className="text-sm font-medium">
                            {latestNomination.ulbName}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 col-span-2">
                          <p className="text-xs text-slate-500">District</p>
                          <p className="text-sm font-medium">
                            {latestNomination.districtName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  size="sm"
                  className="h-8 text-xs bg-slate-800 hover:bg-slate-700"
                  onClick={() => generatePDF(latestNomination)}
                  disabled={isGeneratingPdf}
                >
                  {isGeneratingPdf &&
                  selectedSubmissionId === latestNomination.id ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3 mr-1" />
                  )}
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-50 border-dashed border-2 border-slate-200 shadow-sm rounded-xl">
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-2">
              No Nomination Yet
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              You haven&apos;t submitted any nomination forms yet.
            </p>
            <p className="text-xs text-slate-400">
              You can submit up to {submissions.maxAllowed} nomination forms.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Important Dates - Election Schedule */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-pink-100 rounded-lg">
                <Calendar className="h-4 w-4 text-pink-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-800">
                Election Schedule
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {electionSchedule.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                    item.highlight
                      ? "bg-rose-100 border-2 border-rose-300"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-xs font-medium text-slate-500">
                      {item.slNo}
                    </span>
                    {item.highlight ? (
                      <Clock className="h-4 w-4 text-rose-600" />
                    ) : (
                      <CircleDot className="h-4 w-4 text-slate-400" />
                    )}
                    <span
                      className={`text-sm ${
                        item.highlight
                          ? "text-rose-800 font-semibold"
                          : "text-slate-700"
                      }`}
                    >
                      {item.event}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-md ${
                      item.highlight
                        ? "bg-rose-200 text-rose-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.date}
                  </span>
                </div>
              ))}
            </div>

            {/* Countdown */}
            <div className="mt-3 p-4 rounded-xl bg-primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Nomination Deadline</p>
                  <p className="text-sm font-medium text-white mt-0.5">
                    {electionSchedule.find((s) => s.highlight)?.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">
                    {daysRemaining !== null && daysRemaining > 0
                      ? daysRemaining
                      : "—"}
                  </p>
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
                  Your Contesting Area
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {latestNomination ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-blue-50">
                    <p className="text-xs text-slate-500">District</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">
                      {latestNomination.districtName}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50">
                    <p className="text-xs text-slate-500">ULB</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">
                      {latestNomination.ulbName}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50">
                    <p className="text-xs text-slate-500">Ward</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">
                      {latestNomination.wardName}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-50">
                    <p className="text-xs text-slate-500">Reservation</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">
                      {latestNomination.reservation}
                    </p>
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

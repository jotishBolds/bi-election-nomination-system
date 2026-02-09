"use client";

import { useState, useRef } from "react";
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
  Download,
  Eye,
  AlertTriangle,
  Loader2,
  FileText,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import html2PDF from "jspdf-html2canvas";

import { electionData } from "@/lib/election-data";
import { useNominationSubmission } from "@/app/context/nomination-submission-context";
import {
  StoredNomination,
  getUniqueCandidateNomination,
} from "@/lib/nomination-storage";

// Important dates data with election schedule
const electionSchedule = [
  {
    slNo: "i",
    event: "Issue of Notification",
    date: "01.03.2026",
    dateObj: new Date("2026-03-01"),
    status: "upcoming",
  },
  {
    slNo: "ii",
    event: "Last date for making nomination",
    date: "08.03.2026",
    dateObj: new Date("2026-03-08"),
    status: "upcoming",
    highlight: true,
  },
  {
    slNo: "iii",
    event: "Date for scrutiny of Nomination",
    date: "09.03.2026",
    dateObj: new Date("2026-03-09"),
    status: "upcoming",
  },
  {
    slNo: "iv",
    event: "Last date for withdrawal",
    date: "11.03.2026",
    dateObj: new Date("2026-03-11"),
    status: "upcoming",
  },
  {
    slNo: "v",
    event: "Date of Poll (if necessary)",
    date: "31.03.2026",
    dateObj: new Date("2026-03-31"),
    status: "upcoming",
  },
  {
    slNo: "vi",
    event: "Election completion date",
    date: "06.04.2026",
    dateObj: new Date("2026-04-06"),
    status: "upcoming",
  },
  {
    slNo: "-",
    event: "Counting of votes",
    date: "03.04.2026",
    dateObj: new Date("2026-04-03"),
    status: "upcoming",
  },
];

// Calculate days remaining until last nomination date
const lastNominationDate = new Date("2026-03-08");
const today = new Date();
const daysRemaining = 7;

export function CandidatePanel() {
  const { submissionData, resetNomination, canSubmitMore, candidateId } =
    useNominationSubmission();
  const [selectedSubmission, setSelectedSubmission] =
    useState<StoredNomination | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
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
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs font-medium">
            Under Review
          </Badge>
        );
      case "approved":
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
      case "uncontesting":
        return (
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs font-medium">
            Uncontesting
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

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: "General",
      sc: "Scheduled Caste",
      st_bl: "Scheduled Tribe (BL)",
      st_lt: "Scheduled Tribe (LT)",
      obc_central: "OBC (Central List)",
      obc_state: "OBC (State List)",
    };
    return labels[category] || category;
  };

  const generateFormHTML = (
    formData: any,
    submissionNumber: number,
    applicationId: string,
  ) => {
    const currentDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    return `
      <!-- Form Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 18pt; font-weight: bold; margin: 0 0 8px 0;">FORM-18</h1>
        <p style="font-size: 10pt; color: #666666; margin: 0 0 8px 0;">[See sub-rule (3) of rule 25]</p>
        <h2 style="font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 0 0 8px 0;">NOMINATION PAPER</h2>
        <p style="font-size: 11pt; color: #666666; margin: 0;">Municipality Election 2026</p>
      </div>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />

      <!-- Proposer Section -->
      <div style="margin-bottom: 24px;">
        <p style="margin: 12px 0;">* I nominate as a candidate for election to the <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 200px;">${formData.municipality || ""}</span> Municipality from the <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 150px;">${formData.municipalWard || ""}</span> Municipal ward.</p>

        <p style="margin: 12px 0;">Candidate's name: <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 280px;">${formData.candidateName || ""}</span></p>

        <p style="margin: 12px 0;">Father's / Husband's name: <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 230px;">${formData.fatherOrHusbandName || ""}</span></p>

        <p style="margin: 12px 0;">Full postal address: <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 300px;">${formData.fullPostalAddress || ""}</span></p>

        <p style="margin: 12px 0;">His name is entered at Serial No. <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 60px;">${formData.serialNoCandidate || "___"}</span> in Part No. <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 60px;">${formData.partNoCandidate || "___"}</span> of electoral roll of the Municipality.</p>

        <p style="margin: 16px 0;">My name is <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 120px;">${formData.proposerName || ""}</span> and it is entered at Serial No. <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 60px;">${formData.proposerSerialNo || ""}</span> in Part No. <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 60px;">${formData.proposerPartNo || ""}</span> of the electoral roll of the Municipality.</p>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px;">
          <p style="margin: 0;">Date: <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 140px;">${currentDate}</span></p>
          <div style="text-align: center;">
            <div style="border-top: 1px solid #000; width: 200px; padding-top: 5px; margin-top: 30px;">
              <span style="font-size: 10pt;">(Signature of the proposer)</span>
            </div>
          </div>
        </div>

        <p style="font-style: italic; font-size: 10pt; margin-top: 12px;">* Appropriate particulars of the election to be inserted here.</p>
      </div>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />

      <!-- Candidate Declaration Section -->
      <div style="margin-bottom: 24px;">
        <p style="font-weight: 500; margin-bottom: 16px;">I, the above-mentioned candidate, assent to this nomination and hereby declare:-</p>

        <div style="margin-left: 20px;">
          <p style="margin: 10px 0;">(a) that I have completed <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 40px;">${formData.age || "18"}</span> years of age.</p>

          <p style="margin: 10px 0;">(b) that I am set up at this election by <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 180px;">${formData.politicalParty || ""}</span> Political Party.</p>

          <p style="margin: 10px 0;">(c) that the symbols I have chosen are, in order of preference:</p>

          <div style="margin-left: 30px;">
            <div style="display: flex; align-items: center; gap: 16px; margin: 12px 0; padding: 12px; background-color: #f5f5f5; border-radius: 6px;">
              ${formData.partySymbolImage ? `<img src="${formData.partySymbolImage}" alt="${formData.partySymbol || ""}" style="width: 50px; height: 50px; object-fit: contain; border: 1px solid #ddd; background-color: white; padding: 4px; border-radius: 4px;" />` : ""}
              <div>
                <p style="margin: 2px 0;">(i) <span style="font-weight: 600;">${formData.symbolPreference1 || formData.partySymbol || ""}</span></p>
                <p style="margin: 2px 0;">(ii) <span style="font-weight: 600;">${formData.symbolPreference2 || ""}</span></p>
                <p style="margin: 2px 0;">(iii) <span style="font-weight: 600;">${formData.symbolPreference3 || ""}</span></p>
              </div>
            </div>
          </div>

          <p style="margin: 10px 0;">(d) that my name and my *father's / husband's name have been correctly spelt out above;</p>

          <p style="margin: 10px 0;">(e) that to the best of my knowledge and belief, I am qualified and not also disqualified for being chosen to fill the seat in the <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 200px;">${formData.municipality || ""}</span> Municipality.</p>

          ${formData.category && formData.category !== "general" ? `<p style="margin: 10px 0;">* I further declare that I am a member of the <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 150px;">${formData.casteTribeName || ""}</span> caste/tribe, which is a <strong>${getCategoryLabel(formData.category)}</strong> of the State of Sikkim.</p>` : ""}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px;">
          <p style="margin: 0;">Date: <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 140px;">${currentDate}</span></p>
          <div style="text-align: center;">
            <div style="border-top: 1px solid #000; width: 200px; padding-top: 5px; margin-top: 30px;">
              <span style="font-size: 10pt;">(Signature of candidate)</span>
            </div>
          </div>
        </div>

        <p style="font-style: italic; font-size: 10pt; margin-top: 12px;">* Strike out whatever is not applicable.</p>
      </div>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />

      <!-- Official Use Section -->
      <div style="padding: 16px; border: 1px solid #ddd; border-radius: 6px; background-color: #fafafa;">
        <p style="font-weight: 500; text-align: center; margin-bottom: 16px;">(To be filled by the Municipality Returning Officer)</p>
        <p style="margin: 12px 0;">Serial No. of the nomination paper: <span style="border-bottom: 1px solid #000; display: inline-block; min-width: 150px;">&nbsp;</span></p>
        <p style="margin: 12px 0;">This nomination was delivered to me at my office at: <span style="border-bottom: 1px solid #000; display: inline-block; min-width: 150px;">&nbsp;</span></p>
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px;">
          <p style="margin: 0;">Date: <span style="border-bottom: 1px solid #000; display: inline-block; min-width: 120px;">&nbsp;</span></p>
          <p style="font-weight: 500; margin: 0;">Municipal Returning Officer</p>
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top: 40px; text-align: center; font-size: 10pt; color: #666;">
        <p style="margin: 0;">Application ID: ${applicationId} | Submission: ${submissionNumber}/3</p>
        <p style="margin: 4px 0 0 0;">Generated on: ${currentDate}</p>
      </div>
    `;
  };

  const generatePDF = async (submission: StoredNomination) => {
    setSelectedSubmission(submission);
    setIsGeneratingPdf(true);

    // Create temporary element for PDF generation
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    tempDiv.style.width = "794px"; // A4 width in pixels
    tempDiv.style.fontFamily = "'Times New Roman', Times, serif";
    tempDiv.style.fontSize = "12pt";
    tempDiv.style.lineHeight = "1.6";
    tempDiv.style.backgroundColor = "#ffffff";
    tempDiv.style.color = "#000000";
    tempDiv.style.padding = "40px";

    // Generate the form content
    tempDiv.innerHTML = generateFormHTML(
      submission.formData,
      submission.submissionNumber,
      submission.applicationId,
    );

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
        output: `FORM-18_Nomination_${submission.formData.candidateName?.replace(/\s+/g, "_") || "Paper"}_${submission.submissionNumber}.pdf`,
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      document.body.removeChild(tempDiv);
      setIsGeneratingPdf(false);
    }
  };

  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const canApply = canSubmitMore();
  const submissionCount = submissionData.submissionCount;
  const maxSubmissions = submissionData.maxSubmissions;

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
        <Card
          className={`border-0 shadow-sm rounded-xl ${
            submissionData.status === "approved" ||
            submissionData.status === "contesting"
              ? "bg-green-50"
              : submissionData.status === "rejected"
                ? "bg-red-50"
                : submissionData.status === "received"
                  ? "bg-blue-50"
                  : "bg-amber-50"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <FileCheck
                className={`h-5 w-5 ${
                  submissionData.status === "approved" ||
                  submissionData.status === "contesting"
                    ? "text-green-600"
                    : submissionData.status === "rejected"
                      ? "text-red-600"
                      : submissionData.status === "received"
                        ? "text-blue-600"
                        : "text-amber-600"
                }`}
              />
              {getStatusBadge(submissionData.status)}
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {submissionData.status === "draft"
                  ? "Draft"
                  : submissionData.status === "submitted"
                    ? "Submitted"
                    : submissionData.status === "received"
                      ? "Received"
                      : submissionData.status === "approved"
                        ? "Accepted"
                        : submissionData.status === "rejected"
                          ? "Rejected"
                          : submissionData.status === "contesting"
                            ? "Contesting"
                            : "Review"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {submissionData.submissionDate
                  ? `Updated ${new Date(submissionData.submissionDate).toLocaleDateString()}`
                  : "Not submitted yet"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submission Counter Card - Key Feature */}
        <Card
          className={`border-0 shadow-sm rounded-xl ${submissionCount >= maxSubmissions ? "bg-red-50" : "bg-emerald-50"}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <ClipboardCheck
                className={`h-5 w-5 ${submissionCount >= maxSubmissions ? "text-red-600" : "text-emerald-600"}`}
              />
              <Badge
                className={`text-xs font-medium ${submissionCount >= maxSubmissions ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
              >
                {submissionCount >= maxSubmissions ? "Max Reached" : "Active"}
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {submissionCount}/{maxSubmissions}
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
              <span className="text-xs text-slate-500">Mar 8, 2026</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {daysRemaining > 0 ? daysRemaining : 0}
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
                {getPaymentBadge(submissionData.paymentStatus)}
              </div>
            </div>
            <div className="mt-3">
              {submissionData.paymentStatus === "paid" ? (
                <>
                  <p className="text-2xl font-bold text-slate-800">
                    ₹{submissionData.applicationFee}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {submissionData.submissionCount > 1
                      ? `Initial Payment (${submissionData.submissionCount} submissions)`
                      : "Payment Completed"}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-slate-800">--</p>
                  <p className="text-xs text-slate-500 mt-1"></p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nomination Status Alert */}
      {!canApply && (
        <Card className="bg-amber-50 border-amber-200 border shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800">
                  Maximum Nominations Reached
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  You have submitted the maximum allowed {maxSubmissions}{" "}
                  nomination forms online. As per election rules, candidates can
                  submit up to 3 nominations for the same ward. For any
                  additional nominations beyond this limit, please submit them
                  offline directly to the Returning Officer (RO) at your ward
                  office.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Latest Nomination / Draft Card */}
      {getUniqueCandidateNomination(candidateId) ? (
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
                before the scrutiny date (March 9, 2026)
              </p>
            </div>
          </div>
          <CardContent className="px-4 pb-4 space-y-3">
            {(() => {
              const latestSubmission =
                getUniqueCandidateNomination(candidateId);
              if (!latestSubmission) return null;

              return (
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-700 font-bold">
                        {latestSubmission.submissionNumber}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Nomination Application
                      </p>
                      <p className="text-xs text-slate-500">
                        {latestSubmission.applicationId} • Submitted{" "}
                        {new Date(
                          latestSubmission.submittedAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(latestSubmission.status)}

                    {/* View Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() =>
                            setSelectedSubmission(latestSubmission)
                          }
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            Nomination Form - {latestSubmission.applicationId}
                          </DialogTitle>
                        </DialogHeader>
                        <div
                          className="p-6 bg-white"
                          style={{
                            fontFamily: "'Times New Roman', Times, serif",
                            fontSize: "12pt",
                            lineHeight: "1.6",
                          }}
                        >
                          <div
                            dangerouslySetInnerHTML={{
                              __html: generateFormHTML(
                                latestSubmission.formData,
                                latestSubmission.submissionNumber,
                                latestSubmission.applicationId,
                              ),
                            }}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Download Button */}
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-slate-800 hover:bg-slate-700"
                      onClick={() => generatePDF(latestSubmission)}
                      disabled={isGeneratingPdf}
                    >
                      {isGeneratingPdf &&
                      selectedSubmission?.id === latestSubmission.id ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3 mr-1" />
                      )}
                      PDF
                    </Button>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      ) : (
        /* Draft Card - Show when no submissions */
        <Card className="bg-slate-50 border-dashed border-2 border-slate-200 shadow-sm rounded-xl">
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-2">Draft</h3>
            <p className="text-sm text-slate-500 mb-4">Not submitted yet</p>
            <p className="text-xs text-slate-400">
              You can submit up to {maxSubmissions} nomination forms. Complete
              your first submission to get started.
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
                      className={`text-sm ${item.highlight ? "text-rose-800 font-semibold" : "text-slate-700"}`}
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
                  <p className="text-xs text-white">Nomination Deadline</p>
                  <p className="text-sm font-medium text-white mt-0.5">
                    March 8, 2026
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">
                    {daysRemaining > 0 ? daysRemaining : 0}
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

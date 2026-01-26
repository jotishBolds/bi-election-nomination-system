"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  Eye,
  Download,
  Loader2,
  FileText,
  ArrowLeft,
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
import html2PDF from "jspdf-html2canvas";

import { electionData } from "@/lib/election-data";
import {
  getRONominations,
  getUniqueCandidatesCount,
  getTotalNominationsCount,
  getNominationsGroupedByCandidate,
  StoredNomination,
} from "@/lib/nomination-storage";

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

// Election schedule with dates
const electionSchedule = [
  {
    slNo: "i",
    event: "Issue of Notification",
    date: "01.03.2026",
    highlight: false,
  },
  {
    slNo: "ii",
    event: "Last date for making nomination",
    date: "08.03.2026",
    highlight: true,
  },
  {
    slNo: "iii",
    event: "Date for scrutiny of Nomination",
    date: "09.03.2026",
    highlight: false,
  },
  {
    slNo: "iv",
    event: "Last date for withdrawal",
    date: "11.03.2026",
    highlight: false,
  },
  {
    slNo: "v",
    event: "Date of Poll (if necessary)",
    date: "31.03.2026",
    highlight: false,
  },
  {
    slNo: "vi",
    event: "Election completion date",
    date: "06.04.2026",
    highlight: false,
  },
  {
    slNo: "-",
    event: "Counting of votes",
    date: "03.04.2026",
    highlight: false,
  },
];

// Calculate days remaining
const lastNominationDate = new Date("2026-03-08");
const today = new Date();
const daysRemaining = Math.ceil(
  (lastNominationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
);
// Important dates
const importantDates = [
  { event: "Nomination Opens", date: "Jan 20, 2026", status: "completed" },
  { event: "Last Date", date: "Mar 8, 2026", status: "upcoming" },
  { event: "Scrutiny", date: "Mar 9, 2026", status: "upcoming" },
  { event: "Election Day", date: "Mar 31, 2026", status: "upcoming" },
];

export function ROPanel() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  const [nominations, setNominations] = useState<StoredNomination[]>([]);
  const [uniqueCandidates, setUniqueCandidates] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [selectedSubmission, setSelectedSubmission] =
    useState<StoredNomination | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Load nominations data
  useEffect(() => {
    const loadNominations = () => {
      const allNominations = getRONominations();
      setNominations(allNominations);
      setUniqueCandidates(getUniqueCandidatesCount());
      setTotalSubmissions(getTotalNominationsCount());
    };

    loadNominations();
    // Refresh every 5 seconds to catch new submissions
    const interval = setInterval(loadNominations, 5000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic nomination status based on actual data
  const nominationStatusData = [
    {
      name: "Submitted",
      value: nominations.filter((n) => n.status === "submitted").length || 0,
      color: "#22c55e",
    },
    {
      name: "Under Review",
      value: nominations.filter((n) => n.status === "under_review").length || 0,
      color: "#6366f1",
    },
    {
      name: "Approved",
      value: nominations.filter((n) => n.status === "approved").length || 0,
      color: "#f59e0b",
    },
    {
      name: "Rejected",
      value: nominations.filter((n) => n.status === "rejected").length || 0,
      color: "#ef4444",
    },
  ];

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
        <p style="margin: 12px 0;">* I nominate as an applicant for election to the <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 200px;">${formData.municipality || ""}</span> Municipality from the <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 150px;">${formData.municipalWard || ""}</span> Municipal ward.</p>

        <p style="margin: 12px 0;">Applicant's name: <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 280px;">${formData.candidateName || ""}</span></p>

        <p style="margin: 12px 0;">Father's / Husband's name: <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 230px;">${formData.fatherOrHusbandName || ""}</span></p>

        <p style="margin: 12px 0;">Full postal address: <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 300px;">${formData.fullPostalAddress || ""}</span></p>

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

      <!-- Applicant Declaration Section -->
      <div style="margin-bottom: 24px;">
        <p style="font-weight: 500; margin-bottom: 16px;">I, the above mentioned applicant, assent to this nomination and hereby declare:-</p>

        <div style="margin-left: 20px;">
          <p style="margin: 10px 0;">(a) that I have completed <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 40px;">${formData.age || ""}</span> years of age.</p>

          <p style="margin: 10px 0;">(b) that the symbol I have chosen is:</p>

          <div style="display: flex; align-items: center; gap: 16px; margin: 12px 0 12px 30px; padding: 12px; background-color: #f5f5f5; border-radius: 6px;">
            ${formData.partySymbolImage ? `<img src="${formData.partySymbolImage}" alt="${formData.partySymbol || ""}" style="width: 60px; height: 60px; object-fit: contain; border: 1px solid #ddd; background-color: white; padding: 4px; border-radius: 4px;" />` : ""}
            <div>
              <p style="font-weight: 600; margin: 0 0 4px 0;">${formData.partySymbol || ""}</p>
              <span style="display: inline-block; padding: 2px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 10pt; background-color: #fff;">${formData.politicalParty || ""}</span>
            </div>
          </div>

          <p style="margin: 10px 0;">(c) that I am set up at this election by <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 180px;">${formData.politicalParty || ""}</span> Political Party.</p>

          <p style="margin: 10px 0;">(d) that my name and my *father's / husband's name have been correctly spelt out above;</p>

          <p style="margin: 10px 0;">(e) that to the best of my knowledge and belief, I am qualified and not also disqualified for being chosen to fill the seat in the <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 200px;">${formData.municipality || ""}</span> Municipality.</p>

          ${formData.category && formData.category !== "general" ? `<p style="margin: 10px 0;">* I further declare that I am a member of the <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 150px;">${formData.casteTribeName || ""}</span> caste/tribe, which is a <strong>${getCategoryLabel(formData.category)}</strong> of the State of Sikkim.</p>` : ""}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px;">
          <p style="margin: 0;">Date: <span style="border-bottom: 1px solid #000; padding: 0 8px; font-weight: 500; display: inline-block; min-width: 140px;">${currentDate}</span></p>
          <div style="text-align: center;">
            <div style="border-top: 1px solid #000; width: 200px; padding-top: 5px; margin-top: 30px;">
              <span style="font-size: 10pt;">(Signature of applicant)</span>
            </div>
          </div>
        </div>

        <p style="font-style: italic; font-size: 10pt; margin-top: 12px;">* Strike out whatever is not applicable.</p>
      </div>

      <!-- Footer -->
      <div style="margin-top: 40px; text-align: center; font-size: 10pt; color: #666;">
        <p style="margin: 0;">Application ID: ${applicationId} | Submission: ${submissionNumber}/3</p>
        <p style="margin: 4px 0 0 0;">Generated on: ${currentDate}</p>
      </div>
    `;
  };

  const generatePDF = async (nomination: StoredNomination) => {
    setSelectedSubmission(nomination);
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
      nomination.formData,
      nomination.submissionNumber,
      nomination.applicationId,
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
          scrollY: -window.scrollY,
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
        output: `FORM-18_${nomination.formData.candidateName?.replace(/\s+/g, "_") || "Nomination"}_${nomination.applicationId}.pdf`,
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      document.body.removeChild(tempDiv);
      setIsGeneratingPdf(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 text-xs">
            Submitted
          </Badge>
        );
      case "under_review":
        return (
          <Badge className="bg-amber-100 text-amber-700 text-xs">
            Under Review
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 text-xs">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 text-xs">Rejected</Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 text-xs">Draft</Badge>
        );
    }
  };

  // Nomination List View
  if (activeTab === "nominations") {
    return (
      <div className="space-y-5 p-6 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">
                Nomination List
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {electionData.election} - All Submitted Nominations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm">
            <User className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              RO-GANGTOK
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-emerald-50 border-0 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <FileCheck className="h-5 w-5 text-emerald-600" />
                <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                  Total
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-slate-800">
                  {totalSubmissions}
                </p>
                <p className="text-xs text-slate-500 mt-1">Total Submissions</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-0 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-blue-600" />
                <Badge className="bg-blue-100 text-blue-700 text-xs">
                  Unique
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-slate-800">
                  {uniqueCandidates}
                </p>
                <p className="text-xs text-slate-500 mt-1">Unique Candidates</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-0 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Clock className="h-5 w-5 text-amber-600" />
                <Badge className="bg-amber-100 text-amber-700 text-xs">
                  Pending
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-slate-800">
                  {nominations.filter((n) => n.status === "submitted").length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Pending Review</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Nominations Table */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <ClipboardList className="h-4 w-4 text-indigo-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  All Nominations
                </CardTitle>
              </div>
              <Badge className="bg-indigo-100 text-indigo-700 text-xs">
                {nominations.length} records
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {nominations.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-600 mb-2">
                  No Nominations Yet
                </h3>
                <p className="text-sm text-slate-400">
                  Nominations will appear here once candidates submit their
                  forms.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {nominations.map((nomination) => (
                  <div
                    key={nomination.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {nomination.formData.candidateName ||
                            "Unknown Candidate"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {nomination.applicationId} •{" "}
                          {nomination.formData.municipality} -{" "}
                          {nomination.formData.municipalWard}
                        </p>
                        <p className="text-xs text-slate-400">
                          Submitted:{" "}
                          {new Date(nomination.submittedAt).toLocaleString()} •
                          Submission #{nomination.submissionNumber}/3
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(nomination.status)}

                      {/* View Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => setSelectedSubmission(nomination)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Nomination Form -{" "}
                              {nomination.formData.candidateName}
                            </DialogTitle>
                          </DialogHeader>
                          <div
                            id={`ro-preview-content-${nomination.id}`}
                            className="p-6 bg-white"
                            style={{
                              fontFamily: "'Times New Roman', Times, serif",
                              fontSize: "12pt",
                              lineHeight: "1.6",
                            }}
                          >
                            {/* Form Header */}
                            <div
                              style={{
                                textAlign: "center",
                                marginBottom: "24px",
                              }}
                            >
                              <h1
                                style={{
                                  fontSize: "18pt",
                                  fontWeight: "bold",
                                  margin: "0 0 8px 0",
                                }}
                              >
                                FORM-18
                              </h1>
                              <p
                                style={{
                                  fontSize: "10pt",
                                  color: "#666666",
                                  margin: "0 0 8px 0",
                                }}
                              >
                                [See sub-rule (3) of rule 25]
                              </p>
                              <h2
                                style={{
                                  fontSize: "14pt",
                                  fontWeight: "bold",
                                  textDecoration: "underline",
                                  margin: "0 0 8px 0",
                                }}
                              >
                                NOMINATION PAPER
                              </h2>
                              <p
                                style={{
                                  fontSize: "11pt",
                                  color: "#666666",
                                  margin: "0",
                                }}
                              >
                                Municipality Election 2026
                              </p>
                            </div>

                            <hr
                              style={{
                                border: "none",
                                borderTop: "1px solid #e0e0e0",
                                margin: "20px 0",
                              }}
                            />

                            {/* Candidate Details */}
                            <div style={{ marginBottom: "24px" }}>
                              <p style={{ margin: "12px 0" }}>
                                * I nominate as an applicant for election to the{" "}
                                <strong>
                                  {nomination.formData.municipality}
                                </strong>{" "}
                                Municipality from the{" "}
                                <strong>
                                  {nomination.formData.municipalWard}
                                </strong>{" "}
                                Municipal ward.
                              </p>

                              <p style={{ margin: "12px 0" }}>
                                Applicant&apos;s name:{" "}
                                <strong>
                                  {nomination.formData.candidateName}
                                </strong>
                              </p>

                              <p style={{ margin: "12px 0" }}>
                                Father&apos;s / Husband&apos;s name:{" "}
                                <strong>
                                  {nomination.formData.fatherOrHusbandName}
                                </strong>
                              </p>

                              <p style={{ margin: "12px 0" }}>
                                Full postal address:{" "}
                                <strong>
                                  {nomination.formData.fullPostalAddress}
                                </strong>
                              </p>

                              <p style={{ margin: "16px 0" }}>
                                Proposer name:{" "}
                                <strong>
                                  {nomination.formData.proposerName}
                                </strong>{" "}
                                at Serial No.{" "}
                                <strong>
                                  {nomination.formData.proposerSerialNo}
                                </strong>{" "}
                                in Part No.{" "}
                                <strong>
                                  {nomination.formData.proposerPartNo}
                                </strong>{" "}
                                of the electoral roll.
                              </p>

                              <p style={{ margin: "12px 0" }}>
                                Date of Birth:{" "}
                                <strong>
                                  {nomination.formData.dateOfBirth}
                                </strong>{" "}
                                | Age:{" "}
                                <strong>{nomination.formData.age}</strong> years
                              </p>

                              <p style={{ margin: "12px 0" }}>
                                Political Party:{" "}
                                <strong>
                                  {nomination.formData.politicalParty}
                                </strong>
                              </p>

                              <p style={{ margin: "12px 0" }}>
                                Symbol:{" "}
                                <strong>
                                  {nomination.formData.partySymbol}
                                </strong>
                              </p>

                              {nomination.formData.partySymbolImage && (
                                <div
                                  style={{
                                    margin: "12px 0",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                  }}
                                >
                                  <span>Symbol Image:</span>
                                  <img
                                    src={nomination.formData.partySymbolImage}
                                    alt="Party Symbol"
                                    style={{
                                      width: "60px",
                                      height: "60px",
                                      objectFit: "contain",
                                      border: "1px solid #ddd",
                                      borderRadius: "4px",
                                    }}
                                  />
                                </div>
                              )}

                              {nomination.formData.category !== "general" && (
                                <p style={{ margin: "12px 0" }}>
                                  Category:{" "}
                                  <strong>
                                    {getCategoryLabel(
                                      nomination.formData.category,
                                    )}
                                  </strong>{" "}
                                  - {nomination.formData.casteTribeName}
                                </p>
                              )}
                            </div>

                            <hr
                              style={{
                                border: "none",
                                borderTop: "1px solid #e0e0e0",
                                margin: "20px 0",
                              }}
                            />

                            {/* Application Details */}
                            <div
                              style={{
                                padding: "16px",
                                backgroundColor: "#f0fdf4",
                                borderRadius: "8px",
                                marginTop: "20px",
                              }}
                            >
                              <p style={{ margin: "8px 0" }}>
                                <strong>Application ID:</strong>{" "}
                                {nomination.applicationId}
                              </p>
                              <p style={{ margin: "8px 0" }}>
                                <strong>Candidate ID:</strong>{" "}
                                {nomination.candidateId}
                              </p>
                              <p style={{ margin: "8px 0" }}>
                                <strong>Submission #:</strong>{" "}
                                {nomination.submissionNumber} of 3
                              </p>
                              <p style={{ margin: "8px 0" }}>
                                <strong>Submitted:</strong>{" "}
                                {new Date(
                                  nomination.submittedAt,
                                ).toLocaleString()}
                              </p>
                              <p style={{ margin: "8px 0" }}>
                                <strong>Status:</strong> {nomination.status}
                              </p>
                              <p style={{ margin: "8px 0" }}>
                                <strong>Payment:</strong>{" "}
                                {nomination.paymentStatus}
                              </p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Download PDF Button */}
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-slate-800 hover:bg-slate-700"
                        onClick={() => generatePDF(nomination)}
                        disabled={isGeneratingPdf}
                      >
                        {isGeneratingPdf &&
                        selectedSubmission?.id === nomination.id ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3 mr-1" />
                        )}
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default Dashboard View
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
              <p className="text-2xl font-bold text-slate-800">
                {nominations.filter((n) => n.status === "submitted").length}
              </p>
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
              <p className="text-2xl font-bold text-slate-800">
                {uniqueCandidates}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total Candidates</p>
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
              <p className="text-xs text-slate-500 mt-1">Days Remaining</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nomination Submitted Card */}
      {totalSubmissions > 0 && (
        <Card className="bg-indigo-50 border-indigo-200 border shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-indigo-800">
                    Nominations Received
                  </h3>
                  <p className="text-sm text-indigo-600">
                    {totalSubmissions} nomination(s) from {uniqueCandidates}{" "}
                    candidate(s)
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                onClick={() =>
                  (window.location.href = "/dashboard?tab=nominations")
                }
              >
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
        {/* Recent Nominations / Pending Approvals */}
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-lg">
                  <ClipboardList className="h-4 w-4 text-amber-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Recent Nominations
                </CardTitle>
              </div>
              <Badge className="bg-amber-100 text-amber-700 text-xs">
                {nominations.filter((n) => n.status === "submitted").length}{" "}
                pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {nominations.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No nominations yet</p>
                <p className="text-xs text-slate-400">
                  Nominations will appear here when submitted
                </p>
              </div>
            ) : (
              <>
                {nominations.slice(0, 4).map((nomination) => (
                  <div
                    key={nomination.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {nomination.formData.candidateName || "Unknown"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {nomination.formData.municipalWard},{" "}
                          {nomination.formData.district}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(nomination.status)}
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-slate-800 hover:bg-slate-700"
                        onClick={() =>
                          (window.location.href = "/dashboard?tab=nominations")
                        }
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
                {nominations.length > 4 && (
                  <Button
                    variant="ghost"
                    className="w-full mt-2 text-slate-600"
                    onClick={() =>
                      (window.location.href = "/dashboard?tab=nominations")
                    }
                  >
                    View All ({nominations.length}) Nominations
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Important Dates & District Overview */}
        <div className="space-y-4">
          {/* Election Schedule */}
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
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {electionSchedule.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${
                      item.highlight
                        ? "bg-rose-100 border-2 border-rose-300"
                        : "bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-xs font-medium text-slate-500">
                        {item.slNo}
                      </span>
                      {item.highlight ? (
                        <Clock className="h-4 w-4 text-rose-600" />
                      ) : (
                        <CircleDot className="h-4 w-4 text-slate-400" />
                      )}
                      <span
                        className={`text-xs ${item.highlight ? "text-rose-800 font-semibold" : "text-slate-700"}`}
                      >
                        {item.event}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-md ${
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
              <div className="mt-3 p-3 rounded-xl bg-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">
                      Nomination Deadline
                    </p>
                    <p className="text-sm font-medium text-white mt-0.5">
                      March 8, 2026
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      {daysRemaining > 0 ? daysRemaining : 0}
                    </p>
                    <p className="text-xs text-slate-400">days left</p>
                  </div>
                </div>
              </div>
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

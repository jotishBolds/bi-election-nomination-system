"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  RefreshCw,
  FileText,
  AlertTriangle,
  Printer,
  Users,
  UserX,
  Trophy,
  ClipboardList,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ─────────────────────────────────────────────

interface ElectionInfo {
  id: string;
  name: string;
  year: number;
}

interface Form19Nomination {
  applicationNo: string;
  candidateName: string;
  fatherHusbandName: string;
  age: number;
  address: string;
  category: string;
  gender: string;
  districtName: string;
  ulbName: string;
  wardNo: number;
  wardName: string;
  partyName: string;
  submittedAt: string;
  candidateElectoralRollNo: string;
  proposers: Array<{
    proposerName: string;
    proposerElectoralRollNo: string;
  }>;
}

interface Form20Nomination {
  applicationNo: string;
  candidateName: string;
  fatherHusbandName: string;
  age: number;
  address: string;
  gender: string;
  category: string;
  districtName: string;
  ulbName: string;
  wardNo: number;
  wardName: string;
  candidateElectoralRollNo: string;
  submittedAt: string;
  partyName: string;
  status: string;
}

interface Form22Withdrawal {
  applicationNo: string;
  candidateName: string;
  fatherHusbandName: string;
  age: number;
  gender: string;
  category: string;
  address: string;
  districtName: string;
  ulbName: string;
  wardNo: number;
  wardName: string;
  candidateElectoralRollNo: string;
  partyName: string;
  withdrawnAt: string;
  withdrawalReason: string;
  approvedBy: string;
}

interface Form23Candidate {
  applicationNo: string;
  candidateName: string;
  fatherHusbandName: string;
  age: number;
  gender: string;
  category: string;
  address: string;
  districtName: string;
  ulbName: string;
  wardNo: number;
  wardName: string;
  partyName: string;
  allocatedSymbol: string | null;
  submittedAt: string;
}

interface WardGroup<T> {
  wardId: string;
  wardNo: number;
  wardName: string;
  ulbName: string;
  districtName: string;
  totalSubmissions?: number;
  totalValidNominations?: number;
  totalWithdrawals?: number;
  totalContestingCandidates?: number;
  nominations?: T[];
  withdrawals?: T[];
  candidates?: T[];
}

type FormType = "form-19" | "form-20" | "form-22" | "form-23";

// ─── Component ─────────────────────────────────────────

export function FormReportsPanel() {
  const [activeForm, setActiveForm] = useState<FormType>("form-19");
  const [electionId, setElectionId] = useState<string | null>(null);
  const [electionInfo, setElectionInfo] = useState<ElectionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wardFilter, setWardFilter] = useState<string>("all");
  const [dayFilter, setDayFilter] = useState<string>("all");
  const [wards, setWards] = useState<
    Array<{ id: string; wardNo: number; wardName: string }>
  >([]);

  // Data states for each form type
  const [formData, setFormData] = useState<any>(null);

  // Fetch active election
  useEffect(() => {
    const fetchElection = async () => {
      try {
        const response = await fetch("/api/election-config");
        const result = await response.json();
        if (result.success && result.config) {
          setElectionId(result.config.id);
          setElectionInfo({
            id: result.config.id,
            name: result.config.name,
            year: result.config.year,
          });
        } else {
          setError("No active election configuration found");
          setIsLoading(false);
        }
      } catch {
        setError("Failed to load election configuration");
        setIsLoading(false);
      }
    };
    fetchElection();
  }, []);

  // Fetch wards
  useEffect(() => {
    const fetchWards = async () => {
      try {
        const response = await fetch("/api/ro/wards");
        const result = await response.json();
        if (result.success) {
          setWards(result.data);
        }
      } catch {
        console.error("Failed to fetch wards");
      }
    };
    fetchWards();
  }, []);

  // Fetch form data
  const fetchFormData = useCallback(async () => {
    if (!electionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ electionId });

      if (wardFilter && wardFilter !== "all") {
        params.append("wardId", wardFilter);
      }

      if (
        dayFilter &&
        dayFilter !== "all" &&
        (activeForm === "form-19" || activeForm === "form-22")
      ) {
        params.append("day", dayFilter);
      }

      const response = await fetch(`/api/ro/reports/${activeForm}?${params}`);
      const result = await response.json();

      if (result.success) {
        setFormData(result.data);
      } else {
        setError(result.error || "Failed to fetch report data");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, [electionId, activeForm, wardFilter, dayFilter]);

  useEffect(() => {
    if (electionId) {
      fetchFormData();
    }
  }, [fetchFormData, electionId]);

  // Reset filters when switching forms
  useEffect(() => {
    setDayFilter("all");
  }, [activeForm]);

  // ─── Helpers ─────────────────────────────────────────

  const getAllRecords = (): any[] => {
    if (!formData) return [];

    // Single ward mode (flat array)
    if (formData.nominations) return formData.nominations;
    if (formData.withdrawals) return formData.withdrawals;
    if (formData.candidates) return formData.candidates;

    // Multi-ward mode (grouped)
    if (formData.wards) {
      return formData.wards.flatMap(
        (w: WardGroup<any>) =>
          w.nominations || w.withdrawals || w.candidates || [],
      );
    }

    return [];
  };

  const getTotalCount = (): number => {
    if (!formData) return 0;
    return (
      formData.totalSubmissions ??
      formData.totalValidNominations ??
      formData.totalWithdrawals ??
      formData.totalContestingCandidates ??
      0
    );
  };

  const getWardGroups = (): WardGroup<any>[] => {
    if (!formData?.wards) return [];
    return formData.wards;
  };

  // ─── Export ─────────────────────────────────────────

  const handleExportCSV = () => {
    const records = getAllRecords();
    if (records.length === 0) return;

    let headers: string[];
    let rows: string[][];

    switch (activeForm) {
      case "form-19":
        headers = [
          "Sr.No",
          "Application No",
          "Candidate Name",
          "Father/Husband Name",
          // "Age", // Age not collected currently
          "Gender",
          "Category",
          "Address",
          "Ward No",
          "Ward Name",
          "Party",
          "Electoral Roll No",
          "Submitted At",
          "Proposers",
        ];
        rows = records.map((r: Form19Nomination, i: number) => [
          String(i + 1),
          r.applicationNo,
          r.candidateName,
          r.fatherHusbandName,
          // String(r.age), // Age not collected currently
          r.gender,
          r.category,
          `"${r.address}"`,
          String(r.wardNo),
          r.wardName,
          r.partyName,
          r.candidateElectoralRollNo,
          new Date(r.submittedAt).toLocaleString(),
          r.proposers
            ?.map((p) => `${p.proposerName} (${p.proposerElectoralRollNo})`)
            .join("; ") || "",
        ]);
        break;
      case "form-20":
        headers = [
          "Sr.No",
          "Application No",
          "Candidate Name",
          "Father/Husband Name",
          // "Age", // Age not collected currently
          "Gender",
          "Category",
          "Ward No",
          "Ward Name",
          "Party",
          "Electoral Roll No",
          "Status",
        ];
        rows = records.map((r: Form20Nomination, i: number) => [
          String(i + 1),
          r.applicationNo,
          r.candidateName,
          r.fatherHusbandName,
          // String(r.age), // Age not collected currently
          r.gender,
          r.category,
          String(r.wardNo),
          r.wardName,
          r.partyName,
          r.candidateElectoralRollNo,
          r.status,
        ]);
        break;
      case "form-22":
        headers = [
          "Sr.No",
          "Application No",
          "Candidate Name",
          "Father/Husband Name",
          // "Age", // Age not collected currently
          "Gender",
          "Category",
          "Ward No",
          "Ward Name",
          "Party",
          "Withdrawn At",
          "Reason",
          "Approved By",
        ];
        rows = records.map((r: Form22Withdrawal, i: number) => [
          String(i + 1),
          r.applicationNo,
          r.candidateName,
          r.fatherHusbandName,
          // String(r.age), // Age not collected currently
          r.gender,
          r.category,
          String(r.wardNo),
          r.wardName,
          r.partyName,
          r.withdrawnAt ? new Date(r.withdrawnAt).toLocaleString() : "",
          `"${r.withdrawalReason || ""}"`,
          r.approvedBy || "",
        ]);
        break;
      case "form-23":
        headers = [
          "Sr.No",
          "Application No",
          "Candidate Name",
          "Father/Husband Name",
          // "Age", // Age not collected currently
          "Gender",
          "Category",
          "Ward No",
          "Ward Name",
          "Party",
          "Allocated Symbol",
        ];
        rows = records.map((r: Form23Candidate, i: number) => [
          String(i + 1),
          r.applicationNo,
          r.candidateName,
          r.fatherHusbandName,
          // String(r.age), // Age not collected currently
          r.gender,
          r.category,
          String(r.wardNo),
          r.wardName,
          r.partyName,
          r.allocatedSymbol || "Not Assigned",
        ]);
        break;
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeForm}-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // ─── Form Labels ────────────────────────────────────

  const FORM_CONFIG: Record<
    FormType,
    { label: string; description: string; icon: React.ReactNode }
  > = {
    "form-19": {
      label: "Form 19",
      description: "Nominations Received",
      icon: <ClipboardList className="h-4 w-4" />,
    },
    "form-20": {
      label: "Form 20",
      description: "Valid Nominations (Accepted)",
      icon: <Users className="h-4 w-4" />,
    },
    "form-22": {
      label: "Form 22",
      description: "Withdrawn Nominations",
      icon: <UserX className="h-4 w-4" />,
    },
    "form-23": {
      label: "Form 23",
      description: "Contesting Candidates",
      icon: <Trophy className="h-4 w-4" />,
    },
  };

  // ─── Render Table ───────────────────────────────────

  const renderForm19Table = (records: Form19Nomination[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[60px]">Sr.No</TableHead>
          <TableHead>Candidate Name</TableHead>
          <TableHead>Father/Husband</TableHead>
          {/* <TableHead>Age</TableHead> */}
          {/* Age not collected currently */}
          <TableHead>Gender</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Ward</TableHead>
          <TableHead>Party</TableHead>
          <TableHead>Electoral Roll No</TableHead>
          <TableHead>Submitted At</TableHead>
          <TableHead>Proposers</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.length === 0 ? (
          <TableRow>
            <TableCell colSpan={10} className="text-center py-8 text-slate-500">
              No nominations found
            </TableCell>
          </TableRow>
        ) : (
          records.map((r, idx) => (
            <TableRow key={r.applicationNo + idx}>
              <TableCell>{idx + 1}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-slate-800">
                    {r.candidateName}
                  </p>
                  <p className="text-xs text-slate-400">{r.applicationNo}</p>
                </div>
              </TableCell>
              <TableCell>{r.fatherHusbandName}</TableCell>
              {/* <TableCell>{r.age}</TableCell> */}
              {/* Age not collected currently */}
              <TableCell>
                <Badge variant="outline">{r.gender}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{r.category}</Badge>
              </TableCell>
              <TableCell>
                <p className="text-sm">Ward {r.wardNo}</p>
                <p className="text-xs text-slate-400">{r.wardName}</p>
              </TableCell>
              <TableCell>{r.partyName}</TableCell>
              <TableCell className="text-sm">
                {r.candidateElectoralRollNo}
              </TableCell>
              <TableCell className="text-sm">
                {new Date(r.submittedAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {r.proposers?.map((p, pi) => (
                  <div key={pi} className="text-xs">
                    {p.proposerName} ({p.proposerElectoralRollNo})
                  </div>
                ))}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  const renderForm20Table = (records: Form20Nomination[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[60px]">Sr.No</TableHead>
          <TableHead>Candidate Name</TableHead>
          <TableHead>Father/Husband</TableHead>
          {/* <TableHead>Age</TableHead> */}
          {/* Age not collected currently */}
          <TableHead>Gender</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Ward</TableHead>
          <TableHead>Party</TableHead>
          <TableHead>Electoral Roll No</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-slate-500">
              No valid nominations found
            </TableCell>
          </TableRow>
        ) : (
          records.map((r, idx) => (
            <TableRow key={r.applicationNo + idx}>
              <TableCell>{idx + 1}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-slate-800">
                    {r.candidateName}
                  </p>
                  <p className="text-xs text-slate-400">{r.applicationNo}</p>
                </div>
              </TableCell>
              <TableCell>{r.fatherHusbandName}</TableCell>
              {/* <TableCell>{r.age}</TableCell> */}
              {/* Age not collected currently */}
              <TableCell>
                <Badge variant="outline">{r.gender}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{r.category}</Badge>
              </TableCell>
              <TableCell>
                <p className="text-sm">Ward {r.wardNo}</p>
                <p className="text-xs text-slate-400">{r.wardName}</p>
              </TableCell>
              <TableCell>{r.partyName}</TableCell>
              <TableCell className="text-sm">
                {r.candidateElectoralRollNo}
              </TableCell>
              <TableCell>
                <Badge className="bg-green-100 text-green-700">
                  {r.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  const renderForm22Table = (records: Form22Withdrawal[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[60px]">Sr.No</TableHead>
          <TableHead>Candidate Name</TableHead>
          <TableHead>Father/Husband</TableHead>
          {/* <TableHead>Age</TableHead> */}
          {/* Age not collected currently */}
          <TableHead>Gender</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Ward</TableHead>
          <TableHead>Party</TableHead>
          <TableHead>Withdrawn At</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Approved By</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.length === 0 ? (
          <TableRow>
            <TableCell colSpan={10} className="text-center py-8 text-slate-500">
              No withdrawals found
            </TableCell>
          </TableRow>
        ) : (
          records.map((r, idx) => (
            <TableRow key={r.applicationNo + idx}>
              <TableCell>{idx + 1}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-slate-800">
                    {r.candidateName}
                  </p>
                  <p className="text-xs text-slate-400">{r.applicationNo}</p>
                </div>
              </TableCell>
              <TableCell>{r.fatherHusbandName}</TableCell>
              {/* <TableCell>{r.age}</TableCell> */}
              {/* Age not collected currently */}
              <TableCell>
                <Badge variant="outline">{r.gender}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{r.category}</Badge>
              </TableCell>
              <TableCell>
                <p className="text-sm">Ward {r.wardNo}</p>
                <p className="text-xs text-slate-400">{r.wardName}</p>
              </TableCell>
              <TableCell>{r.partyName}</TableCell>
              <TableCell className="text-sm">
                {r.withdrawnAt
                  ? new Date(r.withdrawnAt).toLocaleDateString()
                  : "—"}
              </TableCell>
              <TableCell className="text-sm max-w-[200px] truncate">
                {r.withdrawalReason || "—"}
              </TableCell>
              <TableCell className="text-sm">{r.approvedBy || "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  const renderForm23Table = (records: Form23Candidate[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[60px]">Sr.No</TableHead>
          <TableHead>Candidate Name</TableHead>
          <TableHead>Father/Husband</TableHead>
          {/* <TableHead>Age</TableHead> */}
          {/* Age not collected currently */}
          <TableHead>Gender</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Ward</TableHead>
          <TableHead>Party</TableHead>
          <TableHead>Allocated Symbol</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-slate-500">
              No contesting candidates found
            </TableCell>
          </TableRow>
        ) : (
          records.map((r, idx) => (
            <TableRow key={r.applicationNo + idx}>
              <TableCell>{idx + 1}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-slate-800">
                    {r.candidateName}
                  </p>
                  <p className="text-xs text-slate-400">{r.applicationNo}</p>
                </div>
              </TableCell>
              <TableCell>{r.fatherHusbandName}</TableCell>
              {/* <TableCell>{r.age}</TableCell> */}
              {/* Age not collected currently */}
              <TableCell>
                <Badge variant="outline">{r.gender}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{r.category}</Badge>
              </TableCell>
              <TableCell>
                <p className="text-sm">Ward {r.wardNo}</p>
                <p className="text-xs text-slate-400">{r.wardName}</p>
              </TableCell>
              <TableCell>{r.partyName}</TableCell>
              <TableCell>
                {r.allocatedSymbol ? (
                  <Badge className="bg-purple-100 text-purple-700">
                    {r.allocatedSymbol}
                  </Badge>
                ) : (
                  <span className="text-sm text-slate-400">Not Assigned</span>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  const renderTable = () => {
    const records = getAllRecords();
    switch (activeForm) {
      case "form-19":
        return renderForm19Table(records);
      case "form-20":
        return renderForm20Table(records);
      case "form-22":
        return renderForm22Table(records);
      case "form-23":
        return renderForm23Table(records);
    }
  };

  // ─── Render Ward Groups ─────────────────────────────

  const renderWardGroups = () => {
    const wardGroups = getWardGroups();
    if (wardGroups.length === 0) return null;

    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">
            Ward-wise Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {wardGroups.map((w) => (
              <div
                key={w.wardId}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg"
              >
                <span className="text-sm font-medium text-slate-600">
                  Ward {w.wardNo} - {w.wardName}
                </span>
                <Badge variant="secondary">
                  {w.totalSubmissions ??
                    w.totalValidNominations ??
                    w.totalWithdrawals ??
                    w.totalContestingCandidates ??
                    0}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ─── Loading State ──────────────────────────────────

  if (isLoading && !formData) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Election Form Reports
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {electionInfo
              ? `${electionInfo.name} (${electionInfo.year})`
              : "Generate and download official election forms"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button
            onClick={handleExportCSV}
            disabled={getAllRecords().length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Form Tabs */}
      <Tabs
        value={activeForm}
        onValueChange={(v) => setActiveForm(v as FormType)}
      >
        <TabsList className="grid w-full grid-cols-4">
          {(Object.keys(FORM_CONFIG) as FormType[]).map((key) => (
            <TabsTrigger key={key} value={key} className="gap-2">
              {FORM_CONFIG[key].icon}
              <span className="hidden sm:inline">{FORM_CONFIG[key].label}</span>
              <span className="sm:hidden">{key.replace("form-", "F")}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Form Description */}
        <div className="mt-4">
          <p className="text-sm text-slate-600">
            <span className="font-medium">{FORM_CONFIG[activeForm].label}</span>{" "}
            — {FORM_CONFIG[activeForm].description}
          </p>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm mt-4">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <Select value={wardFilter} onValueChange={setWardFilter}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="All Wards" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wards</SelectItem>
                  {wards.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      Ward {w.wardNo} - {w.wardName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(activeForm === "form-19" || activeForm === "form-22") && (
                <Select value={dayFilter} onValueChange={setDayFilter}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Report Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Cumulative</SelectItem>
                    <SelectItem value="1">Day 1</SelectItem>
                    <SelectItem value="2">Day 2</SelectItem>
                    <SelectItem value="3">Day 3</SelectItem>
                    <SelectItem value="4">Day 4</SelectItem>
                    <SelectItem value="5">Day 5</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Badge variant="outline" className="ml-auto text-slate-600">
                {formData?.reportType === "DAY_WISE"
                  ? "Day-wise Report"
                  : "Cumulative Report"}
              </Badge>

              <Button
                variant="outline"
                size="icon"
                onClick={fetchFormData}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Card className="bg-blue-50 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {getTotalCount()}
                  </p>
                  <p className="text-xs text-slate-500">Total Records</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {getWardGroups().length || (wardFilter !== "all" ? 1 : 0)}
                  </p>
                  <p className="text-xs text-slate-500">Wards Covered</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  {FORM_CONFIG[activeForm].icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {FORM_CONFIG[activeForm].label}
                  </p>
                  <p className="text-xs text-slate-500">
                    {FORM_CONFIG[activeForm].description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ward Groups Summary (multi-ward mode) */}
        {wardFilter === "all" && renderWardGroups()}

        {/* Data Table */}
        <TabsContent value={activeForm} className="mt-4">
          <Card className="border-0 shadow-sm" id="printable-form-table">
            <CardContent className="p-0">
              {error ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <AlertTriangle className="h-12 w-12 text-amber-500" />
                  <p className="text-slate-600">{error}</p>
                  <Button onClick={fetchFormData} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">{renderTable()}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

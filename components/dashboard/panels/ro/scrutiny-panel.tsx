"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Search,
  RefreshCw,
  Eye,
  FileText,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ClipboardCheck,
  FileCheck,
  FileX,
  Phone,
  Send,
  Star,
  ImageIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SymbolPreference {
  preferenceOrder: number;
  symbol: {
    id: string;
    name: string;
    imagePath?: string;
  };
}

interface Nomination {
  id: string;
  applicationNo: string;
  candidateName: string;
  status: string;
  submittedAt: string;
  applicantProfile?: {
    user: {
      id: string;
      name: string;
      phone: string;
      email?: string;
    };
  };
  ward: {
    id: string;
    wardNo: number;
    wardName: string;
    reservationType?: string;
    ulb?: {
      id: string;
      name: string;
    };
  };
  politicalParty?: {
    name: string;
    shortName: string;
    abbreviation?: string;
  };
  documents?: Array<{
    id: string;
    type: string;
    fileName: string;
    originalName?: string;
    storagePath?: string;
  }>;
  symbolPreferences?: SymbolPreference[];
  allocatedSymbol?: {
    id: string;
    name: string;
    imagePath?: string;
  };
}

interface AvailableSymbol {
  id: string;
  name: string;
  imagePath?: string;
  isReserved: boolean;
  isActive?: boolean;
  isAllocated?: boolean;
}

export function ScrutinyPanel() {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [wardFilter, setWardFilter] = useState<string>("all");
  const [selectedNomination, setSelectedNomination] =
    useState<Nomination | null>(null);
  const [isScrutinyDialogOpen, setIsScrutinyDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wards, setWards] = useState<
    Array<{ id: string; wardNo: number; wardName: string }>
  >([]);

  // Decision state - simple accept or reject
  const [decision, setDecision] = useState<"ACCEPTED" | "REJECTED" | "">("");

  // Symbol allocation state
  const [availableSymbols, setAvailableSymbols] = useState<AvailableSymbol[]>(
    [],
  );
  const [selectedSymbolId, setSelectedSymbolId] = useState<string>("");
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(false);

  // OTP flow state
  const [otpStep, setOtpStep] = useState<"decision" | "otp">("decision");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

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

  const fetchNominations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("status", "RECEIVED,UNDER_SCRUTINY");
      if (wardFilter && wardFilter !== "all") {
        params.append("wardId", wardFilter);
      }

      const response = await fetch(`/api/ro/applications?${params}`);
      const result = await response.json();

      if (result.success) {
        setNominations(result.data);
      } else {
        setError(result.error || "Failed to fetch applications");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, [wardFilter]);

  useEffect(() => {
    fetchWards();
  }, []);

  useEffect(() => {
    fetchNominations();
  }, [fetchNominations]);

  // Fetch available symbols for a ward
  const fetchAvailableSymbols = async (wardId: string) => {
    setIsLoadingSymbols(true);
    try {
      // Fetch all election symbols
      const response = await fetch("/api/admin/symbols");
      const result = await response.json();
      if (result.success) {
        // Fetch already allocated symbols for this ward
        const allocResponse = await fetch(
          `/api/ro/symbol-allocation?wardId=${wardId}`,
        );
        const allocResult = await allocResponse.json();
        const allocatedSymbolIds = new Set<string>();
        if (allocResult.success && allocResult.data) {
          allocResult.data.forEach((a: { symbolId: string }) => {
            allocatedSymbolIds.add(a.symbolId);
          });
        }

        const symbols = (result.data || result.symbols || []).map(
          (s: AvailableSymbol) => ({
            ...s,
            isAllocated: allocatedSymbolIds.has(s.id),
          }),
        );
        setAvailableSymbols(symbols);
      }
    } catch {
      console.error("Failed to fetch symbols");
    } finally {
      setIsLoadingSymbols(false);
    }
  };

  const handleStartScrutiny = async (nomination: Nomination) => {
    setSelectedNomination(nomination);
    setDecision("");
    setSelectedSymbolId(nomination.allocatedSymbol?.id || "");
    setOtpStep("decision");
    setOtp("");
    setOtpError("");
    setOtpSent(false);

    // Fetch available symbols for this ward
    if (nomination.ward?.id) {
      fetchAvailableSymbols(nomination.ward.id);
    }

    // Mark as under scrutiny if status is RECEIVED
    if (nomination.status === "RECEIVED") {
      try {
        await fetch(`/api/ro/applications/${nomination.id}/scrutiny`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "START" }),
        });
        // Update local state
        setNominations((prev) =>
          prev.map((n) =>
            n.id === nomination.id ? { ...n, status: "UNDER_SCRUTINY" } : n,
          ),
        );
      } catch {
        console.error("Failed to start scrutiny");
      }
    }

    setIsScrutinyDialogOpen(true);
  };

  // Send OTP for scrutiny authorization
  const handleSendOtp = async () => {
    if (!selectedNomination) return;
    setIsSendingOtp(true);
    setOtpError("");
    try {
      const response = await fetch(
        `/api/ro/applications/${selectedNomination.id}/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "SCRUTINY" }),
        },
      );
      const result = await response.json();
      if (result.success) {
        setOtpSent(true);
        setOtpStep("otp");
      } else {
        setOtpError(result.error || "Failed to send OTP");
      }
    } catch {
      setOtpError("Failed to send OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Submit scrutiny decision with OTP using the COMPLETE action
  const handleSubmitScrutiny = async () => {
    if (!selectedNomination || !decision) return;
    if (otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsSubmitting(true);
    setOtpError("");
    try {
      // Call the scrutiny API with COMPLETE action
      const response = await fetch(
        `/api/ro/applications/${selectedNomination.id}/scrutiny`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "COMPLETE",
            decision,
            otp,
          }),
        },
      );

      const result = await response.json();
      if (result.success) {
        // If accepted and symbol selected, allocate the symbol
        if (decision === "ACCEPTED" && selectedSymbolId) {
          try {
            await fetch("/api/ro/symbol-allocation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nominationId: selectedNomination.id,
                symbolId: selectedSymbolId,
                wardId: selectedNomination.ward.id,
              }),
            });
          } catch {
            console.error("Symbol allocation failed, but scrutiny succeeded");
          }
        }
        setIsScrutinyDialogOpen(false);
        fetchNominations();
      } else {
        setOtpError(result.error || "Failed to submit scrutiny");
      }
    } catch {
      setOtpError("Failed to submit scrutiny");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredNominations = nominations.filter(
    (n) =>
      n.applicationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.candidateName || n.applicantProfile?.user?.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  if (isLoading && nominations.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Scrutiny</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Review and verify nomination applications
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {nominations.filter((n) => n.status === "RECEIVED").length}
                </p>
                <p className="text-xs text-slate-500">Pending Scrutiny</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Eye className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {
                    nominations.filter((n) => n.status === "UNDER_SCRUTINY")
                      .length
                  }
                </p>
                <p className="text-xs text-slate-500">Under Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {nominations.length}
                </p>
                <p className="text-xs text-slate-500">Total Queue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={wardFilter} onValueChange={setWardFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Wards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Wards</SelectItem>
                {wards.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    Ward {w.wardNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchNominations}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <AlertTriangle className="h-12 w-12 text-amber-500" />
              <p className="text-slate-600">{error}</p>
              <Button onClick={fetchNominations} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Ward</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-[120px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNominations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-slate-500"
                    >
                      No applications pending scrutiny
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNominations.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell>
                        <span className="font-mono text-sm font-medium">
                          {n.applicationNo}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">
                              {n.candidateName ||
                                n.applicantProfile?.user?.name ||
                                "N/A"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {n.politicalParty?.shortName ||
                                n.politicalParty?.abbreviation ||
                                "Independent"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          Ward {n.ward?.wardNo || "N/A"}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {n.ward?.reservationType || "General"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            n.status === "UNDER_SCRUTINY"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                          }
                        >
                          {n.status === "UNDER_SCRUTINY"
                            ? "In Progress"
                            : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {new Date(n.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleStartScrutiny(n)}
                        >
                          <ClipboardCheck className="h-4 w-4 mr-1" />
                          {n.status === "UNDER_SCRUTINY" ? "Continue" : "Start"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Scrutiny Dialog */}
      <Dialog
        open={isScrutinyDialogOpen}
        onOpenChange={setIsScrutinyDialogOpen}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scrutiny Review</DialogTitle>
            <DialogDescription>
              Application: {selectedNomination?.applicationNo} |{" "}
              {selectedNomination?.candidateName ||
                selectedNomination?.applicantProfile?.user?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedNomination && otpStep === "decision" && (
            <Tabs defaultValue="decision" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="decision">Decision</TabsTrigger>
                <TabsTrigger value="symbols">Symbol Allocation</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              {/* Decision Tab - Accept or Reject */}
              <TabsContent value="decision" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div>
                    <Label className="text-base font-medium">
                      Scrutiny Decision
                    </Label>
                    <p className="text-sm text-slate-500 mt-1">
                      Select Accept or Reject for this nomination application
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <Button
                        variant={
                          decision === "ACCEPTED" ? "default" : "outline"
                        }
                        className={`h-20 text-lg ${
                          decision === "ACCEPTED"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "hover:bg-green-50 hover:border-green-300"
                        }`}
                        onClick={() => setDecision("ACCEPTED")}
                      >
                        <FileCheck className="h-6 w-6 mr-3" />
                        Accept
                      </Button>
                      <Button
                        variant={
                          decision === "REJECTED" ? "default" : "outline"
                        }
                        className={`h-20 text-lg ${
                          decision === "REJECTED"
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "hover:bg-red-50 hover:border-red-300"
                        }`}
                        onClick={() => setDecision("REJECTED")}
                      >
                        <FileX className="h-6 w-6 mr-3" />
                        Reject
                      </Button>
                    </div>
                  </div>

                  {decision && (
                    <div className="p-3 rounded-lg border mt-2">
                      <div className="flex items-center gap-2">
                        {decision === "ACCEPTED" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-medium">
                          Decision:{" "}
                          {decision === "ACCEPTED" ? "Accepted" : "Rejected"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {decision === "ACCEPTED"
                          ? "The nomination will be approved. You can allocate a symbol in the Symbol Allocation tab."
                          : "The nomination will be rejected."}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Symbol Allocation Tab */}
              <TabsContent value="symbols" className="space-y-4 mt-4">
                {/* Candidate's preferred symbols */}
                {selectedNomination.symbolPreferences &&
                  selectedNomination.symbolPreferences.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-slate-700">
                        Candidate&apos;s Preferred Symbols
                      </Label>
                      <div className="grid grid-cols-3 gap-3 mt-2">
                        {selectedNomination.symbolPreferences
                          .sort((a, b) => a.preferenceOrder - b.preferenceOrder)
                          .map((pref) => (
                            <div
                              key={pref.symbol.id}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedSymbolId === pref.symbol.id
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                              onClick={() =>
                                setSelectedSymbolId(pref.symbol.id)
                              }
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Star className="h-4 w-4 text-amber-500" />
                                <span className="text-xs text-slate-500">
                                  Preference {pref.preferenceOrder}
                                </span>
                              </div>
                              {pref.symbol.imagePath ? (
                                <img
                                  src={pref.symbol.imagePath}
                                  alt={pref.symbol.name}
                                  className="w-12 h-12 object-contain mx-auto"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center mx-auto">
                                  <ImageIcon className="h-6 w-6 text-slate-400" />
                                </div>
                              )}
                              <p className="text-sm font-medium text-center mt-2">
                                {pref.symbol.name}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                {/* All available symbols */}
                <div>
                  <Label className="text-sm font-medium text-slate-700">
                    All Available Symbols
                  </Label>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select a symbol to allocate to this candidate. Already
                    allocated symbols in this ward are marked.
                  </p>
                  {isLoadingSymbols ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3 mt-3 max-h-[300px] overflow-y-auto">
                      {availableSymbols
                        .filter((s) => s.isActive !== false)
                        .map((symbol) => (
                          <div
                            key={symbol.id}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              symbol.isAllocated
                                ? "border-red-200 bg-red-50 opacity-50 cursor-not-allowed"
                                : selectedSymbolId === symbol.id
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-slate-200 hover:border-slate-300"
                            }`}
                            onClick={() => {
                              if (!symbol.isAllocated) {
                                setSelectedSymbolId(symbol.id);
                              }
                            }}
                          >
                            {symbol.imagePath ? (
                              <img
                                src={symbol.imagePath}
                                alt={symbol.name}
                                className="w-10 h-10 object-contain mx-auto"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center mx-auto">
                                <ImageIcon className="h-5 w-5 text-slate-400" />
                              </div>
                            )}
                            <p className="text-xs font-medium text-center mt-2 truncate">
                              {symbol.name}
                            </p>
                            {symbol.isReserved && (
                              <Badge
                                variant="outline"
                                className="text-[10px] mt-1 mx-auto block w-fit"
                              >
                                Reserved
                              </Badge>
                            )}
                            {symbol.isAllocated && (
                              <Badge className="text-[10px] mt-1 mx-auto block w-fit bg-red-100 text-red-600">
                                Taken
                              </Badge>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {selectedSymbolId && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Selected Symbol:{" "}
                        {availableSymbols.find((s) => s.id === selectedSymbolId)
                          ?.name ||
                          selectedNomination.symbolPreferences?.find(
                            (p) => p.symbol.id === selectedSymbolId,
                          )?.symbol.name ||
                          "Selected"}
                      </p>
                      <p className="text-xs text-blue-600">
                        This symbol will be allocated upon acceptance
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-4 mt-4">
                {selectedNomination.documents &&
                selectedNomination.documents.length > 0 ? (
                  <div className="grid gap-3">
                    {selectedNomination.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-800">
                              {doc.type.replace(/_/g, " ")}
                            </p>
                            <p className="text-sm text-slate-400">
                              {doc.originalName || doc.fileName}
                            </p>
                          </div>
                        </div>
                        {doc.storagePath ? (
                          <a
                            href={doc.storagePath}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </a>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            <Eye className="h-4 w-4 mr-1" />
                            No File
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    No documents attached
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* OTP Step */}
          {selectedNomination && otpStep === "otp" && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Phone className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-700">
                  An OTP has been sent to your registered phone number. Enter it
                  below to confirm your{" "}
                  {decision === "ACCEPTED" ? "approval" : "rejection"} decision.
                </p>
              </div>
              <div className="flex flex-col items-center gap-4">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                {otpError && <p className="text-sm text-red-600">{otpError}</p>}
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                >
                  {isSendingOtp ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Resend OTP
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                if (otpStep === "otp") {
                  setOtpStep("decision");
                  setOtp("");
                  setOtpError("");
                } else {
                  setIsScrutinyDialogOpen(false);
                }
              }}
            >
              {otpStep === "otp" ? "Back" : "Close"}
            </Button>
            {otpStep === "decision" ? (
              <Button
                onClick={handleSendOtp}
                disabled={isSendingOtp || !decision}
              >
                {isSendingOtp ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send OTP & Submit
              </Button>
            ) : (
              <Button
                onClick={handleSubmitScrutiny}
                disabled={isSubmitting || otp.length !== 6}
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {decision === "ACCEPTED" ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Approval
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Confirm Rejection
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

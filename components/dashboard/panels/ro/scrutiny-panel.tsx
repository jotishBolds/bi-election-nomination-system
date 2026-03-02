"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
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
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
  checklistResponses?: Array<{
    id: string;
    itemId: string;
    isFulfilled: boolean;
    notes?: string;
  }>;
}

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  displayOrder: number;
  isRequired: boolean;
}

interface ChecklistState {
  [itemId: string]: { checked: boolean; notes: string };
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

  // Dynamic checklist from election config
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [checklist, setChecklist] = useState<ChecklistState>({});
  const [remarks, setRemarks] = useState("");
  const [decision, setDecision] = useState<"ACCEPTED" | "REJECTED" | "">("");

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

  // Fetch dynamic checklist items from election config
  const fetchChecklistItems = useCallback(async () => {
    try {
      // Get active election config and its checklist items
      const response = await fetch("/api/election-config");
      const result = await response.json();
      if (result.success && result.data?.id) {
        const checklistResponse = await fetch(
          `/api/admin/elections/${result.data.id}/checklist-items`,
        );
        const checklistResult = await checklistResponse.json();
        if (checklistResult.success && checklistResult.data) {
          setChecklistItems(checklistResult.data);
        }
      }
    } catch {
      console.error("Failed to fetch checklist items");
    }
  }, []);

  useEffect(() => {
    fetchChecklistItems();
  }, [fetchChecklistItems]);

  const handleStartScrutiny = async (nomination: Nomination) => {
    setSelectedNomination(nomination);
    // Initialize checklist state from dynamic items
    const initialChecklist: ChecklistState = {};
    checklistItems.forEach((item) => {
      // Pre-fill from existing responses if any
      const existingResponse = nomination.checklistResponses?.find(
        (r) => r.itemId === item.id,
      );
      initialChecklist[item.id] = {
        checked: existingResponse?.isFulfilled || false,
        notes: existingResponse?.notes || "",
      };
    });
    setChecklist(initialChecklist);
    setRemarks("");
    setDecision("");
    setOtpStep("decision");
    setOtp("");
    setOtpError("");
    setOtpSent(false);

    // Mark as under scrutiny
    if (nomination.status === "RECEIVED") {
      try {
        await fetch(`/api/ro/applications/${nomination.id}/scrutiny`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "START" }),
        });
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

  // Submit scrutiny decision with OTP
  const handleSubmitScrutiny = async () => {
    if (!selectedNomination || !decision) return;
    if (otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsSubmitting(true);
    setOtpError("");
    try {
      const response = await fetch(
        `/api/ro/applications/${selectedNomination.id}/scrutiny`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision,
            remarks,
            rejectionReasons: decision === "REJECTED" ? remarks : undefined,
            otp,
          }),
        },
      );

      const result = await response.json();
      if (result.success) {
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

  const allChecked =
    checklistItems.length > 0
      ? checklistItems
          .filter((item) => item.isRequired)
          .every((item) => checklist[item.id]?.checked)
      : true;

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
            <Tabs defaultValue="checklist" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="checklist">Checklist</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="decision">Decision</TabsTrigger>
              </TabsList>

              <TabsContent value="checklist" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  {checklistItems.length > 0 ? (
                    checklistItems
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                        >
                          <Checkbox
                            checked={checklist[item.id]?.checked || false}
                            onCheckedChange={(checked) =>
                              setChecklist({
                                ...checklist,
                                [item.id]: {
                                  ...checklist[item.id],
                                  checked: !!checked,
                                },
                              })
                            }
                          />
                          <div className="flex-1">
                            <Label className="flex items-center gap-2">
                              {item.title}
                              {item.isRequired && (
                                <span className="text-red-500 text-xs">*</span>
                              )}
                            </Label>
                            {item.description && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                          {item.category && (
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                          )}
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-4 text-slate-400 text-sm">
                      No checklist items configured. Contact admin to set up
                      election checklist.
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    {Object.values(checklist).filter((c) => c.checked).length}/
                    {checklistItems.length} items verified
                  </span>
                  {allChecked && checklistItems.length > 0 && (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      All Required Verified
                    </Badge>
                  )}
                </div>
              </TabsContent>

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

              <TabsContent value="decision" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div>
                    <Label>Scrutiny Decision *</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <Button
                        variant={
                          decision === "ACCEPTED" ? "default" : "outline"
                        }
                        className={
                          decision === "ACCEPTED"
                            ? "bg-green-600 hover:bg-green-700"
                            : ""
                        }
                        onClick={() => setDecision("ACCEPTED")}
                      >
                        <FileCheck className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant={
                          decision === "REJECTED" ? "default" : "outline"
                        }
                        className={
                          decision === "REJECTED"
                            ? "bg-red-600 hover:bg-red-700"
                            : ""
                        }
                        onClick={() => setDecision("REJECTED")}
                      >
                        <FileX className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>
                      Remarks / Reason {decision === "REJECTED" && "*"}
                    </Label>
                    <Textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder={
                        decision === "REJECTED"
                          ? "Please provide reason for rejection..."
                          : "Add any additional remarks..."
                      }
                      className="mt-2"
                      rows={4}
                    />
                  </div>

                  {!allChecked && decision === "ACCEPTED" && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <p className="text-sm text-amber-700">
                        Not all required checklist items are verified. Please
                        complete verification before approving.
                      </p>
                    </div>
                  )}
                </div>
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
              {otpStep === "otp" ? "Back" : "Save & Close"}
            </Button>
            {otpStep === "decision" ? (
              <Button
                onClick={handleSendOtp}
                disabled={
                  isSendingOtp ||
                  !decision ||
                  (decision === "REJECTED" && !remarks) ||
                  (decision === "ACCEPTED" && !allChecked)
                }
              >
                {isSendingOtp ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send OTP & Proceed
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

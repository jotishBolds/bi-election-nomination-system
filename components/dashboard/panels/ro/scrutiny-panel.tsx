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
}

interface ScrutinyChecklist {
  ageVerified: boolean;
  residencyVerified: boolean;
  photoVerified: boolean;
  idProofVerified: boolean;
  nominationFormVerified: boolean;
  affidavitVerified: boolean;
  reservationCriteriaVerified: boolean;
  securityDepositVerified: boolean;
  partyAuthorizationVerified: boolean;
  criminalDeclarationVerified: boolean;
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

  const [checklist, setChecklist] = useState<ScrutinyChecklist>({
    ageVerified: false,
    residencyVerified: false,
    photoVerified: false,
    idProofVerified: false,
    nominationFormVerified: false,
    affidavitVerified: false,
    reservationCriteriaVerified: false,
    securityDepositVerified: false,
    partyAuthorizationVerified: false,
    criminalDeclarationVerified: false,
  });
  const [remarks, setRemarks] = useState("");
  const [decision, setDecision] = useState<"ACCEPTED" | "REJECTED" | "">("");

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

  const handleStartScrutiny = async (nomination: Nomination) => {
    setSelectedNomination(nomination);
    setChecklist({
      ageVerified: false,
      residencyVerified: false,
      photoVerified: false,
      idProofVerified: false,
      nominationFormVerified: false,
      affidavitVerified: false,
      reservationCriteriaVerified: false,
      securityDepositVerified: false,
      partyAuthorizationVerified: false,
      criminalDeclarationVerified: false,
    });
    setRemarks("");
    setDecision("");

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

  const handleSubmitScrutiny = async () => {
    if (!selectedNomination || !decision) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/ro/applications/${selectedNomination.id}/scrutiny`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "COMPLETE",
            decision,
            checklist,
            remarks,
          }),
        },
      );

      const result = await response.json();
      if (result.success) {
        setIsScrutinyDialogOpen(false);
        fetchNominations();
      } else {
        alert(result.error || "Failed to submit scrutiny");
      }
    } catch {
      alert("Failed to submit scrutiny");
    } finally {
      setIsSubmitting(false);
    }
  };

  const allChecked = Object.values(checklist).every(Boolean);

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

          {selectedNomination && (
            <Tabs defaultValue="checklist" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="checklist">Checklist</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="decision">Decision</TabsTrigger>
              </TabsList>

              <TabsContent value="checklist" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Checkbox
                      checked={checklist.ageVerified}
                      onCheckedChange={(checked) =>
                        setChecklist({ ...checklist, ageVerified: !!checked })
                      }
                    />
                    <Label className="flex-1">
                      Age eligibility verified (Min. 21 years)
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Checkbox
                      checked={checklist.residencyVerified}
                      onCheckedChange={(checked) =>
                        setChecklist({
                          ...checklist,
                          residencyVerified: !!checked,
                        })
                      }
                    />
                    <Label className="flex-1">
                      Residency requirement verified
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Checkbox
                      checked={checklist.photoVerified}
                      onCheckedChange={(checked) =>
                        setChecklist({ ...checklist, photoVerified: !!checked })
                      }
                    />
                    <Label className="flex-1">
                      Passport-size photograph verified
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Checkbox
                      checked={checklist.idProofVerified}
                      onCheckedChange={(checked) =>
                        setChecklist({
                          ...checklist,
                          idProofVerified: !!checked,
                        })
                      }
                    />
                    <Label className="flex-1">
                      Identity proof (Aadhaar/Voter ID) verified
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Checkbox
                      checked={checklist.nominationFormVerified}
                      onCheckedChange={(checked) =>
                        setChecklist({
                          ...checklist,
                          nominationFormVerified: !!checked,
                        })
                      }
                    />
                    <Label className="flex-1">
                      Nomination form properly filled and signed
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Checkbox
                      checked={checklist.affidavitVerified}
                      onCheckedChange={(checked) =>
                        setChecklist({
                          ...checklist,
                          affidavitVerified: !!checked,
                        })
                      }
                    />
                    <Label className="flex-1">
                      Affidavit properly notarized and complete
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Checkbox
                      checked={checklist.reservationCriteriaVerified}
                      onCheckedChange={(checked) =>
                        setChecklist({
                          ...checklist,
                          reservationCriteriaVerified: !!checked,
                        })
                      }
                    />
                    <Label className="flex-1">
                      Reservation criteria met (if applicable)
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Checkbox
                      checked={checklist.securityDepositVerified}
                      onCheckedChange={(checked) =>
                        setChecklist({
                          ...checklist,
                          securityDepositVerified: !!checked,
                        })
                      }
                    />
                    <Label className="flex-1">
                      Security deposit payment verified
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Checkbox
                      checked={checklist.partyAuthorizationVerified}
                      onCheckedChange={(checked) =>
                        setChecklist({
                          ...checklist,
                          partyAuthorizationVerified: !!checked,
                        })
                      }
                    />
                    <Label className="flex-1">
                      Party authorization letter (if party candidate)
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Checkbox
                      checked={checklist.criminalDeclarationVerified}
                      onCheckedChange={(checked) =>
                        setChecklist({
                          ...checklist,
                          criminalDeclarationVerified: !!checked,
                        })
                      }
                    />
                    <Label className="flex-1">
                      Criminal case declaration reviewed
                    </Label>
                  </div>
                </div>

                <div className="pt-4 border-t flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    {Object.values(checklist).filter(Boolean).length}/10 items
                    verified
                  </span>
                  {allChecked && (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      All Verified
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
                        Not all checklist items are verified. Please complete
                        verification before approving.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setIsScrutinyDialogOpen(false)}
            >
              Save & Close
            </Button>
            <Button
              onClick={handleSubmitScrutiny}
              disabled={
                isSubmitting ||
                !decision ||
                (decision === "REJECTED" && !remarks) ||
                (decision === "ACCEPTED" && !allChecked)
              }
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {decision === "ACCEPTED" ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Application
                </>
              ) : decision === "REJECTED" ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Application
                </>
              ) : (
                "Submit Decision"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

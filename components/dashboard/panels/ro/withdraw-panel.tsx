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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Search,
  RefreshCw,
  User,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Ban,
  FileText,
  Calendar,
  Phone,
  Send,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Nomination {
  id: string;
  applicationNo: string;
  status: string;
  submittedAt: string;
  scrutinyAt?: string;
  candidateName: string;
  applicantProfile?: {
    user: {
      id: string;
      name: string;
      phone: string;
    };
  };
  ward: {
    id: string;
    wardNo: number;
    wardName: string;
  };
  politicalParty?: {
    name: string;
    shortName: string;
  };
}

export function WithdrawPanel() {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [wardFilter, setWardFilter] = useState<string>("all");
  const [wards, setWards] = useState<
    Array<{ id: string; wardNo: number; wardName: string }>
  >([]);

  const [selectedNomination, setSelectedNomination] =
    useState<Nomination | null>(null);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP flow state
  const [otpStep, setOtpStep] = useState<"reason" | "otp">("reason");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);

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
      params.append("status", "ACCEPTED,CONTESTING");
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

  const handleOpenWithdrawDialog = (nomination: Nomination) => {
    setSelectedNomination(nomination);
    setWithdrawReason("");
    setOtpStep("reason");
    setOtp("");
    setOtpError("");
    setIsWithdrawDialogOpen(true);
  };

  // Send OTP for withdrawal authorization
  const handleSendWithdrawOtp = async () => {
    if (!selectedNomination) return;
    if (!withdrawReason.trim() || withdrawReason.length < 5) {
      setOtpError("Please provide a valid reason (min. 5 characters)");
      return;
    }
    setIsSendingOtp(true);
    setOtpError("");
    try {
      const response = await fetch(
        `/api/ro/applications/${selectedNomination.id}/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "WITHDRAWAL" }),
        },
      );
      const result = await response.json();
      if (result.success) {
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

  const handleWithdrawRequest = () => {
    if (!withdrawReason.trim()) {
      setOtpError("Please provide a reason for withdrawal");
      return;
    }
    handleSendWithdrawOtp();
  };

  const handleConfirmWithdraw = async () => {
    if (!selectedNomination) return;
    if (otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsSubmitting(true);
    setOtpError("");
    try {
      const response = await fetch(
        `/api/ro/applications/${selectedNomination.id}/withdraw`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: withdrawReason, otp }),
        },
      );

      const result = await response.json();
      if (result.success) {
        setIsWithdrawDialogOpen(false);
        setIsConfirmDialogOpen(false);
        setSelectedNomination(null);
        fetchNominations();
      } else {
        setOtpError(result.error || "Failed to process withdrawal");
      }
    } catch {
      setOtpError("Failed to process withdrawal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredNominations = nominations.filter(
    (n) =>
      n.applicationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.candidateName.toLowerCase().includes(searchQuery.toLowerCase()),
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
        <h1 className="text-xl font-semibold text-slate-800">
          Withdrawal Requests
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Process candidate withdrawal requests for approved nominations
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-amber-200 bg-amber-50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">
                Withdrawal Guidelines
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Candidates can withdraw their nominations within the prescribed
                time limit. Once withdrawn, the application cannot be
                reinstated. Ensure candidate has submitted a written withdrawal
                request before processing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {nominations.length}
                </p>
                <p className="text-xs text-slate-500">Approved Nominations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Ban className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {new Set(nominations.map((n) => n.ward.id)).size}
                </p>
                <p className="text-xs text-slate-500">Wards with Candidates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Last Date</p>
                <p className="text-xs text-slate-500">
                  As per Election Schedule
                </p>
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
                placeholder="Search candidates..."
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

      {/* Candidates Table */}
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
                  <TableHead>Party</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved On</TableHead>
                  <TableHead className="w-[120px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNominations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-slate-500"
                    >
                      No approved nominations found
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
                              {n.candidateName}
                            </p>
                            <p className="text-xs text-slate-400">
                              {n.applicantProfile?.user?.phone || "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          Ward {n.ward.wardNo}
                          <p className="text-xs text-slate-400">
                            {n.ward.wardName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {n.politicalParty ? (
                          <Badge variant="outline">
                            {n.politicalParty.shortName}
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Independent
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {n.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {n.scrutinyAt
                          ? new Date(n.scrutinyAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleOpenWithdrawDialog(n)}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Withdraw
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

      {/* Withdraw Dialog with OTP */}
      <Dialog
        open={isWithdrawDialogOpen}
        onOpenChange={setIsWithdrawDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Process Withdrawal</DialogTitle>
            <DialogDescription>
              Withdraw nomination for {selectedNomination?.candidateName}
            </DialogDescription>
          </DialogHeader>

          {selectedNomination && otpStep === "reason" && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {selectedNomination.candidateName}
                    </p>
                    <p className="text-sm text-slate-500">
                      Ward {selectedNomination.ward.wardNo} •{" "}
                      {selectedNomination.applicationNo}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label>Reason for Withdrawal *</Label>
                <Textarea
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  placeholder="Enter the reason provided by the candidate (min. 5 characters)..."
                  className="mt-2"
                  rows={4}
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <p className="text-sm text-amber-700">
                  This action is irreversible. An OTP will be sent to your phone
                  for authorization.
                </p>
              </div>

              {otpError && <p className="text-sm text-red-600">{otpError}</p>}
            </div>
          )}

          {selectedNomination && otpStep === "otp" && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Phone className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-700">
                  An OTP has been sent to your registered phone number. Enter it
                  to confirm withdrawal.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">
                  <strong>Candidate:</strong> {selectedNomination.candidateName}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Reason:</strong> {withdrawReason}
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
                  onClick={handleSendWithdrawOtp}
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
                  setOtpStep("reason");
                  setOtp("");
                  setOtpError("");
                } else {
                  setIsWithdrawDialogOpen(false);
                }
              }}
            >
              {otpStep === "otp" ? "Back" : "Cancel"}
            </Button>
            {otpStep === "reason" ? (
              <Button
                variant="destructive"
                onClick={handleWithdrawRequest}
                disabled={
                  !withdrawReason.trim() ||
                  withdrawReason.length < 5 ||
                  isSendingOtp
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
                variant="destructive"
                onClick={handleConfirmWithdraw}
                disabled={isSubmitting || otp.length !== 6}
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                <Ban className="h-4 w-4 mr-2" />
                Confirm Withdrawal
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Legacy Confirm Dialog - kept for backward compatibility */}
      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Withdrawal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to withdraw the nomination for{" "}
              <strong>{selectedNomination?.candidateName}</strong>?
              <br />
              <br />
              This action cannot be undone and the candidate will be removed
              from the final list of contesting candidates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmWithdraw}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Confirm Withdrawal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

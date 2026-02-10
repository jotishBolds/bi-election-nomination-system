"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Image from "next/image";

import {
  Receipt,
  RefreshCw,
  Loader2,
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
} from "lucide-react";

interface BRPayment {
  id: string;
  brNumber: string;
  proofImageUrl: string;
  status: string;
  rejectionNote: string | null;
  verifiedAt: string | null;
  submittedAt: string;
  createdAt?: string;
  nomination?: {
    id: string;
    applicationNo: string;
    candidateName: string;
    status: string;
    ulb?: { name: string };
    ward?: { wardNo: number; wardName: string };
  };
}

// Safe date formatter
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString();
}

export function BRPaymentsPanel() {
  const [payments, setPayments] = useState<BRPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<BRPayment | null>(
    null,
  );
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
  });

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", pagination.page.toString());
      params.set("limit", "20");

      const response = await fetch(`/api/admin/br-payments?${params}`);
      const result = await response.json();

      if (result.success) {
        setPayments(result.data);
        setPagination((prev) => ({
          ...prev,
          total: result.pagination.total,
          totalPages: result.pagination.pages || result.pagination.totalPages,
        }));
      } else {
        setError(result.error || "Failed to fetch BR payments");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, pagination.page]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleVerify = async (id: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/br-payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      const result = await response.json();
      if (result.success) {
        fetchPayments();
        setIsViewDialogOpen(false);
      } else {
        setError(result.error || "Failed to verify payment");
      }
    } catch {
      setError("Failed to verify payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/br-payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "FAILED",
          rejectionNote: rejectionNote || "Payment proof rejected",
        }),
      });
      const result = await response.json();
      if (result.success) {
        fetchPayments();
        setIsViewDialogOpen(false);
        setRejectionNote("");
      } else {
        setError(result.error || "Failed to reject payment");
      }
    } catch {
      setError("Failed to reject payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Verified
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">BR Payments</h2>
          <p className="text-muted-foreground">
            Review and verify BR payment proofs from candidates
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPayments}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment Proofs ({pagination.total})
          </CardTitle>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by BR number or candidate..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Verified</SelectItem>
                <SelectItem value="FAILED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No BR payment records found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>BR Number</TableHead>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Application</TableHead>
                      <TableHead>ULB / Ward</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {payment.brNumber}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {payment.nomination?.candidateName || "N/A"}
                        </TableCell>
                        <TableCell>
                          {payment.nomination?.applicationNo || "N/A"}
                        </TableCell>
                        <TableCell>
                          {payment.nomination?.ulb?.name || "N/A"} /{" "}
                          {payment.nomination?.ward
                            ? `Ward ${payment.nomination.ward.wardNo} - ${payment.nomination.ward.wardName}`
                            : "N/A"}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-sm">
                          {formatDate(payment.submittedAt || payment.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Payment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>BR Payment Proof</DialogTitle>
            <DialogDescription>
              Review the payment proof and verify or reject it.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">BR Number</p>
                  <p className="font-medium">{selectedPayment.brNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(selectedPayment.status)}
                </div>
                <div>
                  <p className="text-muted-foreground">Candidate</p>
                  <p className="font-medium">
                    {selectedPayment.nomination?.candidateName}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Application</p>
                  <p className="font-medium">
                    {selectedPayment.nomination?.applicationNo}
                  </p>
                </div>
              </div>

              {/* Proof Image */}
              <div className="border rounded-lg overflow-hidden">
                <div className="relative w-full h-64">
                  <Image
                    src={selectedPayment.proofImageUrl}
                    alt="BR Payment Proof"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {selectedPayment.rejectionNote && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Rejection: {selectedPayment.rejectionNote}
                  </AlertDescription>
                </Alert>
              )}

              {selectedPayment.status === "PENDING" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Rejection Note (optional, for rejection only)</Label>
                    <Textarea
                      placeholder="Enter reason for rejection..."
                      value={rejectionNote}
                      onChange={(e) => setRejectionNote(e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedPayment?.status === "PENDING" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedPayment.id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Reject
                </Button>
                <Button
                  onClick={() => handleVerify(selectedPayment.id)}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Verify
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

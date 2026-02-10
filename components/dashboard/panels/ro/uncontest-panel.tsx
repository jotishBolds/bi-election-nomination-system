"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  RefreshCw,
  Eye,
  User,
  AlertTriangle,
  XCircle,
  Ban,
  Download,
  Printer,
  MapPin,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Nomination {
  id: string;
  applicationNo: string;
  candidateName: string;
  status: string;
  rejectionReasons?: string;
  scrutinyRemarks?: string;
  withdrawnAt?: string;
  withdrawalReason?: string;
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
    abbreviation: string;
  };
}

export function UncontestPanel() {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [wardFilter, setWardFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [wards, setWards] = useState<
    Array<{ id: string; wardNo: number; wardName: string }>
  >([]);
  const [selectedNomination, setSelectedNomination] =
    useState<Nomination | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

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
      // Get rejected and withdrawn nominations
      if (statusFilter === "all") {
        params.append("status", "REJECTED,WITHDRAWN");
      } else {
        params.append("status", statusFilter);
      }
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
  }, [wardFilter, statusFilter]);

  useEffect(() => {
    fetchWards();
  }, []);

  useEffect(() => {
    fetchNominations();
  }, [fetchNominations]);

  const handleViewNomination = (nomination: Nomination) => {
    setSelectedNomination(nomination);
    setIsDetailDialogOpen(true);
  };

  const handleExportList = () => {
    const csvData = [
      [
        "Sr. No",
        "Application No",
        "Candidate Name",
        "Ward No",
        "Ward Name",
        "Party",
        "Status",
        "Reason",
      ],
      ...nominations.map((n, idx) => [
        idx + 1,
        n.applicationNo,
        n.candidateName || n.applicantProfile?.user?.name || "",
        n.ward.wardNo,
        n.ward.wardName,
        n.politicalParty?.abbreviation || "Independent",
        n.status,
        n.status === "REJECTED"
          ? n.rejectionReasons || n.scrutinyRemarks || ""
          : n.withdrawalReason || "",
      ]),
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uncontest-list-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    if (status === "REJECTED") {
      return (
        <Badge className="bg-red-100 text-red-700">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-700">
        <Ban className="h-3 w-3 mr-1" />
        Withdrawn
      </Badge>
    );
  };

  const filteredNominations = nominations.filter(
    (n) =>
      n.applicationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.candidateName || n.applicantProfile?.user?.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  if (isLoading && nominations.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  const rejectedCount = nominations.filter(
    (n) => n.status === "REJECTED"
  ).length;
  const withdrawnCount = nominations.filter(
    (n) => n.status === "WITHDRAWN"
  ).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Uncontest List
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Rejected and withdrawn nominations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleExportList}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {nominations.length}
                </p>
                <p className="text-xs text-slate-500">Total Uncontest</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {rejectedCount}
                </p>
                <p className="text-xs text-slate-500">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Ban className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {withdrawnCount}
                </p>
                <p className="text-xs text-slate-500">Withdrawn</p>
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
                    Ward {w.wardNo} - {w.wardName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
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

      {/* Nominations Table */}
      <Card className="border-0 shadow-sm" id="printable-table">
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
                  <TableHead className="w-[60px]">Sr. No</TableHead>
                  <TableHead>Application No</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Ward</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNominations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-slate-500"
                    >
                      No rejected or withdrawn nominations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNominations.map((n, idx) => (
                    <TableRow key={n.id}>
                      <TableCell>
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-slate-600">
                            {idx + 1}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {n.applicationNo}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">
                              {n.candidateName ||
                                n.applicantProfile?.user?.name ||
                                "N/A"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {n.applicantProfile?.user?.phone || ""}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium text-slate-700">
                            Ward {n.ward.wardNo}
                          </p>
                          <p className="text-xs text-slate-400">
                            {n.ward.wardName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {n.politicalParty ? (
                          <Badge variant="outline" className="font-medium">
                            {n.politicalParty.abbreviation}
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Independent
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(n.status)}</TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-500 max-w-[200px] truncate">
                          {n.status === "REJECTED"
                            ? n.rejectionReasons || n.scrutinyRemarks || "-"
                            : n.withdrawalReason || "-"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewNomination(n)}
                        >
                          <Eye className="h-4 w-4" />
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

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nomination Details</DialogTitle>
            <DialogDescription>
              Application No: {selectedNomination?.applicationNo}
            </DialogDescription>
          </DialogHeader>

          {selectedNomination && (
            <div className="space-y-6 mt-4">
              {/* Candidate Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <User className="h-8 w-8 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedNomination.candidateName ||
                      selectedNomination.applicantProfile?.user?.name ||
                      "N/A"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {selectedNomination.applicantProfile?.user?.phone}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">
                    Status
                  </span>
                  {getStatusBadge(selectedNomination.status)}
                </div>
              </div>

              {/* Ward Info */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">
                    Ward
                  </span>
                </div>
                <p className="font-semibold">
                  Ward {selectedNomination.ward.wardNo} -{" "}
                  {selectedNomination.ward.wardName}
                </p>
                {selectedNomination.ward.reservationType && (
                  <Badge className="mt-2">
                    {selectedNomination.ward.reservationType.replace(/_/g, " ")}
                  </Badge>
                )}
              </div>

              {/* Reason */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">
                    {selectedNomination.status === "REJECTED"
                      ? "Rejection Reason"
                      : "Withdrawal Reason"}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  {selectedNomination.status === "REJECTED"
                    ? selectedNomination.rejectionReasons ||
                      selectedNomination.scrutinyRemarks ||
                      "No reason provided"
                    : selectedNomination.withdrawalReason ||
                      "No reason provided"}
                </p>
                {selectedNomination.withdrawnAt && (
                  <p className="text-xs text-slate-400 mt-2">
                    Withdrawn on:{" "}
                    {new Date(selectedNomination.withdrawnAt).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Party */}
              {selectedNomination.politicalParty && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">
                    Political Party
                  </span>
                  <p className="font-semibold mt-1">
                    {selectedNomination.politicalParty.name}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
  CheckCircle,
  Trophy,
  Users,
  Download,
  Printer,
  FileText,
  MapPin,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Candidate {
  id: string;
  applicationNo: string;
  status: string;
  serialNo?: number;
  ballotOrder?: number;
  candidate: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    photoUrl?: string;
  };
  ward: {
    id: string;
    wardNo: number;
    wardName: string;
    reservationStatus: string;
  };
  politicalParty?: {
    name: string;
    shortName: string;
  };
  electionSymbol?: {
    name: string;
    imageUrl?: string;
  };
}

interface WardSummary {
  wardId: string;
  wardNo: number;
  wardName: string;
  totalCandidates: number;
  reservationStatus: string;
}

export function ContestPanel() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [wardSummaries, setWardSummaries] = useState<WardSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [wardFilter, setWardFilter] = useState<string>("all");
  const [wards, setWards] = useState<
    Array<{ id: string; wardNo: number; wardName: string }>
  >([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null,
  );
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

  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("status", "VALID");
      if (wardFilter && wardFilter !== "all") {
        params.append("wardId", wardFilter);
      }

      const response = await fetch(`/api/ro/contest?${params}`);
      const result = await response.json();

      if (result.success) {
        setCandidates(result.data.contestants || []);
        setWardSummaries(result.data.wardSummary || []);
      } else {
        setError(result.error || "Failed to fetch contest data");
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
    fetchCandidates();
  }, [fetchCandidates]);

  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
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
        "Symbol",
      ],
      ...candidates.map((c, idx) => [
        idx + 1,
        c.applicationNo,
        c.candidate.name,
        c.ward.wardNo,
        c.ward.wardName,
        c.politicalParty?.shortName || "Independent",
        c.electionSymbol?.name || "—",
      ]),
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contesting-candidates-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredCandidates = candidates.filter(
    (c) =>
      c.applicationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.candidate.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading && candidates.length === 0) {
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Contesting Candidates
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Final list of candidates contesting in the election
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-emerald-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {candidates.length}
                </p>
                <p className="text-xs text-slate-500">Total Contestants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {wardSummaries.length}
                </p>
                <p className="text-xs text-slate-500">Wards</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {candidates.filter((c) => c.politicalParty).length}
                </p>
                <p className="text-xs text-slate-500">Party Candidates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <User className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {candidates.filter((c) => !c.politicalParty).length}
                </p>
                <p className="text-xs text-slate-500">Independent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ward-wise Summary */}
      {wardSummaries.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Ward-wise Candidate Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {wardSummaries.map((ws) => (
                <div
                  key={ws.wardId}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg"
                >
                  <span className="text-sm font-medium text-slate-600">
                    Ward {ws.wardNo}
                  </span>
                  <Badge variant="secondary">{ws.totalCandidates}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
            <Button
              variant="outline"
              size="icon"
              onClick={fetchCandidates}
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
      <Card className="border-0 shadow-sm" id="printable-table">
        <CardContent className="p-0">
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <AlertTriangle className="h-12 w-12 text-amber-500" />
              <p className="text-slate-600">{error}</p>
              <Button onClick={fetchCandidates} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Sr. No</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Ward</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-slate-500"
                    >
                      No contesting candidates found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCandidates.map((c, idx) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-slate-600">
                            {idx + 1}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {c.candidate.photoUrl ? (
                            <img
                              src={c.candidate.photoUrl}
                              alt={c.candidate.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-800">
                              {c.candidate.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {c.applicationNo}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium text-slate-700">
                            Ward {c.ward.wardNo}
                          </p>
                          <p className="text-xs text-slate-400">
                            {c.ward.wardName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.politicalParty ? (
                          <Badge variant="outline" className="font-medium">
                            {c.politicalParty.shortName}
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Independent
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.electionSymbol ? (
                          <div className="flex items-center gap-2">
                            {c.electionSymbol.imageUrl && (
                              <img
                                src={c.electionSymbol.imageUrl}
                                alt={c.electionSymbol.name}
                                className="w-6 h-6 object-contain"
                              />
                            )}
                            <span className="text-sm text-slate-600">
                              {c.electionSymbol.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Valid
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewCandidate(c)}
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
            <DialogTitle>Candidate Details</DialogTitle>
            <DialogDescription>
              Application No: {selectedCandidate?.applicationNo}
            </DialogDescription>
          </DialogHeader>

          {selectedCandidate && (
            <div className="space-y-6 mt-4">
              {/* Candidate Info */}
              <div className="flex items-center gap-4">
                {selectedCandidate.candidate.photoUrl ? (
                  <img
                    src={selectedCandidate.candidate.photoUrl}
                    alt={selectedCandidate.candidate.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-10 w-10 text-blue-600" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedCandidate.candidate.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {selectedCandidate.candidate.phone}
                  </p>
                  {selectedCandidate.candidate.email && (
                    <p className="text-sm text-slate-400">
                      {selectedCandidate.candidate.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Ward Info */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">
                    Contesting Ward
                  </span>
                </div>
                <p className="font-semibold">
                  Ward {selectedCandidate.ward.wardNo} -{" "}
                  {selectedCandidate.ward.wardName}
                </p>
                <Badge className="mt-2">
                  {selectedCandidate.ward.reservationStatus.replace("-", " ")}
                </Badge>
              </div>

              {/* Party & Symbol */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">
                      Political Party
                    </span>
                  </div>
                  <p className="font-semibold">
                    {selectedCandidate.politicalParty?.name || "Independent"}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">
                      Election Symbol
                    </span>
                  </div>
                  {selectedCandidate.electionSymbol ? (
                    <div className="flex items-center gap-2">
                      {selectedCandidate.electionSymbol.imageUrl && (
                        <img
                          src={selectedCandidate.electionSymbol.imageUrl}
                          alt={selectedCandidate.electionSymbol.name}
                          className="w-8 h-8 object-contain"
                        />
                      )}
                      <p className="font-semibold">
                        {selectedCandidate.electionSymbol.name}
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-400">Not assigned</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

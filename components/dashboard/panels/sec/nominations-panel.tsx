"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  RefreshCw,
  Eye,
  FileText,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  FileCheck,
  Ban,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Nomination {
  id: string;
  applicationNo: string;
  status: string;
  submittedAt: string;
  scrutinyStatus?: string;
  scrutinyAt?: string;
  scrutinyRemarks?: string;
  candidate: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  ward: {
    id: string;
    wardNo: number;
    wardName: string;
    ulb: {
      id: string;
      name: string;
      district: {
        id: string;
        name: string;
      };
    };
  };
  politicalParty?: {
    name: string;
    shortName: string;
  };
}

interface District {
  id: string;
  name: string;
}

interface ULB {
  id: string;
  name: string;
}

export function NominationsPanel() {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [ulbs, setUlbs] = useState<ULB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [ulbFilter, setUlbFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedNomination, setSelectedNomination] =
    useState<Nomination | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const fetchDistricts = async () => {
    try {
      const response = await fetch("/api/sec/districts");
      const result = await response.json();
      if (result.success) {
        setDistricts(result.data);
      }
    } catch {
      console.error("Failed to fetch districts");
    }
  };

  const fetchULBs = async (districtId?: string) => {
    try {
      const params = districtId ? `?districtId=${districtId}` : "";
      const response = await fetch(`/api/sec/ulbs${params}`);
      const result = await response.json();
      if (result.success) {
        setUlbs(result.data);
      }
    } catch {
      console.error("Failed to fetch ULBs");
    }
  };

  const fetchNominations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (districtFilter && districtFilter !== "all") {
        params.append("districtId", districtFilter);
      }
      if (ulbFilter && ulbFilter !== "all") {
        params.append("ulbId", ulbFilter);
      }
      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/sec/nominations?${params}`);
      const result = await response.json();

      if (result.success) {
        setNominations(result.data);
      } else {
        setError(result.error || "Failed to fetch nominations");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, [districtFilter, ulbFilter, statusFilter]);

  useEffect(() => {
    fetchDistricts();
  }, []);

  useEffect(() => {
    if (districtFilter && districtFilter !== "all") {
      fetchULBs(districtFilter);
      setUlbFilter("all");
    } else {
      fetchULBs();
    }
  }, [districtFilter]);

  useEffect(() => {
    fetchNominations();
  }, [fetchNominations]);

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { bg: string; text: string; icon: React.ReactNode }
    > = {
      DRAFT: {
        bg: "bg-slate-100",
        text: "text-slate-700",
        icon: <Clock className="h-3 w-3" />,
      },
      SUBMITTED: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        icon: <FileText className="h-3 w-3" />,
      },
      UNDER_SCRUTINY: {
        bg: "bg-amber-100",
        text: "text-amber-700",
        icon: <Eye className="h-3 w-3" />,
      },
      APPROVED: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      REJECTED: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: <XCircle className="h-3 w-3" />,
      },
      WITHDRAWN: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        icon: <Ban className="h-3 w-3" />,
      },
      VALID: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        icon: <FileCheck className="h-3 w-3" />,
      },
    };
    const c = config[status] || config.DRAFT;
    return (
      <Badge className={`${c.bg} ${c.text} gap-1`}>
        {c.icon}
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const handleViewNomination = (nomination: Nomination) => {
    setSelectedNomination(nomination);
    setIsViewDialogOpen(true);
  };

  const filteredNominations = nominations.filter(
    (n) =>
      n.applicationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.candidate.phone.includes(searchQuery),
  );

  // Stats
  const statusStats = nominations.reduce(
    (acc, n) => {
      acc[n.status] = (acc[n.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
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
          All Nominations
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Overview of all nomination applications across the state
        </p>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by application no., name, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={districtFilter} onValueChange={setDistrictFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Districts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ulbFilter} onValueChange={setUlbFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All ULBs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ULBs</SelectItem>
                {ulbs.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="UNDER_SCRUTINY">Under Scrutiny</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                <SelectItem value="VALID">Valid</SelectItem>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="text-xs text-slate-500">Total</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {nominations.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Applications</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Eye className="h-5 w-5 text-amber-600" />
              <span className="text-xs text-slate-500">Pending</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {(statusStats["SUBMITTED"] || 0) +
                  (statusStats["UNDER_SCRUTINY"] || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Scrutiny Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <span className="text-xs text-slate-500">Approved</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {(statusStats["APPROVED"] || 0) + (statusStats["VALID"] || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Cleared</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-xs text-slate-500">Rejected</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {statusStats["REJECTED"] || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">Applications</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nominations Table */}
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
                  <TableHead>Application No.</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Ward / ULB</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNominations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-slate-500"
                    >
                      No nominations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNominations.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell>
                        <span className="font-mono text-sm font-medium text-slate-800">
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
                              {n.candidate.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {n.candidate.phone}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="text-slate-600">
                            Ward {n.ward.wardNo} - {n.ward.wardName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {n.ward.ulb.name}, {n.ward.ulb.district.name}
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
                      <TableCell>{getStatusBadge(n.status)}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {new Date(n.submittedAt).toLocaleDateString()}
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nomination Details</DialogTitle>
            <DialogDescription>
              Application No: {selectedNomination?.applicationNo}
            </DialogDescription>
          </DialogHeader>
          {selectedNomination && (
            <Tabs defaultValue="candidate" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="candidate">Candidate</TabsTrigger>
                <TabsTrigger value="ward">Ward Info</TabsTrigger>
                <TabsTrigger value="status">Status</TabsTrigger>
              </TabsList>
              <TabsContent value="candidate" className="space-y-4 mt-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedNomination.candidate.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {selectedNomination.candidate.phone}
                    </p>
                    {selectedNomination.candidate.email && (
                      <p className="text-sm text-slate-400">
                        {selectedNomination.candidate.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-500">
                    Political Affiliation
                  </p>
                  <p className="font-medium">
                    {selectedNomination.politicalParty?.name ||
                      "Independent Candidate"}
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="ward" className="space-y-4 mt-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      Ward {selectedNomination.ward.wardNo}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {selectedNomination.ward.wardName}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-slate-500">ULB</p>
                    <p className="font-medium">
                      {selectedNomination.ward.ulb.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">District</p>
                    <p className="font-medium">
                      {selectedNomination.ward.ulb.district.name}
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="status" className="space-y-4 mt-4">
                <div className="flex items-center gap-4">
                  <Calendar className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Submitted On</p>
                    <p className="font-medium">
                      {new Date(
                        selectedNomination.submittedAt,
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-500 mb-2">Current Status</p>
                  {getStatusBadge(selectedNomination.status)}
                </div>
                {selectedNomination.scrutinyAt && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-slate-500">Scrutiny Date</p>
                    <p className="font-medium">
                      {new Date(selectedNomination.scrutinyAt).toLocaleString()}
                    </p>
                    {selectedNomination.scrutinyRemarks && (
                      <p className="text-sm text-slate-500 mt-2">
                        Remarks: {selectedNomination.scrutinyRemarks}
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

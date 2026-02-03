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
  Building2,
  Search,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Landmark,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ULB {
  id: string;
  name: string;
  code: string;
  type: string;
  isActive: boolean;
  _count: {
    wards: number;
  };
  district: {
    name: string;
  };
}

interface District {
  id: string;
  name: string;
}

export function ULBsPanel() {
  const [ulbs, setUlbs] = useState<ULB[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState<string>("all");

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

  const fetchULBs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (districtFilter && districtFilter !== "all") {
        params.append("districtId", districtFilter);
      }
      const response = await fetch(`/api/sec/ulbs?${params}`);
      const result = await response.json();

      if (result.success) {
        setUlbs(result.data);
      } else {
        setError(result.error || "Failed to fetch ULBs");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, [districtFilter]);

  useEffect(() => {
    fetchDistricts();
  }, []);

  useEffect(() => {
    fetchULBs();
  }, [fetchULBs]);

  const filteredULBs = ulbs.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getTypeColor = (type: string) => {
    if (type.includes("Corporation")) return "bg-purple-100 text-purple-700";
    if (type.includes("Council")) return "bg-blue-100 text-blue-700";
    return "bg-emerald-100 text-emerald-700";
  };

  if (isLoading && ulbs.length === 0) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Urban Local Bodies
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View and manage ULB information
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchULBs}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search ULBs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={districtFilter} onValueChange={setDistrictFilter}>
              <SelectTrigger className="w-48">
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
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Building2 className="h-5 w-5 text-blue-600" />
              <span className="text-xs text-slate-500">Total</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">{ulbs.length}</p>
              <p className="text-xs text-slate-500 mt-1">ULBs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Building2 className="h-5 w-5 text-purple-600" />
              <span className="text-xs text-slate-500">Corporations</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {ulbs.filter((u) => u.type.includes("Corporation")).length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Municipal Corps</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Building2 className="h-5 w-5 text-emerald-600" />
              <span className="text-xs text-slate-500">Panchayats</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {ulbs.filter((u) => u.type.includes("Panchayat")).length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Nagar Panchayats</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Landmark className="h-5 w-5 text-amber-600" />
              <span className="text-xs text-slate-500">Total</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {ulbs.reduce((sum, u) => sum + u._count.wards, 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total Wards</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ULBs Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <AlertTriangle className="h-12 w-12 text-amber-500" />
              <p className="text-slate-600">{error}</p>
              <Button onClick={fetchULBs} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ULB Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Wards</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredULBs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-slate-500"
                    >
                      No ULBs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredULBs.map((ulb) => (
                    <TableRow key={ulb.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-emerald-600" />
                          </div>
                          <span className="font-medium text-slate-800">
                            {ulb.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {ulb.code}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(ulb.type)}>
                          {ulb.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {ulb.district.name}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-700">
                          {ulb._count.wards} wards
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            ulb.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          {ulb.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

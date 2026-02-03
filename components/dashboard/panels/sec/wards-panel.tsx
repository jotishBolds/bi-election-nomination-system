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
  Search,
  RefreshCw,
  MapPin,
  Hash,
  Users,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Ward {
  id: string;
  wardNo: number;
  wardName: string;
  reservationStatus: string;
  totalSeats: number;
  ulb: {
    id: string;
    name: string;
    type: string;
    district: {
      id: string;
      name: string;
    };
  };
  _count?: {
    nominations: number;
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

export function WardsPanel() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [ulbs, setUlbs] = useState<ULB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [ulbFilter, setUlbFilter] = useState<string>("all");
  const [reservationFilter, setReservationFilter] = useState<string>("all");

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

  const fetchWards = useCallback(async () => {
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
      if (reservationFilter && reservationFilter !== "all") {
        params.append("reservation", reservationFilter);
      }

      const response = await fetch(`/api/sec/wards?${params}`);
      const result = await response.json();

      if (result.success) {
        setWards(result.data);
      } else {
        setError(result.error || "Failed to fetch wards");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, [districtFilter, ulbFilter, reservationFilter]);

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
    fetchWards();
  }, [fetchWards]);

  const getReservationBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      GENERAL: { bg: "bg-slate-100", text: "text-slate-700" },
      SC: { bg: "bg-blue-100", text: "text-blue-700" },
      ST: { bg: "bg-green-100", text: "text-green-700" },
      OBC: { bg: "bg-amber-100", text: "text-amber-700" },
      "WOMEN-GENERAL": { bg: "bg-pink-100", text: "text-pink-700" },
      "WOMEN-SC": { bg: "bg-purple-100", text: "text-purple-700" },
      "WOMEN-ST": { bg: "bg-teal-100", text: "text-teal-700" },
      "WOMEN-OBC": { bg: "bg-orange-100", text: "text-orange-700" },
    };
    const variant = variants[status] || {
      bg: "bg-slate-100",
      text: "text-slate-700",
    };
    return (
      <Badge className={`${variant.bg} ${variant.text}`}>
        {status.replace("-", " ")}
      </Badge>
    );
  };

  const filteredWards = wards.filter(
    (ward) =>
      ward.wardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ward.wardNo.toString().includes(searchQuery),
  );

  // Reservation stats
  const reservationStats = wards.reduce(
    (acc, ward) => {
      acc[ward.reservationStatus] = (acc[ward.reservationStatus] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  if (isLoading && wards.length === 0) {
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
        <h1 className="text-xl font-semibold text-slate-800">Wards Overview</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          View ward information across all ULBs
        </p>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search wards..."
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
            <Select
              value={reservationFilter}
              onValueChange={setReservationFilter}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Reservations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reservations</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="SC">SC</SelectItem>
                <SelectItem value="ST">ST</SelectItem>
                <SelectItem value="OBC">OBC</SelectItem>
                <SelectItem value="WOMEN-GENERAL">Women-General</SelectItem>
                <SelectItem value="WOMEN-SC">Women-SC</SelectItem>
                <SelectItem value="WOMEN-ST">Women-ST</SelectItem>
                <SelectItem value="WOMEN-OBC">Women-OBC</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchWards}
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
        <Card className="bg-indigo-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Hash className="h-5 w-5 text-indigo-600" />
              <span className="text-xs text-slate-500">Total</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {wards.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Wards</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-emerald-600" />
              <span className="text-xs text-slate-500">Seats</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {wards.reduce((sum, w) => sum + w.totalSeats, 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total Seats</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Building2 className="h-5 w-5 text-blue-600" />
              <span className="text-xs text-slate-500">ULBs</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {new Set(wards.map((w) => w.ulb.id)).size}
              </p>
              <p className="text-xs text-slate-500 mt-1">Covered</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <MapPin className="h-5 w-5 text-amber-600" />
              <span className="text-xs text-slate-500">Reserved</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {wards.filter((w) => w.reservationStatus !== "GENERAL").length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Reserved Wards</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reservation Distribution */}
      {Object.keys(reservationStats).length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">
              Reservation Distribution
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(reservationStats).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg"
                >
                  {getReservationBadge(status)}
                  <span className="text-sm font-medium text-slate-600">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wards Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <AlertTriangle className="h-12 w-12 text-amber-500" />
              <p className="text-slate-600">{error}</p>
              <Button onClick={fetchWards} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ward No.</TableHead>
                  <TableHead>Ward Name</TableHead>
                  <TableHead>ULB</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Reservation</TableHead>
                  <TableHead className="text-center">Seats</TableHead>
                  <TableHead className="text-center">Nominations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWards.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-slate-500"
                    >
                      No wards found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWards.map((ward) => (
                    <TableRow key={ward.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
                              {ward.wardNo}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">
                        {ward.wardName}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600">
                          {ward.ulb.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {ward.ulb.type}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {ward.ulb.district.name}
                      </TableCell>
                      <TableCell>
                        {getReservationBadge(ward.reservationStatus)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{ward.totalSeats}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {ward._count?.nominations || 0}
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

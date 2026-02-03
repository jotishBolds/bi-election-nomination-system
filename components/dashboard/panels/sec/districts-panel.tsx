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
  MapPin,
  Search,
  RefreshCw,
  AlertTriangle,
  Building2,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface District {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  _count: {
    ulbs: number;
  };
  state: {
    name: string;
  };
}

export function DistrictsPanel() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDistricts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sec/districts");
      const result = await response.json();

      if (result.success) {
        setDistricts(result.data);
      } else {
        setError(result.error || "Failed to fetch districts");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDistricts();
  }, [fetchDistricts]);

  const filteredDistricts = districts.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
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
          <h1 className="text-xl font-semibold text-slate-800">Districts</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View and manage district information
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchDistricts}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search districts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="text-xs text-slate-500">Total</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {districts.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Districts</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Building2 className="h-5 w-5 text-emerald-600" />
              <span className="text-xs text-slate-500">Total</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {districts.reduce((sum, d) => sum + d._count.ulbs, 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">ULBs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <MapPin className="h-5 w-5 text-amber-600" />
              <span className="text-xs text-slate-500">Active</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {districts.filter((d) => d.isActive).length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Active Districts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Districts Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <AlertTriangle className="h-12 w-12 text-amber-500" />
              <p className="text-slate-600">{error}</p>
              <Button onClick={fetchDistricts} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>District</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>ULBs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDistricts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-slate-500"
                    >
                      No districts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDistricts.map((district) => (
                    <TableRow key={district.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-slate-800">
                            {district.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {district.code}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {district.state.name}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-purple-100 text-purple-700">
                          {district._count.ulbs} ULBs
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            district.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          {district.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="h-4 w-4" />
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
    </div>
  );
}

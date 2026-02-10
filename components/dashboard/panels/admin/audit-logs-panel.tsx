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
  History,
  Search,
  RefreshCw,
  AlertTriangle,
  User,
  Filter,
  Calendar,
  Download,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    name: string;
    phone: string;
  };
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

export function AuditLogsPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (searchQuery) params.append("search", searchQuery);
      if (actionFilter && actionFilter !== "all")
        params.append("action", actionFilter);
      if (entityFilter && entityFilter !== "all")
        params.append("entityType", entityFilter);
      if (dateFrom) params.append("startDate", dateFrom);
      if (dateTo) params.append("endDate", dateTo);

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const result = await response.json();

      if (result.success) {
        setLogs(result.data);
        setPagination((prev) => ({
          ...prev,
          total: result.pagination?.total ?? result.total ?? 0,
          totalPages: result.pagination?.totalPages ?? result.totalPages ?? 0,
        }));
      } else {
        setError(result.error || "Failed to fetch audit logs");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    searchQuery,
    actionFilter,
    entityFilter,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadgeColor = (action: string) => {
    if (action.includes("CREATE")) return "bg-emerald-100 text-emerald-700";
    if (action.includes("UPDATE")) return "bg-blue-100 text-blue-700";
    if (action.includes("DELETE")) return "bg-red-100 text-red-700";
    if (action.includes("LOGIN")) return "bg-purple-100 text-purple-700";
    if (action.includes("LOGOUT")) return "bg-slate-100 text-slate-700";
    if (action.includes("FAILED")) return "bg-red-100 text-red-700";
    if (action.includes("NOMINATION")) return "bg-amber-100 text-amber-700";
    if (action.includes("PAYMENT")) return "bg-cyan-100 text-cyan-700";
    return "bg-slate-100 text-slate-700";
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ");
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (actionFilter && actionFilter !== "all")
        params.append("action", actionFilter);
      if (entityFilter && entityFilter !== "all")
        params.append("entityType", entityFilter);
      if (dateFrom) params.append("startDate", dateFrom);
      if (dateTo) params.append("endDate", dateTo);

      const response = await fetch(
        `/api/admin/audit-logs?${params}&format=csv`,
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
    } catch {
      alert("Failed to export logs");
    }
  };

  if (isLoading && logs.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
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
          <h1 className="text-xl font-semibold text-slate-800">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track all system activities and changes
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by user or entity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
                <SelectItem value="NOMINATION_SUBMITTED">
                  Nomination Submitted
                </SelectItem>
                <SelectItem value="NOMINATION_ACCEPTED">
                  Nomination Accepted
                </SelectItem>
                <SelectItem value="NOMINATION_REJECTED">
                  Nomination Rejected
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="NominationApplication">
                  Nomination
                </SelectItem>
                <SelectItem value="ElectionConfig">Election Config</SelectItem>
                <SelectItem value="Payment">Payment</SelectItem>
                <SelectItem value="Document">Document</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-36"
                placeholder="From"
              />
              <span className="text-slate-400">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-36"
                placeholder="To"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchLogs}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <AlertTriangle className="h-12 w-12 text-amber-500" />
              <p className="text-slate-600">{error}</p>
              <Button onClick={fetchLogs} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-slate-500"
                    >
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        <div>
                          <p className="text-slate-800">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                              <User className="h-3.5 w-3.5 text-slate-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">
                                {log.user.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {log.user.phone}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${getActionBadgeColor(log.action)}`}
                        >
                          {formatAction(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-slate-800">
                            {log.entityType}
                          </p>
                          {log.entityId && (
                            <p className="text-xs text-slate-500 truncate max-w-[150px]">
                              {log.entityId.substring(0, 8)}...
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {log.ipAddress}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} logs
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
            >
              Previous
            </Button>
            <span className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

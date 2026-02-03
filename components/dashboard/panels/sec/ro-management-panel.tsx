"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserCog,
  Plus,
  Search,
  MoreVertical,
  Edit,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ROUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isActive: boolean;
  lastLoginAt?: string;
  jurisdictions: Array<{
    type: string;
    district?: { id: string; name: string };
    ulb?: { id: string; name: string };
    ward?: { id: string; wardNo: number; wardName: string };
  }>;
}

interface District {
  id: string;
  name: string;
}

interface ULB {
  id: string;
  name: string;
}

export function ROManagementPanel() {
  const [roUsers, setROUsers] = useState<ROUser[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [ulbs, setUlbs] = useState<ULB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    districtId: "",
    ulbId: "",
  });

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

  const fetchULBs = async (districtId: string) => {
    try {
      const response = await fetch(`/api/sec/ulbs?districtId=${districtId}`);
      const result = await response.json();
      if (result.success) {
        setUlbs(result.data);
      }
    } catch {
      console.error("Failed to fetch ULBs");
    }
  };

  const fetchROUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (districtFilter && districtFilter !== "all") {
        params.append("districtId", districtFilter);
      }
      const response = await fetch(`/api/sec/ro-users?${params}`);
      const result = await response.json();

      if (result.success) {
        setROUsers(result.data);
      } else {
        setError(result.error || "Failed to fetch RO users");
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
    fetchROUsers();
  }, [fetchROUsers]);

  useEffect(() => {
    if (formData.districtId) {
      fetchULBs(formData.districtId);
    }
  }, [formData.districtId]);

  const handleCreateRO = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/sec/ro-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          jurisdiction: {
            type: "DISTRICT",
            districtId: formData.districtId,
            ulbId: formData.ulbId || undefined,
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        setIsDialogOpen(false);
        setFormData({
          name: "",
          phone: "",
          email: "",
          districtId: "",
          ulbId: "",
        });
        fetchROUsers();
      } else {
        alert(result.error || "Failed to create RO");
      }
    } catch {
      alert("Failed to create RO");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/sec/ro-users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const result = await response.json();
      if (result.success) {
        fetchROUsers();
      }
    } catch {
      console.error("Failed to toggle status");
    }
  };

  const getJurisdictionText = (ro: ROUser) => {
    if (!ro.jurisdictions?.length) return "—";
    const j = ro.jurisdictions[0];
    const parts: string[] = [];
    if (j.district) parts.push(j.district.name);
    if (j.ulb) parts.push(j.ulb.name);
    if (j.ward) parts.push(`Ward ${j.ward.wardNo}`);
    return parts.join(" → ") || "—";
  };

  const filteredROUsers = roUsers.filter(
    (ro) =>
      ro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ro.phone.includes(searchQuery),
  );

  if (isLoading && roUsers.length === 0) {
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
            RO Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage Returning Officers and their jurisdictions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add RO
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Returning Officer</DialogTitle>
              <DialogDescription>
                Create a new RO account and assign jurisdiction
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Full Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter full name"
                />
              </div>
              <div className="grid gap-2">
                <Label>Phone Number *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="10-digit phone number"
                />
              </div>
              <div className="grid gap-2">
                <Label>Email (Optional)</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label>District *</Label>
                <Select
                  value={formData.districtId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, districtId: value, ulbId: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.districtId && (
                <div className="grid gap-2">
                  <Label>ULB (Optional - for specific ULB assignment)</Label>
                  <Select
                    value={formData.ulbId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, ulbId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ULB (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All ULBs in district</SelectItem>
                      {ulbs.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRO} disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create RO
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search ROs..."
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
            <Button
              variant="outline"
              size="icon"
              onClick={fetchROUsers}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <UserCog className="h-5 w-5 text-blue-600" />
              <span className="text-xs text-slate-500">Total</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {roUsers.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Returning Officers</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <span className="text-xs text-slate-500">Active</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {roUsers.filter((ro) => ro.isActive).length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Active ROs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <MapPin className="h-5 w-5 text-amber-600" />
              <span className="text-xs text-slate-500">Coverage</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-800">
                {
                  new Set(
                    roUsers.flatMap((ro) =>
                      ro.jurisdictions
                        .map((j) => j.district?.id)
                        .filter(Boolean),
                    ),
                  ).size
                }
              </p>
              <p className="text-xs text-slate-500 mt-1">Districts Covered</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RO Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <AlertTriangle className="h-12 w-12 text-amber-500" />
              <p className="text-slate-600">{error}</p>
              <Button onClick={fetchROUsers} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Officer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Jurisdiction</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredROUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-slate-500"
                    >
                      No ROs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredROUsers.map((ro) => (
                    <TableRow key={ro.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-slate-800">
                            {ro.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Phone className="h-3 w-3" />
                          {ro.phone}
                        </div>
                        {ro.email && (
                          <p className="text-xs text-slate-400">{ro.email}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <MapPin className="h-3 w-3" />
                          {getJurisdictionText(ro)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ro.isActive ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {ro.lastLoginAt
                          ? new Date(ro.lastLoginAt).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleStatus(ro.id, ro.isActive)
                              }
                            >
                              {ro.isActive ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

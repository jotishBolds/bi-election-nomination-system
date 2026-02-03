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
  Users,
  Plus,
  Search,
  MoreVertical,
  UserCog,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  roles: { role: string }[];
  jurisdictions: Array<{
    type: string;
    state?: { name: string };
    district?: { name: string };
    ulb?: { name: string };
    ward?: { wardName: string; wardNo: number };
  }>;
}

interface Jurisdiction {
  id: string;
  name: string;
  code?: string;
}

export function UserManagementPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    role: "",
    jurisdictionType: "",
    stateId: "",
    districtId: "",
    ulbId: "",
    wardId: "",
  });

  // Jurisdiction data
  const [states, setStates] = useState<Jurisdiction[]>([]);
  const [districts, setDistricts] = useState<Jurisdiction[]>([]);
  const [ulbs, setUlbs] = useState<Jurisdiction[]>([]);
  const [wards, setWards] = useState<Jurisdiction[]>([]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (searchQuery) params.append("search", searchQuery);
      if (roleFilter && roleFilter !== "all") params.append("role", roleFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      const result = await response.json();

      if (result.success) {
        setUsers(result.users);
        setPagination((prev) => ({
          ...prev,
          total: result.total,
          totalPages: result.totalPages,
        }));
      } else {
        setError(result.error || "Failed to fetch users");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, roleFilter]);

  const fetchJurisdictions = async (type: string, parentId?: string) => {
    try {
      const params = new URLSearchParams({ type });
      if (parentId) params.append("parentId", parentId);
      const response = await fetch(`/api/admin/jurisdictions?${params}`);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchJurisdictions("states").then(setStates);
  }, []);

  useEffect(() => {
    if (formData.stateId) {
      fetchJurisdictions("districts", formData.stateId).then(setDistricts);
      setFormData((prev) => ({
        ...prev,
        districtId: "",
        ulbId: "",
        wardId: "",
      }));
    }
  }, [formData.stateId]);

  useEffect(() => {
    if (formData.districtId) {
      fetchJurisdictions("ulbs", formData.districtId).then(setUlbs);
      setFormData((prev) => ({ ...prev, ulbId: "", wardId: "" }));
    }
  }, [formData.districtId]);

  useEffect(() => {
    if (formData.ulbId) {
      fetchJurisdictions("wards", formData.ulbId).then(setWards);
      setFormData((prev) => ({ ...prev, wardId: "" }));
    }
  }, [formData.ulbId]);

  const handleCreateUser = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          role: formData.role,
          jurisdiction: formData.jurisdictionType
            ? {
                type: formData.jurisdictionType,
                stateId: formData.stateId || undefined,
                districtId: formData.districtId || undefined,
                ulbId: formData.ulbId || undefined,
                wardId: formData.wardId || undefined,
              }
            : undefined,
        }),
      });
      const result = await response.json();

      if (result.success) {
        setIsCreateDialogOpen(false);
        setFormData({
          name: "",
          phone: "",
          email: "",
          role: "",
          jurisdictionType: "",
          stateId: "",
          districtId: "",
          ulbId: "",
          wardId: "",
        });
        fetchUsers();
      } else {
        alert(result.error || "Failed to create user");
      }
    } catch {
      alert("Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const result = await response.json();
      if (result.success) {
        fetchUsers();
      }
    } catch {
      console.error("Failed to toggle user status");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-rose-100 text-rose-700";
      case "SES":
        return "bg-amber-100 text-amber-700";
      case "RO":
        return "bg-emerald-100 text-emerald-700";
      case "CANDIDATE":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getJurisdictionText = (user: User) => {
    if (!user.jurisdictions?.length) return "—";
    const j = user.jurisdictions[0];
    if (j.ward) return `${j.ward.wardName} (Ward ${j.ward.wardNo})`;
    if (j.ulb) return j.ulb.name;
    if (j.district) return j.district.name;
    if (j.state) return j.state.name;
    return "—";
  };

  if (isLoading && users.length === 0) {
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
          <h1 className="text-xl font-semibold text-slate-800">
            User Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage system users and their roles
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system. A temporary password will be sent
                via SMS.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="10-digit phone number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    <SelectItem value="SES">SEC</SelectItem>
                    <SelectItem value="RO">RO</SelectItem>
                    <SelectItem value="CANDIDATE">Candidate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.role === "RO" || formData.role === "SES") && (
                <>
                  <div className="grid gap-2">
                    <Label>Jurisdiction Type</Label>
                    <Select
                      value={formData.jurisdictionType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, jurisdictionType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select jurisdiction type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STATE">State</SelectItem>
                        <SelectItem value="DISTRICT">District</SelectItem>
                        <SelectItem value="ULB">ULB</SelectItem>
                        <SelectItem value="WARD">Ward</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.jurisdictionType && (
                    <div className="grid gap-2">
                      <Label>State</Label>
                      <Select
                        value={formData.stateId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, stateId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state.id} value={state.id}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.stateId &&
                    ["DISTRICT", "ULB", "WARD"].includes(
                      formData.jurisdictionType,
                    ) && (
                      <div className="grid gap-2">
                        <Label>District</Label>
                        <Select
                          value={formData.districtId}
                          onValueChange={(value) =>
                            setFormData({ ...formData, districtId: value })
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
                    )}

                  {formData.districtId &&
                    ["ULB", "WARD"].includes(formData.jurisdictionType) && (
                      <div className="grid gap-2">
                        <Label>ULB</Label>
                        <Select
                          value={formData.ulbId}
                          onValueChange={(value) =>
                            setFormData({ ...formData, ulbId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select ULB" />
                          </SelectTrigger>
                          <SelectContent>
                            {ulbs.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                  {formData.ulbId && formData.jurisdictionType === "WARD" && (
                    <div className="grid gap-2">
                      <Label>Ward</Label>
                      <Select
                        value={formData.wardId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, wardId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ward" />
                        </SelectTrigger>
                        <SelectContent>
                          {wards.map((w: any) => (
                            <SelectItem key={w.id} value={w.id}>
                              Ward {w.wardNo} - {w.wardName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create User
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
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="SES">SEC</SelectItem>
                <SelectItem value="RO">RO</SelectItem>
                <SelectItem value="CANDIDATE">Candidate</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchUsers}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <AlertTriangle className="h-12 w-12 text-amber-500" />
              <p className="text-slate-600">{error}</p>
              <Button onClick={fetchUsers} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Jurisdiction</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-slate-500"
                    >
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-800">
                            {user.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {user.phone}
                            {user.email && ` • ${user.email}`}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.roles.map((r) => (
                          <Badge
                            key={r.role}
                            className={`text-xs ${getRoleBadgeColor(r.role)}`}
                          >
                            {r.role}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {getJurisdictionText(user)}
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
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
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString()
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
                            <DropdownMenuItem>
                              <UserCog className="h-4 w-4 mr-2" />
                              Manage Roles
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleStatus(user.id, user.isActive)
                              }
                            >
                              {user.isActive ? (
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} users
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

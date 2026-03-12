"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import {
  Users,
  RefreshCw,
  Loader2,
  Search,
  AlertCircle,
  Upload,
  CheckCircle2,
  Pencil,
  Trash2,
  FileSpreadsheet,
} from "lucide-react";

interface VoterRollEntry {
  id: string;
  epicNumber: string;
  fullName: string;
  relationType: string;
  relationName: string;
  postalAddress: string;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  isActive: boolean;
  createdAt: string;
}

const GENDER_LABELS: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

export function VoterRollPanel() {
  const [voters, setVoters] = useState<VoterRollEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
  });

  // Bulk JSON upload
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);

  // CSV import
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    errors: string[];
  } | null>(null);

  // Edit
  const [editEntry, setEditEntry] = useState<VoterRollEntry | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    relation_type: "",
    relation_name: "",
    postal_address: "",
    gender: "" as string,
    is_active: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchVoters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      params.set("page", pagination.page.toString());
      params.set("limit", "20");

      const response = await fetch(`/api/admin/voter-roll?${params}`);
      const result = await response.json();

      if (result.success) {
        setVoters(result.data);
        setPagination((prev) => ({
          ...prev,
          total: result.pagination.total,
          totalPages: result.pagination.pages || result.pagination.totalPages,
        }));
      } else {
        setError(result.error || "Failed to fetch voter roll");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, pagination.page]);

  useEffect(() => {
    fetchVoters();
  }, [fetchVoters]);

  /* ── Bulk JSON Upload ── */
  const handleBulkUpload = async () => {
    setIsUploading(true);
    setUploadResult(null);
    try {
      const parsed = JSON.parse(bulkJson);
      const response = await fetch("/api/admin/voter-roll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voters: Array.isArray(parsed) ? parsed : parsed.voters,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setUploadResult(
          `Successfully uploaded ${result.data?.count ?? result.count} voter records`,
        );
        setBulkJson("");
        fetchVoters();
        setTimeout(() => {
          setIsUploadDialogOpen(false);
          setUploadResult(null);
        }, 2000);
      } else {
        setUploadResult(`Error: ${result.error}`);
      }
    } catch (e) {
      setUploadResult(`Invalid JSON: ${(e as Error).message}`);
    } finally {
      setIsUploading(false);
    }
  };

  /* ── CSV Import ── */
  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/voter-roll/import", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        setImportResult(result.data);
        toast.success(
          `Import complete: ${result.data.created} created, ${result.data.updated} updated`,
        );
        fetchVoters();
      } else {
        toast.error(result.error || "Import failed");
      }
    } catch {
      toast.error("Failed to import CSV");
    } finally {
      setIsImporting(false);
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  };

  /* ── Edit ── */
  const openEdit = (voter: VoterRollEntry) => {
    setEditEntry(voter);
    setEditForm({
      full_name: voter.fullName,
      relation_type: voter.relationType,
      relation_name: voter.relationName,
      postal_address: voter.postalAddress,
      gender: voter.gender ?? "",
      is_active: voter.isActive,
    });
  };

  const handleSaveEdit = async () => {
    if (!editEntry) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/voter-roll/${editEntry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: editForm.full_name,
          relation_type: editForm.relation_type,
          relation_name: editForm.relation_name,
          postal_address: editForm.postal_address,
          gender: editForm.gender || null,
          is_active: editForm.is_active,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Voter record updated");
        setEditEntry(null);
        fetchVoters();
      } else {
        toast.error(result.error || "Update failed");
      }
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/voter-roll/${deleteId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Voter record deleted");
        setDeleteId(null);
        fetchVoters();
      } else {
        toast.error(result.error || "Delete failed");
      }
    } catch {
      toast.error("Failed to delete record");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Voter Roll</h2>
          <p className="text-muted-foreground">
            Manage voter roll / EPIC number database
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchVoters}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {/* hidden CSV input */}
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCsvImport}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={isImporting}
            onClick={() => csvInputRef.current?.click()}
          >
            {isImporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Import CSV
          </Button>
          <Button size="sm" onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk JSON
          </Button>
        </div>
      </div>

      {/* CSV import result */}
      {importResult && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Import complete — <strong>{importResult.created}</strong> created,{" "}
            <strong>{importResult.updated}</strong> updated
            {importResult.errors.length > 0 && (
              <span className="text-destructive">
                , {importResult.errors.length} errors
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Voter Records ({pagination.total})
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by EPIC number or name..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : voters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>
                No voter records found. Use Import CSV or Bulk JSON to add data.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>EPIC Number</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Relation Type</TableHead>
                      <TableHead>Relation Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {voters.map((voter) => (
                      <TableRow key={voter.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {voter.epicNumber}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {voter.fullName}
                        </TableCell>
                        <TableCell>
                          {voter.gender ? (
                            <Badge
                              variant="secondary"
                              className={
                                voter.gender === "MALE"
                                  ? "bg-blue-100 text-blue-800"
                                  : voter.gender === "FEMALE"
                                    ? "bg-pink-100 text-pink-800"
                                    : "bg-gray-100 text-gray-800"
                              }
                            >
                              {GENDER_LABELS[voter.gender]}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{voter.relationType}</TableCell>
                        <TableCell>{voter.relationName}</TableCell>
                        <TableCell className="max-w-[180px] truncate">
                          {voter.postalAddress}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={voter.isActive ? "default" : "secondary"}
                          >
                            {voter.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(voter)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(voter.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages} (
                  {pagination.total} records)
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

      {/* ── Bulk JSON Upload Dialog ── */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Upload Voter Roll</DialogTitle>
            <DialogDescription>
              Paste JSON data with voter records. Fields: epic_number,
              full_name, relation_type, relation_name, postal_address, gender
              (optional: MALE/FEMALE/OTHER).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>JSON Data</Label>
              <Textarea
                placeholder={`[
  {
    "epic_number": "SKM0001001",
    "full_name": "John Doe",
    "relation_type": "Father",
    "relation_name": "Richard Doe",
    "postal_address": "123 Main St",
    "gender": "MALE"
  }
]`}
                className="min-h-[200px] font-mono text-sm"
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
              />
            </div>
            {uploadResult && (
              <Alert
                variant={
                  uploadResult.startsWith("Error") ||
                  uploadResult.startsWith("Invalid")
                    ? "destructive"
                    : "default"
                }
              >
                {uploadResult.startsWith("Success") ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{uploadResult}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkUpload}
              disabled={isUploading || !bulkJson.trim()}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog
        open={!!editEntry}
        onOpenChange={(open) => !open && setEditEntry(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Voter Record</DialogTitle>
            <DialogDescription>
              EPIC:{" "}
              <span className="font-mono font-semibold">
                {editEntry?.epicNumber}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input
                value={editForm.full_name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, full_name: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Relation Type</Label>
                <Input
                  value={editForm.relation_type}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      relation_type: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Relation Name</Label>
                <Input
                  value={editForm.relation_name}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      relation_name: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Postal Address</Label>
              <Textarea
                value={editForm.postal_address}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, postal_address: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Gender</Label>
                <Select
                  value={editForm.gender || "none"}
                  onValueChange={(v) =>
                    setEditForm((f) => ({
                      ...f,
                      gender: v === "none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={editForm.is_active ? "active" : "inactive"}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, is_active: v === "active" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEntry(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete voter record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the record as inactive. It can be restored by
              editing the status back to Active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

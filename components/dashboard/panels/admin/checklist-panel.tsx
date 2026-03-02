"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  RefreshCw,
  ClipboardCheck,
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ChecklistItem {
  id: string;
  electionId: string;
  title: string;
  description?: string;
  category?: string;
  displayOrder: number;
  isRequired: boolean;
  isActive: boolean;
  createdAt: string;
  _count?: {
    responses: number;
  };
}

interface ElectionConfig {
  id: string;
  name: string;
  year: number;
}

const CATEGORIES = [
  "Eligibility",
  "Documents",
  "Legal",
  "Financial",
  "Identity",
  "Other",
];

export function ChecklistPanel() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [electionId, setElectionId] = useState<string | null>(null);
  const [elections, setElections] = useState<ElectionConfig[]>([]);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Eligibility");
  const [isRequired, setIsRequired] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Fetch active election config
  const fetchElectionConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/election-config");
      const result = await response.json();
      if (result.success && result.data) {
        setElectionId(result.data.id);
        setElections([result.data]);
      }
    } catch {
      console.error("Failed to fetch election config");
    }
  }, []);

  // Fetch checklist items
  const fetchItems = useCallback(async () => {
    if (!electionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/elections/${electionId}/checklist-items`,
      );
      const result = await response.json();
      if (result.success) {
        setItems(result.data || []);
      } else {
        setError(result.error || "Failed to fetch checklist items");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    fetchElectionConfig();
  }, [fetchElectionConfig]);

  useEffect(() => {
    if (electionId) {
      fetchItems();
    }
  }, [electionId, fetchItems]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("Eligibility");
    setIsRequired(true);
    setIsActive(true);
  };

  const handleCreate = async () => {
    if (!electionId || !title.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/elections/${electionId}/checklist-items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || undefined,
            category,
            displayOrder: items.length,
            isRequired,
            isActive,
          }),
        },
      );
      const result = await response.json();
      if (result.success) {
        setIsCreateDialogOpen(false);
        resetForm();
        fetchItems();
      } else {
        alert(result.error || "Failed to create checklist item");
      }
    } catch {
      alert("Failed to create checklist item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedItem || !title.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/elections/checklist-items/${selectedItem.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || undefined,
            category,
            isRequired,
            isActive,
          }),
        },
      );
      const result = await response.json();
      if (result.success) {
        setIsEditDialogOpen(false);
        setSelectedItem(null);
        resetForm();
        fetchItems();
      } else {
        alert(result.error || "Failed to update checklist item");
      }
    } catch {
      alert("Failed to update checklist item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/elections/checklist-items/${selectedItem.id}`,
        {
          method: "DELETE",
        },
      );
      const result = await response.json();
      if (result.success) {
        setIsDeleteDialogOpen(false);
        setSelectedItem(null);
        fetchItems();
      } else {
        alert(result.error || "Failed to delete checklist item");
      }
    } catch {
      alert("Failed to delete checklist item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (item: ChecklistItem) => {
    setSelectedItem(item);
    setTitle(item.title);
    setDescription(item.description || "");
    setCategory(item.category || "Eligibility");
    setIsRequired(item.isRequired);
    setIsActive(item.isActive);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (item: ChecklistItem) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
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
            Scrutiny Checklist Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure checklist items for nomination scrutiny process
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchItems}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {items.length}
                </p>
                <p className="text-xs text-slate-500">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {items.filter((i) => i.isActive).length}
                </p>
                <p className="text-xs text-slate-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {items.filter((i) => i.isRequired).length}
                </p>
                <p className="text-xs text-slate-500">Required</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {items.filter((i) => !i.isActive).length}
                </p>
                <p className="text-xs text-slate-500">Disabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checklist Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <AlertTriangle className="h-12 w-12 text-amber-500" />
              <p className="text-slate-600">{error}</p>
              <Button onClick={fetchItems} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Order</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responses</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-slate-500"
                    >
                      No checklist items configured. Click &quot;Add Item&quot;
                      to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  items
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <GripVertical className="h-4 w-4 text-slate-300" />
                            <span className="text-sm text-slate-500">
                              {item.displayOrder + 1}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-800">
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {item.category || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.isRequired ? (
                            <Badge className="bg-amber-100 text-amber-700 text-xs">
                              Required
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Optional
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.isActive ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-500 text-xs">
                              Disabled
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {item._count?.responses || 0}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => openDeleteDialog(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Checklist Item</DialogTitle>
            <DialogDescription>
              Create a new scrutiny checklist item for the election.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Age eligibility verified (Min. 21 years)"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Required for Approval</Label>
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Checklist Item</DialogTitle>
            <DialogDescription>
              Modify the checklist item details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Required for Approval</Label>
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Checklist Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedItem?.title}&quot;?
              {(selectedItem?._count?.responses || 0) > 0 && (
                <>
                  <br />
                  <br />
                  This item has {selectedItem?._count?.responses} response(s).
                  It will be deactivated instead of deleted.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

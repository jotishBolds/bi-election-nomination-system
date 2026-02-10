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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  Users,
  RefreshCw,
  Loader2,
  Search,
  AlertCircle,
  Upload,
  CheckCircle2,
} from "lucide-react";

interface VoterRollEntry {
  id: string;
  epicNumber: string;
  fullName: string;
  relationType: string;
  relationName: string;
  postalAddress: string;
  createdAt: string;
}

export function VoterRollPanel() {
  const [voters, setVoters] = useState<VoterRollEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
  });

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
        setUploadResult(`Successfully uploaded ${result.count} voter records`);
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
          <Button size="sm" onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
        </div>
      </div>

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
              <p>No voter records found. Use Bulk Upload to add voter data.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>EPIC Number</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Relation Type</TableHead>
                      <TableHead>Relation Name</TableHead>
                      <TableHead>Address</TableHead>
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
                        <TableCell>{voter.relationType}</TableCell>
                        <TableCell>{voter.relationName}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {voter.postalAddress}
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

      {/* Bulk Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Upload Voter Roll</DialogTitle>
            <DialogDescription>
              Paste JSON data with voter records. Format: array of objects with
              epic_number, full_name, relation_type, relation_name,
              postal_address.
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
    "postal_address": "123 Main St"
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
    </div>
  );
}

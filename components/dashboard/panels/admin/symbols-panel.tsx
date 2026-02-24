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
import Image from "next/image";

import {
  Vote,
  RefreshCw,
  Loader2,
  Search,
  AlertCircle,
  Upload,
} from "lucide-react";

interface ElectionSymbol {
  id: string;
  name: string;
  imagePath: string;
  displayOrder: number;
  isReserved: boolean;
  isActive: boolean;
  createdAt: string;
}

export function SymbolsPanel() {
  const [symbols, setSymbols] = useState<ElectionSymbol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchSymbols = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      params.set("limit", "200");

      const response = await fetch(`/api/admin/symbols?${params}`);
      const result = await response.json();

      if (result.success) {
        setSymbols(result.data);
      } else {
        setError(result.error || "Failed to fetch symbols");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchSymbols();
  }, [fetchSymbols]);

  const handleSeedSymbols = async () => {
    setIsSeeding(true);
    try {
      const response = await fetch("/api/admin/symbols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedFromPublic: true }),
      });
      const result = await response.json();
      if (result.success) {
        fetchSymbols();
      } else {
        setError(result.error || "Failed to seed symbols");
      }
    } catch {
      setError("Failed to seed symbols");
    } finally {
      setIsSeeding(false);
    }
  };

  const toggleSymbolStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/symbols/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const result = await response.json();
      if (result.success) {
        setSymbols((prev) =>
          prev.map((s) => (s.id === id ? { ...s, isActive: !isActive } : s)),
        );
      }
    } catch {
      setError("Failed to update symbol");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Election Symbols
          </h2>
          <p className="text-muted-foreground">
            Manage election symbols for independent candidates
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSymbols}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleSeedSymbols} disabled={isSeeding}>
            {isSeeding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Seed from Public
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
            <Vote className="h-5 w-5" />
            Symbols ({symbols.length})
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search symbols..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : symbols.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Vote className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>
                No symbols found. Click &quot;Seed from Public&quot; to load
                symbols.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {symbols.map((symbol) => (
                    <TableRow key={symbol.id}>
                      <TableCell>
                        <div className="relative w-10 h-10 border rounded bg-white">
                          <Image
                            src={symbol.imagePath}
                            alt={symbol.name}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {symbol.name}
                      </TableCell>
                      <TableCell>{symbol.displayOrder}</TableCell>
                      <TableCell>
                        <Badge
                          variant={symbol.isActive ? "default" : "secondary"}
                        >
                          {symbol.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {symbol.isReserved ? (
                          <Badge variant="destructive">Reserved</Badge>
                        ) : (
                          <Badge variant="outline">Available</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleSymbolStatus(symbol.id, symbol.isActive)
                          }
                        >
                          {symbol.isActive ? "Disable" : "Enable"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

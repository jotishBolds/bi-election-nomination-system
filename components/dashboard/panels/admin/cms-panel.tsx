"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ScrollText,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
  Vote,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Types for CMS content
interface PoliticalParty {
  id: string;
  name: string;
  abbreviation: string;
  isRecognized: boolean;
  isNational: boolean;
  isState: boolean;
  isActive: boolean;
  symbol?: {
    id: string;
    name: string;
    imagePath: string;
  };
}

interface ElectionSymbol {
  id: string;
  name: string;
  imagePath: string;
  isReserved: boolean;
  isActive: boolean;
  displayOrder: number;
}

export function CMSPanel() {
  const [activeTab, setActiveTab] = useState("parties");
  const [parties, setParties] = useState<PoliticalParty[]>([]);
  const [symbols, setSymbols] = useState<ElectionSymbol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [isPartyDialogOpen, setIsPartyDialogOpen] = useState(false);
  const [isSymbolDialogOpen, setIsSymbolDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingParty, setEditingParty] = useState<PoliticalParty | null>(null);
  const [editingSymbol, setEditingSymbol] = useState<ElectionSymbol | null>(
    null,
  );

  // Form states
  const [partyForm, setPartyForm] = useState({
    name: "",
    abbreviation: "",
    isRecognized: false,
    isNational: false,
    isState: false,
    symbolId: "",
  });

  const [symbolForm, setSymbolForm] = useState({
    name: "",
    imagePath: "",
    isReserved: false,
    displayOrder: 0,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [partiesRes, symbolsRes] = await Promise.all([
        fetch("/api/admin/cms/parties"),
        fetch("/api/admin/cms/symbols"),
      ]);

      const partiesData = await partiesRes.json();
      const symbolsData = await symbolsRes.json();

      if (partiesData.success) setParties(partiesData.data);
      if (symbolsData.success) setSymbols(symbolsData.data);
    } catch {
      setError("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveParty = async () => {
    setIsSubmitting(true);
    try {
      const url = editingParty
        ? `/api/admin/cms/parties/${editingParty.id}`
        : "/api/admin/cms/parties";
      const method = editingParty ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partyForm),
      });

      const result = await response.json();
      if (result.success) {
        setIsPartyDialogOpen(false);
        resetPartyForm();
        fetchData();
      } else {
        alert(result.error || "Failed to save party");
      }
    } catch {
      alert("Failed to save party");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSymbol = async () => {
    setIsSubmitting(true);
    try {
      const url = editingSymbol
        ? `/api/admin/cms/symbols/${editingSymbol.id}`
        : "/api/admin/cms/symbols";
      const method = editingSymbol ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(symbolForm),
      });

      const result = await response.json();
      if (result.success) {
        setIsSymbolDialogOpen(false);
        resetSymbolForm();
        fetchData();
      } else {
        alert(result.error || "Failed to save symbol");
      }
    } catch {
      alert("Failed to save symbol");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteParty = async (id: string) => {
    if (!confirm("Are you sure you want to delete this party?")) return;
    try {
      const response = await fetch(`/api/admin/cms/parties/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        fetchData();
      }
    } catch {
      alert("Failed to delete party");
    }
  };

  const handleDeleteSymbol = async (id: string) => {
    if (!confirm("Are you sure you want to delete this symbol?")) return;
    try {
      const response = await fetch(`/api/admin/cms/symbols/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        fetchData();
      }
    } catch {
      alert("Failed to delete symbol");
    }
  };

  const handleTogglePartyStatus = async (party: PoliticalParty) => {
    try {
      const response = await fetch(`/api/admin/cms/parties/${party.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !party.isActive }),
      });
      const result = await response.json();
      if (result.success) {
        fetchData();
      }
    } catch {
      alert("Failed to toggle status");
    }
  };

  const resetPartyForm = () => {
    setPartyForm({
      name: "",
      abbreviation: "",
      isRecognized: false,
      isNational: false,
      isState: false,
      symbolId: "",
    });
    setEditingParty(null);
  };

  const resetSymbolForm = () => {
    setSymbolForm({
      name: "",
      imagePath: "",
      isReserved: false,
      displayOrder: 0,
    });
    setEditingSymbol(null);
  };

  const openEditParty = (party: PoliticalParty) => {
    setEditingParty(party);
    setPartyForm({
      name: party.name,
      abbreviation: party.abbreviation,
      isRecognized: party.isRecognized,
      isNational: party.isNational,
      isState: party.isState,
      symbolId: party.symbol?.id || "",
    });
    setIsPartyDialogOpen(true);
  };

  const openEditSymbol = (symbol: ElectionSymbol) => {
    setEditingSymbol(symbol);
    setSymbolForm({
      name: symbol.name,
      imagePath: symbol.imagePath,
      isReserved: symbol.isReserved,
      displayOrder: symbol.displayOrder,
    });
    setIsSymbolDialogOpen(true);
  };

  const filteredParties = parties.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredSymbols = symbols.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
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
          <h1 className="text-xl font-semibold text-slate-800">
            Content Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage parties, symbols, and election content
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchData}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="parties" className="flex items-center gap-2">
            <Vote className="h-4 w-4" />
            Political Parties
          </TabsTrigger>
          <TabsTrigger value="symbols" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Election Symbols
          </TabsTrigger>
        </TabsList>

        {/* Political Parties Tab */}
        <TabsContent value="parties" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search parties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Dialog
                  open={isPartyDialogOpen}
                  onOpenChange={(open) => {
                    setIsPartyDialogOpen(open);
                    if (!open) resetPartyForm();
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Party
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingParty ? "Edit Party" : "Add New Party"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingParty
                          ? "Update political party details"
                          : "Add a new political party to the system"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Party Name *</Label>
                        <Input
                          value={partyForm.name}
                          onChange={(e) =>
                            setPartyForm({ ...partyForm, name: e.target.value })
                          }
                          placeholder="e.g., Bharatiya Janata Party"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Abbreviation *</Label>
                        <Input
                          value={partyForm.abbreviation}
                          onChange={(e) =>
                            setPartyForm({
                              ...partyForm,
                              abbreviation: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder="e.g., BJP"
                          maxLength={10}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Election Symbol</Label>
                        <select
                          value={partyForm.symbolId}
                          onChange={(e) =>
                            setPartyForm({
                              ...partyForm,
                              symbolId: e.target.value,
                            })
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select symbol</option>
                          {symbols
                            .filter(
                              (s) =>
                                !s.isReserved || s.id === partyForm.symbolId,
                            )
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="isRecognized"
                            checked={partyForm.isRecognized}
                            onChange={(e) =>
                              setPartyForm({
                                ...partyForm,
                                isRecognized: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                          <Label htmlFor="isRecognized" className="text-sm">
                            Recognized
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="isNational"
                            checked={partyForm.isNational}
                            onChange={(e) =>
                              setPartyForm({
                                ...partyForm,
                                isNational: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                          <Label htmlFor="isNational" className="text-sm">
                            National
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="isState"
                            checked={partyForm.isState}
                            onChange={(e) =>
                              setPartyForm({
                                ...partyForm,
                                isState: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                          <Label htmlFor="isState" className="text-sm">
                            State
                          </Label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsPartyDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveParty} disabled={isSubmitting}>
                        {isSubmitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {editingParty ? "Save Changes" : "Add Party"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Party</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParties.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-slate-500"
                      >
                        No parties found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredParties.map((party) => (
                      <TableRow key={party.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-800">
                              {party.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {party.abbreviation}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {party.symbol ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={party.symbol.imagePath}
                                alt={party.symbol.name}
                                className="h-8 w-8 object-contain"
                              />
                              <span className="text-sm text-slate-600">
                                {party.symbol.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {party.isRecognized && (
                              <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                                Recognized
                              </Badge>
                            )}
                            {party.isNational && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">
                                National
                              </Badge>
                            )}
                            {party.isState && (
                              <Badge className="bg-purple-100 text-purple-700 text-xs">
                                State
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              party.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }
                          >
                            {party.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openEditParty(party)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleTogglePartyStatus(party)}
                              >
                                {party.isActive ? (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteParty(party.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Election Symbols Tab */}
        <TabsContent value="symbols" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search symbols..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Dialog
                  open={isSymbolDialogOpen}
                  onOpenChange={(open) => {
                    setIsSymbolDialogOpen(open);
                    if (!open) resetSymbolForm();
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Symbol
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingSymbol ? "Edit Symbol" : "Add New Symbol"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingSymbol
                          ? "Update election symbol details"
                          : "Add a new election symbol"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Symbol Name *</Label>
                        <Input
                          value={symbolForm.name}
                          onChange={(e) =>
                            setSymbolForm({
                              ...symbolForm,
                              name: e.target.value,
                            })
                          }
                          placeholder="e.g., Lotus"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Image Path *</Label>
                        <Input
                          value={symbolForm.imagePath}
                          onChange={(e) =>
                            setSymbolForm({
                              ...symbolForm,
                              imagePath: e.target.value,
                            })
                          }
                          placeholder="/election-symbols/lotus.png"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Display Order</Label>
                        <Input
                          type="number"
                          value={symbolForm.displayOrder}
                          onChange={(e) =>
                            setSymbolForm({
                              ...symbolForm,
                              displayOrder: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isReserved"
                          checked={symbolForm.isReserved}
                          onChange={(e) =>
                            setSymbolForm({
                              ...symbolForm,
                              isReserved: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        <Label htmlFor="isReserved" className="text-sm">
                          Reserved for recognized party
                        </Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsSymbolDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveSymbol}
                        disabled={isSubmitting}
                      >
                        {isSubmitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {editingSymbol ? "Save Changes" : "Add Symbol"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredSymbols.length === 0 ? (
                  <p className="col-span-full text-center py-8 text-slate-500">
                    No symbols found
                  </p>
                ) : (
                  filteredSymbols.map((symbol) => (
                    <div
                      key={symbol.id}
                      className="relative group p-4 rounded-lg border bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openEditSymbol(symbol)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteSymbol(symbol.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex flex-col items-center">
                        <img
                          src={symbol.imagePath}
                          alt={symbol.name}
                          className="h-16 w-16 object-contain mb-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/placeholder-symbol.png";
                          }}
                        />
                        <p className="text-sm font-medium text-slate-800 text-center">
                          {symbol.name}
                        </p>
                        {symbol.isReserved && (
                          <Badge className="mt-1 bg-amber-100 text-amber-700 text-xs">
                            Reserved
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

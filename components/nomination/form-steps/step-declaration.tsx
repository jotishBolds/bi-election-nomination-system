// components/nomination/form-steps/step-declaration.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import {
  ArrowLeft,
  ArrowRight,
  FileSignature,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useNomination } from "@/app/context/nomination-context";
import { useNominationSubmission } from "@/app/context/nomination-submission-context";

// Types for API responses
interface PoliticalParty {
  id: string;
  name: string;
  shortName: string;
  symbol: string;
  symbolImage: string | null;
}

interface ElectionSymbol {
  id: string;
  name: string;
  imagePath: string;
}

const schema = z.object({
  politicalPartyId: z.string().min(1, "Political party is required"),
  symbolPreference1: z.string().min(1, "1st symbol preference is required"),
  symbolPreference2: z.string().optional(),
  symbolPreference3: z.string().optional(),
});

interface StepDeclarationProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepDeclaration({ onNext, onBack }: StepDeclarationProps) {
  const { formData, updateFormData } = useNomination();
  const { submissionData } = useNominationSubmission();

  // State for API data
  const [politicalParties, setPoliticalParties] = useState<PoliticalParty[]>(
    [],
  );
  const [allSymbols, setAllSymbols] = useState<ElectionSymbol[]>([]);
  const [isLoadingParties, setIsLoadingParties] = useState(true);
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Symbol preferences state
  const [pref1, setPref1] = useState<ElectionSymbol | null>(null);
  const [pref2, setPref2] = useState<ElectionSymbol | null>(null);
  const [pref3, setPref3] = useState<ElectionSymbol | null>(null);
  const [selectingPref, setSelectingPref] = useState<1 | 2 | 3>(1);

  // Check if party symbol is locked (for subsequent submissions)
  const isPartyLocked = submissionData.submissionCount > 0;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      politicalPartyId: formData.politicalPartyId || "",
      symbolPreference1: formData.symbolPreference1 || "",
      symbolPreference2: formData.symbolPreference2 || "",
      symbolPreference3: formData.symbolPreference3 || "",
    },
  });

  // Update form when formData changes (for pre-filling on updates)
  useEffect(() => {
    if (formData.politicalPartyId) {
      console.log("Updating declaration form with formData:", formData);
      form.reset({
        politicalPartyId: formData.politicalPartyId || "",
        symbolPreference1: formData.symbolPreference1 || "",
        symbolPreference2: formData.symbolPreference2 || "",
        symbolPreference3: formData.symbolPreference3 || "",
      });
    }
  }, [formData, form]);

  const selectedPartyId = form.watch("politicalPartyId");

  // Fetch parties on mount
  useEffect(() => {
    const fetchParties = async () => {
      try {
        setIsLoadingParties(true);
        const response = await fetch("/api/election/parties");
        const data = await response.json();
        if (data.success) {
          const partiesWithIndependent: PoliticalParty[] = [
            ...data.data.parties,
            {
              id: "independent",
              name: "Independent",
              shortName: "IND",
              symbol: "Independent",
              symbolImage: null,
            },
          ];
          setPoliticalParties(partiesWithIndependent);
        } else {
          setError("Failed to load parties. Please refresh the page.");
        }
      } catch (err) {
        console.error("Failed to fetch parties:", err);
        setError("Failed to load parties. Please refresh the page.");
      } finally {
        setIsLoadingParties(false);
      }
    };
    fetchParties();
  }, []);

  // Fetch ALL election symbols for independent candidates
  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        setIsLoadingSymbols(true);
        const response = await fetch("/api/election/symbols");
        const data = await response.json();
        if (data.success) {
          setAllSymbols(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch symbols:", err);
      } finally {
        setIsLoadingSymbols(false);
      }
    };
    fetchSymbols();
  }, []);

  // Restore previously selected preferences from formData
  useEffect(() => {
    if (allSymbols.length === 0) return;
    if (formData.symbolPreference1) {
      const s1 = allSymbols.find((s) => s.name === formData.symbolPreference1);
      if (s1) setPref1(s1);
    }
    if (formData.symbolPreference2) {
      const s2 = allSymbols.find((s) => s.name === formData.symbolPreference2);
      if (s2) setPref2(s2);
    }
    if (formData.symbolPreference3) {
      const s3 = allSymbols.find((s) => s.name === formData.symbolPreference3);
      if (s3) setPref3(s3);
    }
  }, [
    allSymbols,
    formData.symbolPreference1,
    formData.symbolPreference2,
    formData.symbolPreference3,
  ]);

  // Handle symbol selection
  const handleSymbolClick = (symbol: ElectionSymbol) => {
    if (isPartyLocked) return;

    // Check if already selected in any preference
    const isAlreadyPref1 = pref1?.id === symbol.id;
    const isAlreadyPref2 = pref2?.id === symbol.id;
    const isAlreadyPref3 = pref3?.id === symbol.id;

    // If clicking on an already-selected symbol, remove it
    if (isAlreadyPref1) {
      setPref1(null);
      form.setValue("symbolPreference1", "");
      return;
    }
    if (isAlreadyPref2) {
      setPref2(null);
      form.setValue("symbolPreference2", "");
      return;
    }
    if (isAlreadyPref3) {
      setPref3(null);
      form.setValue("symbolPreference3", "");
      return;
    }

    // Assign to the currently selecting preference slot
    if (selectingPref === 1) {
      setPref1(symbol);
      form.setValue("symbolPreference1", symbol.name);
      setSelectingPref(2);
    } else if (selectingPref === 2) {
      setPref2(symbol);
      form.setValue("symbolPreference2", symbol.name);
      setSelectingPref(3);
    } else if (selectingPref === 3) {
      setPref3(symbol);
      form.setValue("symbolPreference3", symbol.name);
      setSelectingPref(1);
    }
  };

  // Get preference badge for a symbol
  const getSymbolPref = (symbolId: string): number | null => {
    if (pref1?.id === symbolId) return 1;
    if (pref2?.id === symbolId) return 2;
    if (pref3?.id === symbolId) return 3;
    return null;
  };

  const onSubmit = (data: z.infer<typeof schema>) => {
    const party = politicalParties.find((p) => p.id === data.politicalPartyId);
    const isIndependent = data.politicalPartyId === "independent";

    updateFormData({
      dateOfBirth: "",
      age: "",
      politicalPartyId: data.politicalPartyId,
      politicalParty: party?.name || "Independent",
      partySymbol: isIndependent ? pref1?.name || "" : party?.symbol || "",
      partySymbolImage: isIndependent
        ? pref1?.imagePath || ""
        : party?.symbolImage || "",
      symbolPreference1: pref1?.name || data.symbolPreference1 || "",
      symbolPreference2: pref2?.name || "",
      symbolPreference3: pref3?.name || "",
      shuffleCount: 0,
      shuffledSymbols: [],
    });
    onNext();
  };

  const isIndependent = selectedPartyId === "independent";

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Declaration Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Political Party Selection */}
              <FormField
                control={form.control}
                name="politicalPartyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Political Party *</FormLabel>
                    {isLoadingParties ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isPartyLocked}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select political party" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {politicalParties.map((party) => (
                            <SelectItem key={party.id} value={party.id}>
                              <div className="flex items-center gap-2">
                                <span>
                                  {party.name} ({party.shortName})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                    {isPartyLocked && (
                      <p className="text-xs text-amber-600 mt-1">
                        Party and symbol are locked from your first submission
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {/* Party Symbol Display (non-independent) */}
              {selectedPartyId && !isIndependent && (
                <div className="space-y-2">
                  <FormLabel>Party Symbol</FormLabel>
                  {(() => {
                    const party = politicalParties.find(
                      (p) => p.id === selectedPartyId,
                    );
                    return party?.symbolImage ? (
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center gap-4">
                          <div className="relative w-20 h-20 border rounded-lg bg-white p-2">
                            <Image
                              src={party.symbolImage}
                              alt={party.symbol}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{party.symbol}</p>
                            <Badge variant="secondary">Party Symbol</Badge>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Independent Symbol Selection - New Design */}
              {isIndependent && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="symbolPreference1"
                    render={() => (
                      <FormItem>
                        <FormLabel>Symbol Preferences *</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Select up to <strong>3 symbol preferences</strong> in
                      order. Click on a symbol to assign it as your 1st, 2nd, or
                      3rd preference. Click a selected symbol again to deselect
                      it.
                    </AlertDescription>
                  </Alert>

                  {/* Selected Preferences Display */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { label: "1st Preference", pref: pref1, num: 1 },
                      { label: "2nd Preference", pref: pref2, num: 2 },
                      { label: "3rd Preference", pref: pref3, num: 3 },
                    ].map(({ label, pref, num }) => (
                      <div
                        key={num}
                        className={cn(
                          "p-3 border-2 rounded-lg text-center transition-all",
                          isPartyLocked
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer",
                          selectingPref === num && !isPartyLocked
                            ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                            : pref
                              ? "border-green-500 bg-green-50"
                              : "border-dashed border-muted-foreground/30",
                        )}
                        onClick={() =>
                          !isPartyLocked && setSelectingPref(num as 1 | 2 | 3)
                        }
                      >
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {label}
                        </p>
                        {pref ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="relative w-12 h-12">
                              <Image
                                src={pref.imagePath}
                                alt={pref.name}
                                fill
                                className="object-contain"
                              />
                            </div>
                            <p className="text-xs font-medium truncate w-full">
                              {pref.name}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground py-4">
                            {selectingPref === num
                              ? "Click a symbol below..."
                              : "Not selected"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* All Symbols Grid in ScrollArea */}
                  {isLoadingSymbols ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading symbols...
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] border rounded-lg p-4">
                      <div
                        className={cn(
                          "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3",
                          isPartyLocked && "opacity-60 pointer-events-none",
                        )}
                      >
                        {allSymbols.map((symbol) => {
                          const prefNum = getSymbolPref(symbol.id);
                          return (
                            <motion.div
                              key={symbol.id}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={cn(
                                "relative p-2 border-2 rounded-lg cursor-pointer transition-all",
                                prefNum === 1
                                  ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                                  : prefNum === 2
                                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-300"
                                    : prefNum === 3
                                      ? "border-amber-500 bg-amber-50 ring-2 ring-amber-300"
                                      : "border-muted hover:border-primary/50 hover:bg-muted/50",
                              )}
                              onClick={() => handleSymbolClick(symbol)}
                            >
                              <div className="relative w-full aspect-square mb-1">
                                <Image
                                  src={symbol.imagePath}
                                  alt={symbol.name}
                                  fill
                                  className="object-contain p-1"
                                />
                              </div>
                              <p className="text-[10px] text-center font-medium truncate">
                                {symbol.name}
                              </p>
                              {prefNum && (
                                <div className="absolute -top-2 -right-2">
                                  <Badge
                                    variant={
                                      prefNum === 1
                                        ? "default"
                                        : prefNum === 2
                                          ? "secondary"
                                          : "outline"
                                    }
                                    className={cn(
                                      "h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full",
                                      prefNum === 1 && "bg-primary text-white",
                                      prefNum === 2 && "bg-blue-500 text-white",
                                      prefNum === 3 &&
                                        "bg-amber-500 text-white",
                                    )}
                                  >
                                    {prefNum}
                                  </Badge>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    Showing all {allSymbols.length} available symbols. Select
                    your 1st, 2nd, and 3rd preferences.
                  </p>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={onBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover"
                  disabled={isLoadingParties}
                >
                  Preview Form
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

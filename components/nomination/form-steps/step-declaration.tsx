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
  FormDescription,
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
import { cn } from "@/lib/utils";

import {
  ArrowLeft,
  ArrowRight,
  FileSignature,
  Shuffle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useNomination } from "@/app/context/nomination-context";
import { useNominationSubmission } from "@/app/context/nomination-submission-context";
import {
  politicalParties,
  independentSymbols,
  getRandomSymbols,
  IndependentSymbol,
} from "@/lib/election-data";

const schema = z
  .object({
    politicalPartyId: z.string().min(1, "Political party is required"),
    symbolPreference1: z.string().min(1, "First symbol preference is required"),
    symbolPreference2: z
      .string()
      .min(1, "Second symbol preference is required"),
    symbolPreference3: z.string().min(1, "Third symbol preference is required"),
    casteTribeName: z.string().optional(),
  })
  .refine(
    (data) => {
      // Check if all three symbols are unique for independent candidates
      if (data.politicalPartyId === "independent") {
        const symbols = [
          data.symbolPreference1,
          data.symbolPreference2,
          data.symbolPreference3,
        ];
        const uniqueSymbols = new Set(symbols);
        return uniqueSymbols.size === 3;
      }
      return true;
    },
    {
      message: "All three symbol preferences must be different",
      path: ["symbolPreference3"],
    },
  );

interface StepDeclarationProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepDeclaration({ onNext, onBack }: StepDeclarationProps) {
  const { formData, updateFormData } = useNomination();
  const { submissionData } = useNominationSubmission();
  const [shuffleCount, setShuffleCount] = useState(formData.shuffleCount || 0);
  const [selectedSymbols, setSelectedSymbols] = useState<{
    pref1: IndependentSymbol | null;
    pref2: IndependentSymbol | null;
    pref3: IndependentSymbol | null;
  }>({
    pref1: null,
    pref2: null,
    pref3: null,
  });

  const [shuffledSymbols, setShuffledSymbols] = useState<IndependentSymbol[]>(
    formData.shuffledSymbols || [],
  );
  const [isShuffleDisabled, setIsShuffleDisabled] = useState(
    formData.shuffleCount >= 3,
  );

  // Check if party symbol is locked (for subsequent submissions)
  const isPartyLocked = submissionData.submissionCount > 0;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      politicalPartyId: formData.politicalPartyId || "",
      symbolPreference1: formData.symbolPreference1 || "",
      symbolPreference2: formData.symbolPreference2 || "",
      symbolPreference3: formData.symbolPreference3 || "",
      casteTribeName: formData.casteTribeName || "",
    },
  });

  const selectedPartyId = form.watch("politicalPartyId");
  const watchCategory = formData.category;

  // Handle party change
  useEffect(() => {
    if (isPartyLocked) {
      // For subsequent submissions, use locked party data
      if (submissionData.lockedPoliticalPartyId === "independent") {
        if (formData.shuffledSymbols && formData.shuffledSymbols.length > 0) {
          setShuffledSymbols(formData.shuffledSymbols);
          setShuffleCount(
            formData.shuffleCount || formData.shuffledSymbols.length,
          );

          // Restore selected symbols
          const pref1 = formData.shuffledSymbols.find(
            (s) => s.name === formData.symbolPreference1,
          );
          const pref2 = formData.shuffledSymbols.find(
            (s) => s.name === formData.symbolPreference2,
          );
          const pref3 = formData.shuffledSymbols.find(
            (s) => s.name === formData.symbolPreference3,
          );

          setSelectedSymbols({
            pref1: pref1 || null,
            pref2: pref2 || null,
            pref3: pref3 || null,
          });
        }
        form.setValue("politicalPartyId", "independent");
      } else {
        const party = politicalParties.find(
          (p) => p.id === submissionData.lockedPoliticalPartyId,
        );
        if (party) {
          const partySymbol = {
            id: party.id,
            name: party.symbol,
            image: party.symbolImage,
          };
          setSelectedSymbols({
            pref1: partySymbol,
            pref2: partySymbol,
            pref3: partySymbol,
          });
          form.setValue(
            "politicalPartyId",
            submissionData.lockedPoliticalPartyId,
          );
          form.setValue("symbolPreference1", party.symbol);
          form.setValue("symbolPreference2", party.symbol);
          form.setValue("symbolPreference3", party.symbol);
        }
      }
      setIsShuffleDisabled(true);
      return;
    }

    if (selectedPartyId === "independent") {
      if (formData.shuffledSymbols && formData.shuffledSymbols.length > 0) {
        setShuffledSymbols(formData.shuffledSymbols);
        setShuffleCount(
          formData.shuffleCount || formData.shuffledSymbols.length,
        );
        setIsShuffleDisabled(formData.shuffleCount >= 3);
      } else {
        setSelectedSymbols({ pref1: null, pref2: null, pref3: null });
        setShuffledSymbols([]);
        const randomSymbols = getRandomSymbols(3);
        setShuffledSymbols(randomSymbols);
        setShuffleCount(1);
      }
    } else if (selectedPartyId) {
      const party = politicalParties.find((p) => p.id === selectedPartyId);
      if (party && party.symbolImage) {
        const partySymbol = {
          id: party.id,
          name: party.symbol,
          image: party.symbolImage,
        };
        setSelectedSymbols({
          pref1: partySymbol,
          pref2: partySymbol,
          pref3: partySymbol,
        });
        form.setValue("symbolPreference1", party.symbol);
        form.setValue("symbolPreference2", party.symbol);
        form.setValue("symbolPreference3", party.symbol);
        setShuffleCount(0);
        setShuffledSymbols([]);
        setIsShuffleDisabled(false);
      }
    }
  }, [
    selectedPartyId,
    form,
    isPartyLocked,
    submissionData,
    formData.shuffledSymbols,
    formData.shuffleCount,
    formData.symbolPreference1,
    formData.symbolPreference2,
    formData.symbolPreference3,
  ]);

  // Handle shuffle for independent candidates
  const handleShuffle = () => {
    if (shuffleCount >= 3) return;

    const usedIds = shuffledSymbols.map((s) => s.id);
    const availableSymbols = independentSymbols.filter(
      (symbol) => !usedIds.includes(symbol.id),
    );

    if (availableSymbols.length === 0) return;

    const randomIndex = Math.floor(Math.random() * availableSymbols.length);
    const newSymbol = availableSymbols[randomIndex];

    const updatedShuffledSymbols = [...shuffledSymbols, newSymbol];
    setShuffledSymbols(updatedShuffledSymbols);
    setShuffleCount((prev) => prev + 1);

    if (shuffleCount + 1 >= 3) {
      setIsShuffleDisabled(true);
    }
  };

  // Handle symbol selection for each preference
  const handleSymbolSelect = (
    symbol: IndependentSymbol,
    preference: "pref1" | "pref2" | "pref3",
  ) => {
    if (isPartyLocked) return;

    setSelectedSymbols((prev) => ({
      ...prev,
      [preference]: symbol,
    }));

    const formField =
      preference === "pref1"
        ? "symbolPreference1"
        : preference === "pref2"
          ? "symbolPreference2"
          : "symbolPreference3";
    form.setValue(formField, symbol.name);
  };

  const onSubmit = (data: z.infer<typeof schema>) => {
    const party = politicalParties.find((p) => p.id === data.politicalPartyId);
    updateFormData({
      age: "18", // Hardcoded age
      politicalPartyId: data.politicalPartyId,
      politicalParty: party?.name || "Independent",
      partySymbol: selectedSymbols.pref1?.name || "",
      partySymbolImage: selectedSymbols.pref1?.image || "",
      symbolPreference1: data.symbolPreference1,
      symbolPreference2: data.symbolPreference2,
      symbolPreference3: data.symbolPreference3,
      casteTribeName: data.casteTribeName || "",
      shuffleCount: shuffleCount,
      shuffledSymbols: shuffledSymbols,
    });
    onNext();
  };

  const isIndependent = selectedPartyId === "independent";

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
                    <FormMessage />
                    {isPartyLocked && (
                      <p className="text-xs text-amber-600 mt-1">
                        Party and symbols are locked from your first submission
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {/* Symbol Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Symbol Preferences (In Order) *</FormLabel>
                  {isIndependent && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleShuffle}
                      disabled={
                        isShuffleDisabled || shuffleCount >= 3 || isPartyLocked
                      }
                    >
                      <Shuffle className="mr-2 h-4 w-4" />
                      {shuffleCount >= 3
                        ? "All Symbols Revealed"
                        : `Reveal More (${3 - shuffleCount} left)`}
                    </Button>
                  )}
                </div>

                {/* Party Symbol Display (SKM/SDF) */}
                {selectedPartyId &&
                  !isIndependent &&
                  selectedSymbols.pref1?.image && (
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-2">
                        Party Symbol (All Preferences)
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 border rounded-lg bg-white p-2">
                          <Image
                            src={selectedSymbols.pref1.image}
                            alt={selectedSymbols.pref1.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <div>
                          <p className="font-medium">
                            {selectedSymbols.pref1.name}
                          </p>
                          <Badge variant="secondary">Party Symbol</Badge>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Independent Symbol Selection */}
                {isIndependent && (
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Independent candidates must select{" "}
                        <strong>3 different symbols</strong> in order of
                        preference. Shuffle to reveal up to 3 sets of symbols,
                        then select one from each set.
                      </AlertDescription>
                    </Alert>

                    {shuffledSymbols.length > 0 && (
                      <div className="space-y-6">
                        {/* First Preference */}
                        <div className="space-y-3">
                          <FormField
                            control={form.control}
                            name="symbolPreference1"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Preference *</FormLabel>
                                <FormControl>
                                  <Input {...field} className="hidden" />
                                </FormControl>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  {shuffledSymbols
                                    .slice(
                                      0,
                                      Math.min(shuffledSymbols.length, 3),
                                    )
                                    .map((symbol) => (
                                      <motion.div
                                        key={symbol.id}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={cn(
                                          "relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md",
                                          selectedSymbols.pref1?.id ===
                                            symbol.id
                                            ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                                            : "border-muted hover:border-primary/50",
                                        )}
                                        onClick={() =>
                                          handleSymbolSelect(symbol, "pref1")
                                        }
                                      >
                                        <div className="relative w-full aspect-square mb-3">
                                          <Image
                                            src={symbol.image}
                                            alt={symbol.name}
                                            fill
                                            className="object-contain"
                                          />
                                        </div>
                                        <p className="text-sm text-center font-medium">
                                          {symbol.name}
                                        </p>
                                        {selectedSymbols.pref1?.id ===
                                          symbol.id && (
                                          <div className="absolute top-2 right-2">
                                            <CheckCircle2 className="h-5 w-5 text-primary" />
                                          </div>
                                        )}
                                      </motion.div>
                                    ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Second Preference */}
                        <div className="space-y-3">
                          <FormField
                            control={form.control}
                            name="symbolPreference2"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Second Preference *</FormLabel>
                                <FormControl>
                                  <Input {...field} className="hidden" />
                                </FormControl>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  {shuffledSymbols
                                    .slice(
                                      0,
                                      Math.min(shuffledSymbols.length, 3),
                                    )
                                    .map((symbol) => (
                                      <motion.div
                                        key={symbol.id}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={cn(
                                          "relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md",
                                          selectedSymbols.pref2?.id ===
                                            symbol.id
                                            ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                                            : "border-muted hover:border-primary/50",
                                        )}
                                        onClick={() =>
                                          handleSymbolSelect(symbol, "pref2")
                                        }
                                      >
                                        <div className="relative w-full aspect-square mb-3">
                                          <Image
                                            src={symbol.image}
                                            alt={symbol.name}
                                            fill
                                            className="object-contain"
                                          />
                                        </div>
                                        <p className="text-sm text-center font-medium">
                                          {symbol.name}
                                        </p>
                                        {selectedSymbols.pref2?.id ===
                                          symbol.id && (
                                          <div className="absolute top-2 right-2">
                                            <CheckCircle2 className="h-5 w-5 text-primary" />
                                          </div>
                                        )}
                                      </motion.div>
                                    ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Third Preference */}
                        <div className="space-y-3">
                          <FormField
                            control={form.control}
                            name="symbolPreference3"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Third Preference *</FormLabel>
                                <FormControl>
                                  <Input {...field} className="hidden" />
                                </FormControl>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  {shuffledSymbols
                                    .slice(
                                      0,
                                      Math.min(shuffledSymbols.length, 3),
                                    )
                                    .map((symbol) => (
                                      <motion.div
                                        key={symbol.id}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={cn(
                                          "relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md",
                                          selectedSymbols.pref3?.id ===
                                            symbol.id
                                            ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                                            : "border-muted hover:border-primary/50",
                                        )}
                                        onClick={() =>
                                          handleSymbolSelect(symbol, "pref3")
                                        }
                                      >
                                        <div className="relative w-full aspect-square mb-3">
                                          <Image
                                            src={symbol.image}
                                            alt={symbol.name}
                                            fill
                                            className="object-contain"
                                          />
                                        </div>
                                        <p className="text-sm text-center font-medium">
                                          {symbol.name}
                                        </p>
                                        {selectedSymbols.pref3?.id ===
                                          symbol.id && (
                                          <div className="absolute top-2 right-2">
                                            <CheckCircle2 className="h-5 w-5 text-primary" />
                                          </div>
                                        )}
                                      </motion.div>
                                    ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Caste/Tribe Name for non-general category */}
              {watchCategory !== "general" && (
                <FormField
                  control={form.control}
                  name="casteTribeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caste / Tribe Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your caste/tribe name"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Required for reserved category candidates
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={onBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover"
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

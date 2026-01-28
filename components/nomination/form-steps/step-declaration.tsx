// components/nomination/form-steps/step-declaration.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { format, differenceInYears } from "date-fns";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

import {
  ArrowLeft,
  ArrowRight,
  FileSignature,
  CalendarIcon,
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

const schema = z.object({
  dateOfBirth: z
    .date({ message: "Date of birth is required" })
    .optional()
    .refine((date) => !date || date <= new Date(), {
      message: "Date of birth cannot be in the future",
    }),
  politicalPartyId: z.string().min(1, "Political party is required"),
  symbolPreference1: z.string().min(1, "Symbol preference is required"),
});

interface StepDeclarationProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepDeclaration({ onNext, onBack }: StepDeclarationProps) {
  const { formData, updateFormData } = useNomination();
  const { submissionData } = useNominationSubmission();
  const [age, setAge] = useState<number | null>(null);
  const [shuffleCount, setShuffleCount] = useState(formData.shuffleCount || 0);
  const [selectedSymbol, setSelectedSymbol] =
    useState<IndependentSymbol | null>(null);
  // Initialize shuffled symbols from saved formData if available
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
      dateOfBirth: formData.dateOfBirth
        ? new Date(formData.dateOfBirth)
        : undefined,
      politicalPartyId: formData.politicalPartyId || "",
      symbolPreference1: formData.symbolPreference1 || "",
    },
  });

  const selectedPartyId = form.watch("politicalPartyId");
  const watchDOB = form.watch("dateOfBirth");

  // Calculate age when DOB changes
  useEffect(() => {
    if (watchDOB) {
      const calculatedAge = differenceInYears(new Date(), watchDOB);
      setAge(calculatedAge);
    }
  }, [watchDOB]);

  // Handle party change
  useEffect(() => {
    if (isPartyLocked) {
      // For subsequent submissions, use locked party data
      if (submissionData.lockedPoliticalPartyId === "independent") {
        // For independent, restore all shuffled symbols from formData if available
        if (formData.shuffledSymbols && formData.shuffledSymbols.length > 0) {
          setShuffledSymbols(formData.shuffledSymbols);
          setShuffleCount(
            formData.shuffleCount || formData.shuffledSymbols.length,
          );
          // Find and set the previously selected symbol from the shuffled symbols
          const previouslySelected = formData.shuffledSymbols.find(
            (s) => s.name === submissionData.lockedPartySymbol,
          );
          if (previouslySelected) {
            setSelectedSymbol(previouslySelected);
          } else {
            // Fallback to first symbol if not found
            setSelectedSymbol(formData.shuffledSymbols[0]);
          }
        } else {
          // Fallback to single locked symbol if no shuffled symbols saved
          const lockedSymbol = {
            id: "locked",
            name: submissionData.lockedPartySymbol,
            image: submissionData.lockedPartySymbolImage,
          };
          setShuffledSymbols([lockedSymbol]);
          setSelectedSymbol(lockedSymbol);
        }
        form.setValue("politicalPartyId", "independent");
        form.setValue("symbolPreference1", submissionData.lockedPartySymbol);
      } else {
        // For party candidates, set the locked party
        const party = politicalParties.find(
          (p) => p.id === submissionData.lockedPoliticalPartyId,
        );
        if (party) {
          setSelectedSymbol({
            id: party.id,
            name: party.symbol,
            image: party.symbolImage,
          });
          form.setValue(
            "politicalPartyId",
            submissionData.lockedPoliticalPartyId,
          );
          form.setValue("symbolPreference1", party.symbol);
        }
      }
      setIsShuffleDisabled(true);
      return;
    }

    if (selectedPartyId === "independent") {
      // Check if we have saved shuffled symbols to restore
      if (formData.shuffledSymbols && formData.shuffledSymbols.length > 0) {
        setShuffledSymbols(formData.shuffledSymbols);
        setShuffleCount(
          formData.shuffleCount || formData.shuffledSymbols.length,
        );
        setIsShuffleDisabled(formData.shuffleCount >= 3);
        // Find and set the selected symbol
        if (formData.partySymbol) {
          const savedSelected = formData.shuffledSymbols.find(
            (s) => s.name === formData.partySymbol,
          );
          if (savedSelected) {
            setSelectedSymbol(savedSelected);
          }
        }
      } else {
        // First time selecting independent - show first random symbol
        setSelectedSymbol(null);
        setShuffledSymbols([]);
        const randomSymbol = getRandomSymbols(1)[0];
        setShuffledSymbols([randomSymbol]);
        setSelectedSymbol(randomSymbol);
        form.setValue("symbolPreference1", randomSymbol.name);
        setShuffleCount(1); // First symbol counts as first shuffle
      }
    } else if (selectedPartyId) {
      // For party candidates, set the party symbol and reset shuffle count
      const party = politicalParties.find((p) => p.id === selectedPartyId);
      if (party && party.symbolImage) {
        setSelectedSymbol({
          id: party.id,
          name: party.symbol,
          image: party.symbolImage,
        });
        form.setValue("symbolPreference1", party.symbol);
        setShuffleCount(0); // Reset shuffle count when switching to party
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
    formData.partySymbol,
  ]);

  // Handle shuffle for independent candidates - add new symbol to the list
  const handleShuffle = () => {
    if (shuffleCount >= 3) return;

    // Get available symbols (excluding already shuffled ones)
    const usedIds = shuffledSymbols.map((s) => s.id);
    const availableSymbols = independentSymbols.filter(
      (symbol) => !usedIds.includes(symbol.id),
    );

    if (availableSymbols.length === 0) return;

    // Get a random symbol from available symbols
    const randomIndex = Math.floor(Math.random() * availableSymbols.length);
    const newSymbol = availableSymbols[randomIndex];

    // Add to shuffled symbols list
    const updatedShuffledSymbols = [...shuffledSymbols, newSymbol];
    setShuffledSymbols(updatedShuffledSymbols);
    setShuffleCount((prev) => prev + 1);

    // Auto-select the new symbol if no selection yet
    if (!selectedSymbol) {
      setSelectedSymbol(newSymbol);
      form.setValue("symbolPreference1", newSymbol.name);
    }

    if (shuffleCount + 1 >= 3) {
      setIsShuffleDisabled(true);
    }
  };

  // Handle symbol selection from shuffled list
  const handleSymbolSelect = (symbol: IndependentSymbol) => {
    if (isPartyLocked) return;
    setSelectedSymbol(symbol);
    form.setValue("symbolPreference1", symbol.name);
  };

  const onSubmit = (data: z.infer<typeof schema>) => {
    const party = politicalParties.find((p) => p.id === data.politicalPartyId);
    updateFormData({
      dateOfBirth: data.dateOfBirth?.toISOString() || "",
      age: age?.toString() || "",
      politicalPartyId: data.politicalPartyId,
      politicalParty: party?.name || "Independent",
      partySymbol: selectedSymbol?.name || "",
      partySymbolImage: selectedSymbol?.image || "",
      symbolPreference1: data.symbolPreference1,
      symbolPreference2: "",
      symbolPreference3: "",
      shuffleCount: shuffleCount,
      shuffledSymbols: shuffledSymbols, // Save all shuffled symbols for persistence
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
              {/* Date of Birth and Age */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Birth *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            captionLayout="dropdown"
                            fromYear={1940}
                            toYear={2010}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <FormLabel>Completed Age (Years)</FormLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      value={age !== null ? `${age} years` : ""}
                      disabled
                      placeholder="Age will be calculated"
                      className="bg-muted"
                    />
                    {age !== null && age >= 21 && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                    {age !== null && age < 21 && (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  {age !== null && age < 21 && (
                    <p className="text-xs text-destructive">
                      Must be at least 21 years old
                    </p>
                  )}
                </div>
              </div>

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
                        Party and symbol are locked from your first submission
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {/* Symbol Selection */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="symbolPreference1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symbol Preference *</FormLabel>
                      <FormControl>
                        <Input {...field} className="hidden" />
                      </FormControl>

                      {/* Party Symbol Display (SKM/SDF) */}
                      {selectedPartyId &&
                        !isIndependent &&
                        selectedSymbol?.image && (
                          <div className="p-4 border rounded-lg bg-muted/30">
                            <p className="text-sm text-muted-foreground mb-2">
                              Party Symbol
                            </p>
                            <div className="flex items-center gap-4">
                              <div className="relative w-20 h-20 border rounded-lg bg-white p-2">
                                <Image
                                  src={selectedSymbol.image}
                                  alt={selectedSymbol.name}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {selectedSymbol.name}
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
                              Independent candidates can shuffle up to{" "}
                              <strong>3 symbols</strong>. Each shuffle reveals a
                              new symbol. After all 3 shuffles, select one
                              symbol from the list below.
                            </AlertDescription>
                          </Alert>

                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              Symbols revealed:{" "}
                              <span className="font-bold text-primary">
                                {shuffleCount}/3
                              </span>
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleShuffle}
                              disabled={
                                isShuffleDisabled ||
                                shuffleCount >= 3 ||
                                isPartyLocked
                              }
                            >
                              <Shuffle className="mr-2 h-4 w-4" />
                              {shuffleCount >= 3
                                ? "All Symbols Revealed"
                                : `Reveal Next Symbol (${3 - shuffleCount} left)`}
                            </Button>
                          </div>

                          {/* Display All Shuffled Symbols */}
                          {shuffledSymbols.length > 0 && (
                            <div className="space-y-3">
                              <p className="text-sm font-medium text-muted-foreground">
                                {shuffleCount >= 3
                                  ? "Select one symbol from the options below:"
                                  : "Your revealed symbols (keep shuffling to see more):"}
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {shuffledSymbols.map((symbol, index) => (
                                  <motion.div
                                    key={symbol.id}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                      duration: 0.3,
                                      delay: index * 0.1,
                                    }}
                                    className={cn(
                                      "relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md",
                                      selectedSymbol?.id === symbol.id
                                        ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                                        : "border-muted hover:border-primary/50",
                                    )}
                                    onClick={() => handleSymbolSelect(symbol)}
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
                                    {selectedSymbol?.id === symbol.id && (
                                      <div className="absolute top-2 right-2">
                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                      </div>
                                    )}
                                    <Badge
                                      variant={
                                        selectedSymbol?.id === symbol.id
                                          ? "default"
                                          : "outline"
                                      }
                                      className="w-full mt-2 justify-center"
                                    >
                                      {selectedSymbol?.id === symbol.id
                                        ? "Selected"
                                        : `Option ${index + 1}`}
                                    </Badge>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}

                          {shuffleCount >= 3 && (
                            <p className="text-xs text-muted-foreground text-center">
                              All 3 symbols revealed. Please select your
                              preferred symbol above.
                            </p>
                          )}

                          {shuffleCount < 3 && shuffleCount > 0 && (
                            <p className="text-xs text-amber-600 text-center">
                              Click &quot;Reveal Next Symbol&quot; to see more
                              options before making your final selection.
                            </p>
                          )}
                        </div>
                      )}

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={onBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover"
                  disabled={age !== null && age < 21}
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

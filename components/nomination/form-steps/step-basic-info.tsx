// components/nomination/form-steps/step-basic-info.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { Checkbox } from "@/components/ui/checkbox";
import { FormDescription } from "@/components/ui/form";

import {
  ArrowRight,
  User,
  MapPin,
  AlertCircle,
  Loader2,
  Search,
  CheckCircle2,
  Upload,
  FileText,
} from "lucide-react";
import { useNomination } from "@/app/context/nomination-context";

// Types for API responses
interface District {
  id: string;
  name: string;
  code: string;
}

interface ULB {
  id: string;
  name: string;
  code: string;
  type: string;
  districtId: string;
}

interface Ward {
  id: string;
  wardNumber: number;
  wardName: string;
  reservationStatus: string | null;
  constituencyType: string | null;
  ulbId: string;
}

interface ElectionConfig {
  name: string;
  year: number;
}

interface VoterRollEntry {
  id: string;
  epicNumber: string;
  fullName: string;
  relationType: string;
  relationName: string;
  postalAddress: string;
}

const schema = z
  .object({
    districtId: z.string().min(1, "Please select a district"),
    ulbId: z.string().min(1, "Please select a ULB"),
    wardId: z.string().min(1, "Please select a ward"),
    candidateName: z.string().min(2, "Applicant name is required"),
    fatherOrHusbandName: z
      .string()
      .min(2, "Father's/Husband's name is required"),
    fullPostalAddress: z.string().min(10, "Complete address is required"),
    sameAsPostalAddress: z.boolean().default(false),
    correspondingAddress: z.string().optional(),
    serialNoCandidate: z
      .string()
      .min(1, "Serial number is required")
      .max(4, "Serial number cannot exceed 4 digits")
      .regex(/^[0-9]+$/, "Serial number must contain only numbers"),
    partNoCandidate: z
      .string()
      .min(1, "Part number is required")
      .max(4, "Part number cannot exceed 4 digits")
      .regex(/^[0-9]+$/, "Part number must contain only numbers"),
    category: z.enum([
      "general",
      "sc",
      "st_bl",
      "st_lt",
      "obc_central",
      "obc_state",
    ]),
    casteCertificate: z.any().optional(),
    affidavit: z.any().optional(),
    addressProof: z.any().optional(),
  })
  .refine(
    (data) => {
      if (!data.sameAsPostalAddress) {
        return (
          data.correspondingAddress && data.correspondingAddress.length >= 10
        );
      }
      return true;
    },
    {
      message:
        "Corresponding address is required when not same as postal address",
      path: ["correspondingAddress"],
    },
  );

interface StepBasicInfoProps {
  onNext: () => void;
  isUpdate?: boolean;
}

export function StepBasicInfo({
  onNext,
  isUpdate = false,
}: StepBasicInfoProps) {
  const { formData, updateFormData } = useNomination();

  // State for API data
  const [districts, setDistricts] = useState<District[]>([]);
  const [ulbs, setUlbs] = useState<ULB[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [electionConfig, setElectionConfig] = useState<ElectionConfig | null>(
    null,
  );
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [casteCertificateFile, setCasteCertificateFile] = useState<File | null>(
    null,
  );
  const [affidavitFile, setAffidavitFile] = useState<File | null>(null);
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);

  // EPIC search state
  const [epicSearch, setEpicSearch] = useState("");
  const [epicResults, setEpicResults] = useState<VoterRollEntry[]>([]);
  const [isSearchingEpic, setIsSearchingEpic] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState<VoterRollEntry | null>(
    null,
  );
  const [epicPopoverOpen, setEpicPopoverOpen] = useState(false);

  // Loading states
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(true);
  const [isLoadingUlbs, setIsLoadingUlbs] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Check if voter data is populated (either from current selection or loaded from existing nomination)
  const isVoterDataPopulated = !!selectedVoter || !!formData.epicNumber;

  // On update, disable all previously populated fields
  const isFieldDisabled = isUpdate || isVoterDataPopulated;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      districtId: formData.districtId || "",
      ulbId: formData.ulbId || "",
      wardId: formData.wardId || "",
      candidateName: formData.candidateName,
      fatherOrHusbandName: formData.fatherOrHusbandName,
      fullPostalAddress: formData.fullPostalAddress,
      sameAsPostalAddress: formData.sameAsPostalAddress || false,
      correspondingAddress: formData.correspondingAddress || "",
      serialNoCandidate: formData.serialNoCandidate || "",
      partNoCandidate: formData.partNoCandidate || "",
      category: formData.category || "general",
    },
  });

  // Update form when formData changes (for pre-filling on updates)
  useEffect(() => {
    if (formData.candidateName || formData.districtId) {
      console.log("Updating form with formData:", formData);
      form.reset({
        districtId: formData.districtId || "",
        ulbId: formData.ulbId || "",
        wardId: formData.wardId || "",
        candidateName: formData.candidateName || "",
        fatherOrHusbandName: formData.fatherOrHusbandName || "",
        fullPostalAddress: formData.fullPostalAddress || "",
        sameAsPostalAddress: formData.sameAsPostalAddress || false,
        correspondingAddress: formData.correspondingAddress || "",
        serialNoCandidate: formData.serialNoCandidate || "",
        partNoCandidate: formData.partNoCandidate || "",
        category: formData.category || "general",
      });
    }
  }, [formData, form]);

  const watchDistrictId = form.watch("districtId");
  const watchUlbId = form.watch("ulbId");
  const watchWardId = form.watch("wardId");
  const watchSameAsPostal = form.watch("sameAsPostalAddress");
  const watchPostalAddress = form.watch("fullPostalAddress");
  const watchCategory = form.watch("category");

  // Update corresponding address when checkbox is checked
  useEffect(() => {
    if (watchSameAsPostal) {
      form.setValue("correspondingAddress", watchPostalAddress);
    }
  }, [watchSameAsPostal, watchPostalAddress, form]);

  // EPIC Search
  const searchEpic = useCallback(async (query: string) => {
    if (query.length < 3) {
      setEpicResults([]);
      return;
    }
    setIsSearchingEpic(true);
    try {
      const response = await fetch(
        `/api/candidate/epic-search?epicNumber=${encodeURIComponent(query)}`,
      );
      if (!response.ok) {
        console.error("EPIC search failed:", response.status);
        setEpicResults([]);
        return;
      }
      const data = await response.json();
      if (data.success) {
        setEpicResults(data.data || []);
      } else {
        setEpicResults([]);
      }
    } catch (err) {
      console.error("EPIC search error:", err);
      setEpicResults([]);
    } finally {
      setIsSearchingEpic(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (epicSearch.length >= 3) searchEpic(epicSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [epicSearch, searchEpic]);

  const handleVoterSelect = (voter: VoterRollEntry) => {
    setSelectedVoter(voter);
    form.setValue("candidateName", voter.fullName);
    form.setValue("fatherOrHusbandName", voter.relationName);
    form.setValue("fullPostalAddress", voter.postalAddress);
    setEpicPopoverOpen(false);
  };

  // Fetch election config
  useEffect(() => {
    const fetchElectionConfig = async () => {
      try {
        const response = await fetch("/api/election/config");
        const data = await response.json();
        if (data.success) {
          setElectionConfig(data.data);
        } else if (data.configRequired) {
          setError(
            "Election configuration is not set. Please contact administrator.",
          );
        }
      } catch (err) {
        console.error("Failed to fetch election config:", err);
      } finally {
        setIsLoadingConfig(false);
      }
    };
    fetchElectionConfig();
  }, []);

  // Fetch districts on mount
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        setIsLoadingDistricts(true);
        const response = await fetch("/api/election/districts");
        const data = await response.json();
        if (data.success) {
          setDistricts(data.data);
        } else if (data.configRequired) {
          setError("No districts configured. Please contact administrator.");
        }
      } catch (err) {
        console.error("Failed to fetch districts:", err);
        setError("Failed to load districts. Please refresh the page.");
      } finally {
        setIsLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, []);

  // Fetch ULBs when district changes
  const fetchUlbs = useCallback(async (districtId: string) => {
    if (!districtId) {
      setUlbs([]);
      return;
    }
    try {
      setIsLoadingUlbs(true);
      const response = await fetch(
        `/api/election/ulbs?districtId=${districtId}`,
      );
      const data = await response.json();
      if (data.success) {
        setUlbs(data.data);
      } else {
        setUlbs([]);
      }
    } catch (err) {
      console.error("Failed to fetch ULBs:", err);
      setUlbs([]);
    } finally {
      setIsLoadingUlbs(false);
    }
  }, []);

  // Fetch wards when ULB changes
  const fetchWards = useCallback(async (ulbId: string) => {
    if (!ulbId) {
      setWards([]);
      return;
    }
    try {
      setIsLoadingWards(true);
      const response = await fetch(`/api/election/wards?ulbId=${ulbId}`);
      const data = await response.json();
      if (data.success) {
        setWards(data.data);
      } else {
        setWards([]);
      }
    } catch (err) {
      console.error("Failed to fetch wards:", err);
      setWards([]);
    } finally {
      setIsLoadingWards(false);
    }
  }, []);

  // Update ULBs when district changes
  useEffect(() => {
    if (watchDistrictId) {
      fetchUlbs(watchDistrictId);
      if (formData.districtId !== watchDistrictId) {
        form.setValue("ulbId", "");
        form.setValue("wardId", "");
        setWards([]);
        setSelectedWard(null);
      }
    }
  }, [watchDistrictId, fetchUlbs, form, formData.districtId]);

  // Update wards when ULB changes
  useEffect(() => {
    if (watchUlbId) {
      fetchWards(watchUlbId);
      if (formData.ulbId !== watchUlbId) {
        form.setValue("wardId", "");
        setSelectedWard(null);
      }
    }
  }, [watchUlbId, fetchWards, form, formData.ulbId]);

  // Update selected ward details
  useEffect(() => {
    if (watchWardId && wards.length > 0) {
      const ward = wards.find((w) => w.id === watchWardId);
      setSelectedWard(ward || null);
    }
  }, [watchWardId, wards]);

  // Upload a file to Cloudinary
  const uploadDocument = async (
    file: File,
    docType: string,
  ): Promise<{ url: string; fileName: string } | null> => {
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("type", docType);

      const response = await fetch("/api/nominations/documents", {
        method: "POST",
        body: uploadData,
      });

      const result = await response.json();
      if (result.success) {
        return { url: result.data.url, fileName: file.name };
      }
      console.error(`Failed to upload ${docType}:`, result.error);
      return null;
    } catch (err) {
      console.error(`Upload error for ${docType}:`, err);
      return null;
    }
  };

  const onSubmit = async (data: z.infer<typeof schema>) => {
    const selectedDistrict = districts.find((d) => d.id === data.districtId);
    const selectedUlb = ulbs.find((u) => u.id === data.ulbId);
    const wardInfo = selectedWard;

    // Upload documents to Cloudinary
    setIsUploadingDocs(true);
    let casteCertUrl = formData.casteCertificateUrl || "";
    let affidavitUrl = formData.affidavitUrl || "";
    let addressProofUrl = formData.addressProofUrl || "";

    try {
      const uploads = [];
      if (casteCertificateFile) {
        uploads.push(
          uploadDocument(casteCertificateFile, "casteCertificate").then((r) => {
            if (r) casteCertUrl = r.url;
          }),
        );
      }
      if (affidavitFile) {
        uploads.push(
          uploadDocument(affidavitFile, "affidavit").then((r) => {
            if (r) affidavitUrl = r.url;
          }),
        );
      }
      if (addressProofFile) {
        uploads.push(
          uploadDocument(addressProofFile, "addressProof").then((r) => {
            if (r) addressProofUrl = r.url;
          }),
        );
      }
      await Promise.all(uploads);
    } catch (err) {
      console.error("Document upload error:", err);
    } finally {
      setIsUploadingDocs(false);
    }

    updateFormData({
      districtId: data.districtId,
      district: selectedDistrict?.name || "",
      ulbId: data.ulbId,
      ulb: selectedUlb?.name || "",
      municipality: selectedUlb?.name || "",
      wardId: data.wardId,
      municipalWard: wardInfo
        ? `${wardInfo.wardNumber}-${wardInfo.wardName}`
        : "",
      wardName: wardInfo?.wardName || "",
      constituency: wardInfo?.constituencyType || "",
      reservation: wardInfo?.reservationStatus || "",
      candidateName: data.candidateName,
      fatherOrHusbandName: data.fatherOrHusbandName,
      fullPostalAddress: data.fullPostalAddress,
      sameAsPostalAddress: data.sameAsPostalAddress,
      correspondingAddress: data.sameAsPostalAddress
        ? data.fullPostalAddress
        : data.correspondingAddress || "",
      serialNoCandidate: data.serialNoCandidate,
      partNoCandidate: data.partNoCandidate,
      category: data.category,
      casteTribeName:
        data.category !== "general" ? formData.casteTribeName : "",
      casteCertificateFile: casteCertificateFile?.name || "",
      casteCertificateUrl: casteCertUrl,
      affidavitFile: affidavitFile?.name || "",
      affidavitUrl: affidavitUrl,
      addressProofFile: addressProofFile?.name || "",
      addressProofUrl: addressProofUrl,
      epicNumber:
        selectedVoter?.epicNumber || epicSearch || formData.epicNumber || "",
    });
    onNext();
  };

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
            <User className="h-5 w-5 text-primary" />
            Applicant Information
          </CardTitle>
          {isLoadingConfig ? (
            <Skeleton className="h-4 w-48" />
          ) : electionConfig ? (
            <p className="text-sm text-muted-foreground">
              {electionConfig.name} {electionConfig.year}
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Location Selection */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <MapPin className="h-4 w-4" />
                  Select your contesting area
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="districtId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District *</FormLabel>
                        {isLoadingDistricts ? (
                          <Skeleton className="h-10 w-full" />
                        ) : (
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isUpdate}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select district" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {districts.map((district) => (
                                <SelectItem
                                  key={district.id}
                                  value={district.id}
                                >
                                  {district.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ulbId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ULB / Municipality *</FormLabel>
                        {isLoadingUlbs ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <Skeleton className="h-10 w-full" />
                          </div>
                        ) : (
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={
                              isUpdate || !watchDistrictId || ulbs.length === 0
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select ULB" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ulbs.map((ulb) => (
                                <SelectItem key={ulb.id} value={ulb.id}>
                                  {ulb.name} ({ulb.type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="wardId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ward *</FormLabel>
                        {isLoadingWards ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <Skeleton className="h-10 w-full" />
                          </div>
                        ) : (
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={
                              isUpdate || !watchUlbId || wards.length === 0
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select ward" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {wards.map((ward) => (
                                <SelectItem key={ward.id} value={ward.id}>
                                  Ward {ward.wardNumber} - {ward.wardName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Ward Details */}
                {selectedWard && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Constituency
                      </p>
                      <p className="font-medium text-sm">
                        {selectedWard.constituencyType || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Reservation
                      </p>
                      <p className="font-medium text-sm">
                        {selectedWard.reservationStatus || "Unreserved"}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* EPIC Number Search */}
              <div className="space-y-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                  <Search className="h-4 w-4" />
                  Search EPIC Number to auto-fill applicant details
                </div>
                <Popover
                  open={epicPopoverOpen && !isFieldDisabled}
                  onOpenChange={(open) =>
                    !isFieldDisabled && setEpicPopoverOpen(open)
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={`w-full justify-between font-normal h-10 ${isFieldDisabled ? "bg-muted cursor-not-allowed" : ""}`}
                      onClick={() =>
                        !isFieldDisabled && setEpicPopoverOpen(true)
                      }
                      disabled={isFieldDisabled}
                    >
                      {selectedVoter || formData.epicNumber ? (
                        <span className="truncate">
                          {selectedVoter?.epicNumber || formData.epicNumber} -{" "}
                          {selectedVoter?.fullName ||
                            formData.candidateName ||
                            ""}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Search by EPIC number...
                        </span>
                      )}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput
                        placeholder="Type EPIC number (min 3 chars)..."
                        value={epicSearch}
                        onValueChange={setEpicSearch}
                      />
                      <CommandList>
                        {isSearchingEpic && (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Searching...
                          </div>
                        )}
                        <CommandEmpty>
                          {epicSearch.length < 3
                            ? "Type at least 3 characters..."
                            : "No voter found."}
                        </CommandEmpty>
                        <CommandGroup>
                          {epicResults.map((voter) => (
                            <CommandItem
                              key={voter.id}
                              value={voter.epicNumber}
                              onSelect={() => handleVoterSelect(voter)}
                            >
                              <div className="flex flex-col w-full">
                                <span className="font-medium">
                                  {voter.epicNumber}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {voter.fullName} - {voter.relationType}:{" "}
                                  {voter.relationName}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {selectedVoter && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm space-y-1">
                    <div className="flex items-center gap-2 text-green-700 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      Voter details auto-populated from Electoral Roll
                    </div>
                    <p className="text-green-600">
                      <strong>EPIC:</strong> {selectedVoter.epicNumber} |{" "}
                      <strong>{selectedVoter.relationType}:</strong>{" "}
                      {selectedVoter.relationName}
                    </p>
                  </div>
                )}
              </div>

              {/* Applicant Details */}
              <FormField
                control={form.control}
                name="candidateName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicant&apos;s Full Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your full name"
                        {...field}
                        disabled={isFieldDisabled}
                        className={isFieldDisabled ? "bg-muted" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fatherOrHusbandName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father&apos;s / Husband&apos;s Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter father's or husband's name"
                        {...field}
                        disabled={isFieldDisabled}
                        className={isFieldDisabled ? "bg-muted" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fullPostalAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Postal Address *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter complete postal address"
                        className={`min-h-[100px] ${isFieldDisabled ? "bg-muted" : ""}`}
                        {...field}
                        disabled={isFieldDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Corresponding Address Section */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="sameAsPostalAddress"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Corresponding address same as postal address
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {!watchSameAsPostal && (
                  <FormField
                    control={form.control}
                    name="correspondingAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Corresponding Address *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter corresponding address"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Electoral Roll Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="serialNoCandidate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial No. in Electoral Roll *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter 4-digit serial number"
                          maxLength={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        From your electoral roll
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="partNoCandidate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Part No. in Electoral Roll *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter 4-digit part number"
                          maxLength={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        From your electoral roll
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Category Selection */}
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Community Category *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="sc">
                            Scheduled Caste (SC)
                          </SelectItem>
                          <SelectItem value="st_bl">
                            Scheduled Tribe (BL)
                          </SelectItem>
                          <SelectItem value="st_lt">
                            Scheduled Tribe (LT)
                          </SelectItem>
                          <SelectItem value="obc_central">
                            OBC (Central List)
                          </SelectItem>
                          <SelectItem value="obc_state">
                            OBC (State List)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Document Uploads */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <FileText className="h-4 w-4" />
                  Document Uploads
                </div>

                <FormField
                  control={form.control}
                  name="casteCertificate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Caste Certificate{" "}
                        {watchCategory !== "general" ? "*" : "(if applicable)"}
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setCasteCertificateFile(file);
                                field.onChange(file);
                              }
                            }}
                            className="cursor-pointer"
                          />
                          <Upload className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload PDF, JPG, or PNG (Max 5MB)
                      </FormDescription>
                      {casteCertificateFile && (
                        <p className="text-xs text-green-600">
                          ✓ {casteCertificateFile.name}
                        </p>
                      )}
                      {!casteCertificateFile &&
                        formData.casteCertificateUrl && (
                          <div className="flex items-center gap-2 text-xs text-blue-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Previously uploaded</span>
                            <a
                              href={formData.casteCertificateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-blue-800"
                            >
                              View
                            </a>
                          </div>
                        )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="affidavit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Affidavit *</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setAffidavitFile(file);
                                field.onChange(file);
                              }
                            }}
                            className="cursor-pointer"
                          />
                          <Upload className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload PDF, JPG, or PNG (Max 5MB)
                      </FormDescription>
                      {affidavitFile && (
                        <p className="text-xs text-green-600">
                          ✓ {affidavitFile.name}
                        </p>
                      )}
                      {!affidavitFile && formData.affidavitUrl && (
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Previously uploaded</span>
                          <a
                            href={formData.affidavitUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-800"
                          >
                            View
                          </a>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="addressProof"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Proof *</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setAddressProofFile(file);
                                field.onChange(file);
                              }
                            }}
                            className="cursor-pointer"
                          />
                          <Upload className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload PDF, JPG, or PNG (Max 5MB)
                      </FormDescription>
                      {addressProofFile && (
                        <p className="text-xs text-green-600">
                          ✓ {addressProofFile.name}
                        </p>
                      )}
                      {!addressProofFile && formData.addressProofUrl && (
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Previously uploaded</span>
                          <a
                            href={formData.addressProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-800"
                          >
                            View
                          </a>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover"
                  disabled={
                    isLoadingDistricts ||
                    districts.length === 0 ||
                    isUploadingDocs
                  }
                >
                  {isUploadingDocs ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading Documents...
                    </>
                  ) : (
                    <>
                      Next Step
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

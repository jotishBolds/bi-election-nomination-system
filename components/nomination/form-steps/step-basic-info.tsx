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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { ArrowRight, User, MapPin, AlertCircle, Loader2 } from "lucide-react";
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

const schema = z.object({
  districtId: z.string().min(1, "Please select a district"),
  ulbId: z.string().min(1, "Please select a ULB"),
  wardId: z.string().min(1, "Please select a ward"),
  candidateName: z.string().min(2, "Applicant name is required"),
  fatherOrHusbandName: z.string().min(2, "Father's/Husband's name is required"),
  fullPostalAddress: z.string().min(10, "Complete address is required"),
  category: z.enum([
    "general",
    "sc",
    "st_bl",
    "st_lt",
    "obc_central",
    "obc_state",
  ]),
});

interface StepBasicInfoProps {
  onNext: () => void;
}

export function StepBasicInfo({ onNext }: StepBasicInfoProps) {
  const { formData, updateFormData } = useNomination();

  // State for API data
  const [districts, setDistricts] = useState<District[]>([]);
  const [ulbs, setUlbs] = useState<ULB[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [electionConfig, setElectionConfig] = useState<ElectionConfig | null>(
    null,
  );
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  // Loading states
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(true);
  const [isLoadingUlbs, setIsLoadingUlbs] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Error state
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      districtId: formData.districtId || "",
      ulbId: formData.ulbId || "",
      wardId: formData.wardId || "",
      candidateName: formData.candidateName,
      fatherOrHusbandName: formData.fatherOrHusbandName,
      fullPostalAddress: formData.fullPostalAddress,
      category: formData.category || "general",
    },
  });

  const watchDistrictId = form.watch("districtId");
  const watchUlbId = form.watch("ulbId");
  const watchWardId = form.watch("wardId");

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
      // Reset ULB and ward if district changes
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
      // Reset ward if ULB changes
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

  const onSubmit = (data: z.infer<typeof schema>) => {
    const selectedDistrict = districts.find((d) => d.id === data.districtId);
    const selectedUlb = ulbs.find((u) => u.id === data.ulbId);
    const wardInfo = selectedWard;

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
      serialNoCandidate: "",
      partNoCandidate: "",
      category: data.category,
      casteTribeName: "",
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
                            disabled={!watchDistrictId || ulbs.length === 0}
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
                            disabled={!watchUlbId || wards.length === 0}
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

              {/* Applicant Details */}
              <FormField
                control={form.control}
                name="candidateName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicant's Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
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
                    <FormLabel>Father's / Husband's Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter father's or husband's name"
                        {...field}
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
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover"
                  disabled={isLoadingDistricts || districts.length === 0}
                >
                  Next Step
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

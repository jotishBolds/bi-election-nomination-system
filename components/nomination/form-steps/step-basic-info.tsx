// components/nomination/form-steps/step-basic-info.tsx
"use client";

import { useEffect, useState } from "react";
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
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";

import { ArrowRight, User, MapPin, Upload, FileText } from "lucide-react";
import { useNomination } from "@/app/context/nomination-context";
import {
  electionData,
  getDistricts,
  getULBsForDistrict,
  getWardsForULB,
  Ward,
} from "@/lib/election-data";

const schema = z
  .object({
    district: z.string().min(1, "Please select a district"),
    ulb: z.string().min(1, "Please select a ULB"),
    municipalWard: z.string().min(1, "Please select a ward"),
    candidateName: z.string().min(2, "Candidate name is required"),
    fatherOrHusbandName: z
      .string()
      .min(2, "Father's/Husband's name is required"),
    fullPostalAddress: z
      .string()
      .min(10, "Complete postal address is required"),
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
}

export function StepBasicInfo({ onNext }: StepBasicInfoProps) {
  const { formData, updateFormData } = useNomination();
  const [districts] = useState<string[]>(getDistricts());
  const [ulbs, setUlbs] = useState<string[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [casteCertificateFile, setCasteCertificateFile] = useState<File | null>(
    null,
  );
  const [affidavitFile, setAffidavitFile] = useState<File | null>(null);
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      district: formData.district,
      ulb: formData.ulb,
      municipalWard: formData.municipalWard,
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

  const watchDistrict = form.watch("district");
  const watchUlb = form.watch("ulb");
  const watchWard = form.watch("municipalWard");
  const watchSameAsPostal = form.watch("sameAsPostalAddress");
  const watchPostalAddress = form.watch("fullPostalAddress");
  const watchCategory = form.watch("category");

  // Update corresponding address when checkbox is checked
  useEffect(() => {
    if (watchSameAsPostal) {
      form.setValue("correspondingAddress", watchPostalAddress);
    }
  }, [watchSameAsPostal, watchPostalAddress, form]);

  // Update ULBs when district changes
  useEffect(() => {
    if (watchDistrict) {
      const ulbList = getULBsForDistrict(watchDistrict);
      setUlbs(ulbList);
      // Reset ULB and ward if district changes
      if (formData.district !== watchDistrict) {
        form.setValue("ulb", "");
        form.setValue("municipalWard", "");
        setWards([]);
        setSelectedWard(null);
      }
    }
  }, [watchDistrict, form, formData.district]);

  // Update wards when ULB changes
  useEffect(() => {
    if (watchDistrict && watchUlb) {
      const wardList = getWardsForULB(watchDistrict, watchUlb);
      setWards(wardList);
      // Reset ward if ULB changes
      if (formData.ulb !== watchUlb) {
        form.setValue("municipalWard", "");
        setSelectedWard(null);
      }
    }
  }, [watchDistrict, watchUlb, form, formData.ulb]);

  // Update selected ward details
  useEffect(() => {
    if (watchWard && wards.length > 0) {
      const ward = wards.find((w) => `${w.wardNo}-${w.wardName}` === watchWard);
      setSelectedWard(ward || null);
    }
  }, [watchWard, wards]);

  const onSubmit = (data: z.infer<typeof schema>) => {
    const wardInfo = selectedWard;
    updateFormData({
      district: data.district,
      ulb: data.ulb,
      municipality: data.ulb,
      municipalWard: data.municipalWard,
      wardName: wardInfo?.wardName || "",
      constituency: wardInfo?.constituency || "",
      reservation: wardInfo?.reservation || "",
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
      affidavitFile: affidavitFile?.name || "",
      addressProofFile: addressProofFile?.name || "",
    });
    onNext();
  };

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
            Candidate Information
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {electionData.election}
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Location Selection */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <MapPin className="h-4 w-4" />
                  Select your contesting area
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District *</FormLabel>
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
                              <SelectItem key={district} value={district}>
                                {district}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ulb"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ULB / Municipality *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!watchDistrict}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ULB" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ulbs.map((ulb) => (
                              <SelectItem key={ulb} value={ulb}>
                                {ulb}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="municipalWard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ward *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!watchUlb}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ward" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {wards.map((ward) => (
                              <SelectItem
                                key={`${ward.wardNo}-${ward.wardName}`}
                                value={`${ward.wardNo}-${ward.wardName}`}
                              >
                                Ward {ward.wardNo} - {ward.wardName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        {selectedWard.constituency || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Reservation
                      </p>
                      <p className="font-medium text-sm">
                        {selectedWard.reservation || "Unreserved"}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Candidate Details */}
              <FormField
                control={form.control}
                name="candidateName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Candidate's Full Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter candidate's full name"
                        {...field}
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
                        <SelectItem value="sc">Scheduled Caste (SC)</SelectItem>
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
                      <FormLabel>Caste Certificate *</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover"
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

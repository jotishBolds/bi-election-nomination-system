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

import { ArrowRight, User, MapPin } from "lucide-react";
import { useNomination } from "@/app/context/nomination-context";
import {
  electionData,
  getDistricts,
  getULBsForDistrict,
  getWardsForULB,
  Ward,
} from "@/lib/election-data";

const schema = z.object({
  district: z.string().min(1, "Please select a district"),
  ulb: z.string().min(1, "Please select a ULB"),
  municipalWard: z.string().min(1, "Please select a ward"),
  candidateName: z.string().min(2, "Applicant name is required"),
  fatherOrHusbandName: z.string().min(2, "Father's/Husband's name is required"),
  fullPostalAddress: z.string().min(10, "Complete address is required"),
  serialNoCandidate: z.string().min(1, "Serial number is required"),
  partNoCandidate: z.string().min(1, "Part number is required"),
});

interface StepBasicInfoProps {
  onNext: () => void;
}

export function StepBasicInfo({ onNext }: StepBasicInfoProps) {
  const { formData, updateFormData } = useNomination();
  const [districts] = useState<string[]>(getDistricts());
  const [ulbs, setUlbs] = useState<string[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      district: formData.district,
      ulb: formData.ulb,
      municipalWard: formData.municipalWard,
      candidateName: formData.candidateName,
      fatherOrHusbandName: formData.fatherOrHusbandName,
      fullPostalAddress: formData.fullPostalAddress,
      serialNoCandidate: formData.serialNoCandidate,
      partNoCandidate: formData.partNoCandidate,
    },
  });

  const watchDistrict = form.watch("district");
  const watchUlb = form.watch("ulb");
  const watchWard = form.watch("municipalWard");

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
      municipality: data.ulb, // ULB is the municipality
      municipalWard: data.municipalWard,
      wardName: wardInfo?.wardName || "",
      constituency: wardInfo?.constituency || "",
      reservation: wardInfo?.reservation || "",
      candidateName: data.candidateName,
      fatherOrHusbandName: data.fatherOrHusbandName,
      fullPostalAddress: data.fullPostalAddress,
      serialNoCandidate: data.serialNoCandidate,
      partNoCandidate: data.partNoCandidate,
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
            Applicant Information
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {electionData.election}
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Location Selection */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <MapPin className="h-4 w-4" />
                  Select Your Constituency
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="serialNoCandidate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial No. in Electoral Roll *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter serial number" {...field} />
                      </FormControl>
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
                        <Input placeholder="Enter part number" {...field} />
                      </FormControl>
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

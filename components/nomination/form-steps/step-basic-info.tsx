// components/nomination/form-steps/step-basic-info.tsx
"use client";

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

import { ArrowRight, User } from "lucide-react";
import { useNomination } from "@/app/context/nomination-context";

const schema = z.object({
  municipality: z.string().min(2, "Municipality name is required"),
  municipalWard: z.string().min(1, "Ward name/number is required"),
  candidateName: z.string().min(2, "Candidate name is required"),
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

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      municipality: formData.municipality,
      municipalWard: formData.municipalWard,
      candidateName: formData.candidateName,
      fatherOrHusbandName: formData.fatherOrHusbandName,
      fullPostalAddress: formData.fullPostalAddress,
      serialNoCandidate: formData.serialNoCandidate,
      partNoCandidate: formData.partNoCandidate,
    },
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    updateFormData(data);
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
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="municipality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Municipality Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter municipality name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="municipalWard"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Municipal Ward *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter ward name/number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="candidateName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Candidate's Full Name *</FormLabel>
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

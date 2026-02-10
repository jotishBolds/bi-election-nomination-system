// components/nomination/form-steps/step-proposer-info.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { useEffect } from "react";
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

import { ArrowLeft, ArrowRight, Users } from "lucide-react";
import { useNomination } from "@/app/context/nomination-context";

const schema = z.object({
  proposerName: z.string().min(2, "Proposer name is required"),
  proposerSerialNo: z
    .string()
    .min(1, "Serial number is required")
    .max(4, "Serial number cannot exceed 4 digits")
    .regex(/^[0-9]+$/, "Serial number must contain only numbers"),
  proposerPartNo: z
    .string()
    .min(1, "Part number is required")
    .max(4, "Part number cannot exceed 4 digits")
    .regex(/^[0-9]+$/, "Part number must contain only numbers"),
});

interface StepProposerInfoProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepProposerInfo({ onNext, onBack }: StepProposerInfoProps) {
  const { formData, updateFormData } = useNomination();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      proposerName: formData.proposerName,
      proposerSerialNo: formData.proposerSerialNo,
      proposerPartNo: formData.proposerPartNo,
    },
  });

  // Update form when formData changes (for pre-filling on updates)
  useEffect(() => {
    if (formData.proposerName) {
      console.log("Updating proposer form with formData:", formData);
      form.reset({
        proposerName: formData.proposerName || "",
        proposerSerialNo: formData.proposerSerialNo || "",
        proposerPartNo: formData.proposerPartNo || "",
      });
    }
  }, [formData, form]);

  const onSubmit = (data: z.infer<typeof schema>) => {
    updateFormData({
      ...data,
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
            <Users className="h-5 w-5 text-primary" />
            Proposer Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="proposerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposer's Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter proposer's name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="proposerSerialNo"
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="proposerPartNo"
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

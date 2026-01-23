// components/nomination/form-steps/step-declaration.tsx
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ArrowLeft, ArrowRight, FileSignature } from "lucide-react";
import { useNomination } from "@/app/context/nomination-context";

const schema = z.object({
  age: z
    .string()
    .min(1, "Age is required")
    .refine((val) => parseInt(val) >= 21, {
      message: "Must be at least 21 years old",
    }),
  politicalParty: z.string().min(1, "Political party is required"),
  symbolPreference1: z.string().min(1, "First symbol preference is required"),
  symbolPreference2: z.string().optional(),
  symbolPreference3: z.string().optional(),
  category: z.enum([
    "general",
    "sc",
    "st_bl",
    "st_lt",
    "obc_central",
    "obc_state",
  ]),
  casteTribeName: z.string().optional(),
});

interface StepDeclarationProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepDeclaration({ onNext, onBack }: StepDeclarationProps) {
  const { formData, updateFormData } = useNomination();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      age: formData.age,
      politicalParty: formData.politicalParty,
      symbolPreference1: formData.symbolPreference1,
      symbolPreference2: formData.symbolPreference2,
      symbolPreference3: formData.symbolPreference3,
      category: formData.category,
      casteTribeName: formData.casteTribeName,
    },
  });

  const selectedCategory = form.watch("category");

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
            <FileSignature className="h-5 w-5 text-primary" />
            Declaration Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Completed Age (Years) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="21"
                          placeholder="Enter age"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="politicalParty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Political Party *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter political party name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormLabel>
                  Symbol Preferences (in order of preference)
                </FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="symbolPreference1"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="1st preference *" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="symbolPreference2"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="2nd preference" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="symbolPreference3"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="3rd preference" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
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

              {selectedCategory !== "general" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <FormField
                    control={form.control}
                    name="casteTribeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Caste/Tribe Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter caste/tribe name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
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

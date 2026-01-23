// components/nomination/start-page.tsx
"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  FileText,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Calendar,
  IndianRupee,
  User,
  FileCheck,
} from "lucide-react";

interface StartPageProps {
  onApplyClick: () => void;
}

const guidelines = [
  {
    icon: User,
    title: "Eligibility Criteria",
    description:
      "Must be a registered voter in the municipality and completed 21 years of age",
  },
  {
    icon: FileText,
    title: "Required Documents",
    description:
      "Valid ID proof, Address proof, Electoral roll details, and Affidavit",
  },
  {
    icon: IndianRupee,
    title: "Application Fee",
    description:
      "₹500 for General category, ₹250 for SC/ST candidates (non-refundable)",
  },
  {
    icon: Calendar,
    title: "Important Dates",
    description:
      "Last date for submission: February 15, 2026. Scrutiny: February 18, 2026",
  },
];

const steps = [
  "Fill nomination form (FORM-18)",
  "Upload required documents",
  "Pay application fee",
  "Receive acknowledgment",
  "Attend scrutiny process",
];

export function StartPage({ onApplyClick }: StartPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-primary-light to-white p-4 md:p-8"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-4"
        >
          <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary">
            Election Nomination Portal
          </h1>
          <p className="text-muted-foreground text-lg">
            Municipal Corporation Elections 2026
          </p>
        </motion.div>

        {/* Alert Banner */}
        <Alert className="border-primary/20 bg-primary-light">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">Important Notice</AlertTitle>
          <AlertDescription>
            Nomination filing is open from January 20, 2026 to February 15,
            2026. Ensure all documents are ready before starting the
            application.
          </AlertDescription>
        </Alert>

        {/* Guidelines Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guidelines.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Process Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Nomination Process
            </CardTitle>
            <CardDescription>
              Follow these steps to complete your nomination
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium">{step}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SLA Information */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Clock className="h-6 w-6 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold text-green-800">
                  Processing Timeline
                </h3>
                <ul className="text-sm text-green-700 mt-2 space-y-1">
                  <li>• Application submission: Instant acknowledgment</li>
                  <li>• Document verification: Within 48 hours</li>
                  <li>• Scrutiny result: As per scheduled date</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Apply Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center pt-4"
        >
          <Button
            size="lg"
            className="bg-primary hover:bg-primary-hover text-lg px-8 py-6"
            onClick={onApplyClick}
          >
            Apply for Nomination
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

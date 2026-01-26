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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clock,
  AlertCircle,
  ArrowRight,
  Calendar,
  IndianRupee,
  User,
  FileCheck,
  AlertTriangle,
} from "lucide-react";
import { useNominationSubmission } from "@/app/context/nomination-submission-context";

interface StartPageProps {
  onApplyClick: () => void;
}

const guidelines = [
  {
    icon: User,
    title: "Eligibility Criteria",
    description:
      "Must be a registered voter in the municipality and completed 21 years of age",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    cardBg: "bg-blue-50",
  },
  {
    icon: FileText,
    title: "Required Documents",
    description:
      "Valid ID proof, Address proof, Electoral roll details, and Affidavit",
    iconColor: "text-purple-600",
    iconBg: "bg-purple-100",
    cardBg: "bg-purple-50",
  },
  {
    icon: IndianRupee,
    title: "Application Fee",
    description:
      "₹500 for General category, ₹250 for SC/ST applicants (non-refundable)",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
    cardBg: "bg-emerald-50",
  },
  {
    icon: Calendar,
    title: "Important Dates",
    description:
      "Last date for submission: February 15, 2026. Scrutiny: February 18, 2026",
    iconColor: "text-rose-600",
    iconBg: "bg-rose-100",
    cardBg: "bg-rose-50",
  },
];

const steps = [
  { text: "Fill nomination form (FORM-18)", color: "bg-blue-500" },
  { text: "Upload required documents", color: "bg-purple-500" },
  { text: "Pay application fee", color: "bg-emerald-500" },
  { text: "Receive acknowledgment", color: "bg-amber-500" },
  { text: "Attend scrutiny process", color: "bg-rose-500" },
];

export function StartPage({ onApplyClick }: StartPageProps) {
  const { submissionData, canSubmitMore } = useNominationSubmission();
  const canApply = canSubmitMore();
  const submissionCount = submissionData.submissionCount;
  const maxSubmissions = submissionData.maxSubmissions;

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
          <div className="mx-auto">
            <img
              src="/main-logo.png"
              alt="Election Nomination Portal"
              className="h-20 w-auto mx-auto"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary">
            Election Nomination Portal
          </h1>
          <p className="text-muted-foreground text-lg">
            Municipal Corporation Elections 2026
          </p>
        </motion.div>

        {/* Alert Banner */}
        <Alert className="border-0 bg-amber-50 shadow-sm">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Important Notice</AlertTitle>
          <AlertDescription className="text-amber-700">
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
              <Card
                className={`h-full border-0 shadow-sm hover:shadow-md transition-shadow ${item.cardBg}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.iconBg}`}>
                      <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                    </div>
                    <CardTitle className="text-lg text-slate-800">
                      {item.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm">{item.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Process Steps */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <FileCheck className="h-5 w-5 text-indigo-600" />
              </div>
              <span className="text-slate-800">Nomination Process</span>
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
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full ${step.color} text-white flex items-center justify-center text-sm font-bold shadow-sm`}
                  >
                    {index + 1}
                  </div>
                  <span className="font-medium text-slate-700">
                    {step.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SLA Information */}
        <Card className="border-0 bg-teal-50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Clock className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-teal-800">
                  Processing Timeline
                </h3>
                <ul className="text-sm text-teal-700 mt-2 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                    Application submission: Instant acknowledgment
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                    Document verification: Within 48 hours
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                    Scrutiny result: As per scheduled date
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submission Status Card */}
        {submissionCount > 0 && (
          <Card
            className={`border-0 shadow-sm ${canApply ? "bg-blue-50" : "bg-amber-50"}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${canApply ? "bg-blue-100" : "bg-amber-100"}`}
                  >
                    <FileCheck
                      className={`h-5 w-5 ${canApply ? "text-blue-600" : "text-amber-600"}`}
                    />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold ${canApply ? "text-blue-800" : "text-amber-800"}`}
                    >
                      Your Submission Status
                    </h3>
                    <p
                      className={`text-sm ${canApply ? "text-blue-600" : "text-amber-600"}`}
                    >
                      {submissionCount} of {maxSubmissions} nominations
                      submitted
                    </p>
                  </div>
                </div>
                <Badge
                  className={`text-lg px-4 py-1 ${canApply ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}
                >
                  {submissionCount}/{maxSubmissions}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Max Submissions Warning */}
        {!canApply && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">
              Maximum Nominations Reached
            </AlertTitle>
            <AlertDescription className="text-amber-700">
              You have submitted the maximum allowed {maxSubmissions} nomination
              forms for this election. As per the election rules, candidates can
              submit up to 3 nominations for the same ward. Please visit the
              Dashboard to view your submitted nominations or contact the
              Election Office for assistance.
            </AlertDescription>
          </Alert>
        )}

        {/* Apply Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col items-center gap-3 pt-4"
        >
          <Button
            size="lg"
            className={`text-lg px-8 py-6 shadow-md ${
              canApply
                ? "bg-primary hover:bg-primary-hover"
                : "bg-slate-400 cursor-not-allowed"
            }`}
            onClick={onApplyClick}
            disabled={!canApply}
          >
            {canApply ? (
              <>
                {submissionCount > 0
                  ? "Submit Another Nomination"
                  : "Apply for Nomination"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-5 w-5" />
                Maximum Nominations Reached
              </>
            )}
          </Button>
          {submissionCount > 0 && canApply && (
            <p className="text-sm text-slate-500">
              Your previous form data will be pre-filled. You can edit and
              submit.
            </p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

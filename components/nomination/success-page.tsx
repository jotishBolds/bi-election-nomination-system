// components/nomination/success-page.tsx
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
import { Separator } from "@/components/ui/separator";

import {
  CheckCircle,
  Download,
  Home,
  Calendar,
  Clock,
  FileText,
  Printer,
  Mail,
  AlertCircle,
} from "lucide-react";
import { useNomination } from "@/app/context/nomination-context";

interface SuccessPageProps {
  onGoHome: () => void;
}

export function SuccessPage({ onGoHome }: SuccessPageProps) {
  const { formData } = useNomination();

  const applicationId = `NOM-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const submissionDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const submissionTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const slaItems = [
    {
      icon: FileText,
      title: "Document Verification",
      timeline: "24-48 hours",
      description: "Your documents will be verified by the election office",
    },
    {
      icon: Mail,
      title: "Email Confirmation",
      timeline: "Within 1 hour",
      description: "Detailed receipt will be sent to your registered email",
    },
    {
      icon: Calendar,
      title: "Scrutiny Date",
      timeline: "XXXXX XX, XXXX",
      description: "Appear for scrutiny at the designated venue",
    },
    {
      icon: Clock,
      title: "Final Decision",
      timeline: "XXXXX XX, XXXX",
      description: "List of valid nominations will be published",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen bg-gradient-to-br  p-4 md:p-8"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5, delay: 0.3 }}
            className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="w-14 h-14 text-green-600" />
          </motion.div>
          <h1 className="text-3xl font-bold text-green-700">
            Online Application Submitted Successfully!
          </h1>
          <p className="text-muted-foreground">
            Your nomination has been received and is being processed
          </p>
        </motion.div>

        {/* Important Alert Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-amber-200 bg-amber-50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-800 mb-1">
                    Important: In-Person Verification Required
                  </h4>
                  <p className="text-sm text-amber-700">
                    After submitting online, you must visit the Returning
                    Officer (RO) in person to complete your nomination.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Application Details Card */}
        <Card className="shadow-xl border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg text-green-800">
                  Application Reference
                </CardTitle>
                <CardDescription>Keep this for your records</CardDescription>
              </div>
              <Badge className="bg-green-600 text-white text-lg px-4 py-1">
                {applicationId}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Applicant Name
                  </p>
                  <p className="font-semibold">{formData.candidateName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Municipality</p>
                  <p className="font-semibold">{formData.municipality}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ward</p>
                  <p className="font-semibold">{formData.municipalWard}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Submission Date
                  </p>
                  <p className="font-semibold">{submissionDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Submission Time
                  </p>
                  <p className="font-semibold">{submissionTime}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Payment Status
                  </p>
                  <Badge className="bg-green-100 text-green-800">
                    Completed
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SLA Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Processing Timeline (SLA)
            </CardTitle>
            <CardDescription>
              What happens next with your nomination
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {slaItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-lg bg-muted/30"
                >
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold">{item.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {item.timeline}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-yellow-800 mb-2">
              Important Notes:
            </h4>
            <ul className="text-sm text-yellow-700 space-y-2">
              <li>• Please bring a printed copy of this form to the RO</li>
              <li>
                • Original documents must be presented to the RO during
                verification
              </li>
              <li>• Contact helpdesk at 1800-XXX-XXXX for any queries</li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          {/* <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Print Acknowledgment
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button> */}
          <Button
            className="bg-primary hover:bg-primary-hover gap-2"
            onClick={onGoHome}
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

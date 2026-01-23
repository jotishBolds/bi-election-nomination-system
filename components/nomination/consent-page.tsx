// components/nomination/consent-page.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react";

interface ConsentPageProps {
  onAccept: () => void;
  onBack: () => void;
}

const consentItems = [
  "All information provided is true and correct to the best of my knowledge",
  "Providing false information may lead to rejection and legal action",
  "I am eligible to contest elections as per Municipality Act and Election Rules",
  "I agree to abide by the Model Code of Conduct and Election Commission guidelines",
  "Application fee is non-refundable regardless of nomination outcome",
  "I consent to verification of my documents and personal information",
  "Incomplete or incorrect applications may be rejected without notice",
];

export function ConsentPage({ onAccept, onBack }: ConsentPageProps) {
  const [mainConsent, setMainConsent] = useState(false);

  const canProceed = mainConsent;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-primary-light to-white p-4 md:p-8"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="mx-auto">
            <img
              src="/main-logo.png"
              alt="Declaration & Consent"
              className="h-16 w-auto mx-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-primary">
            Declaration & Consent
          </h1>
          <p className="text-muted-foreground">
            Please read and accept all terms before proceeding
          </p>
        </motion.div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Terms and Conditions
            </CardTitle>
            <CardDescription>
              Please read and accept the terms below to proceed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px] pr-4">
              <div className="space-y-3">
                {consentItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 text-sm"
                  >
                    <span className="text-primary font-bold mt-1">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-6 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="main-consent"
                  checked={mainConsent}
                  onCheckedChange={(checked) =>
                    setMainConsent(checked as boolean)
                  }
                  className="mt-1"
                />
                <label htmlFor="main-consent" className="text-sm font-medium">
                  I have read, understood, and agree to all the above
                  declarations. I wish to proceed with my nomination
                  application.
                </label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              className="bg-primary hover:bg-primary-hover"
              disabled={!canProceed}
              onClick={onAccept}
            >
              Proceed to Form
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </motion.div>
  );
}

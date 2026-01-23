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
  "I hereby declare that all information provided in this nomination form is true and correct to the best of my knowledge and belief.",
  "I understand that providing false information may lead to rejection of my nomination and legal action as per the applicable laws.",
  "I confirm that I am eligible to contest elections as per the provisions of the Municipality Act and Election Rules.",
  "I agree to abide by the Model Code of Conduct and all guidelines issued by the Election Commission.",
  "I understand that the application fee is non-refundable regardless of the outcome of my nomination.",
  "I consent to the verification of my documents and personal information by the concerned authorities.",
  "I acknowledge that incomplete or incorrect applications may be rejected without further notice.",
];

export function ConsentPage({ onAccept, onBack }: ConsentPageProps) {
  const [acceptedItems, setAcceptedItems] = useState<boolean[]>(
    new Array(consentItems.length).fill(false),
  );
  const [mainConsent, setMainConsent] = useState(false);

  const allItemsAccepted = acceptedItems.every((item) => item);
  const canProceed = allItemsAccepted && mainConsent;

  const toggleItem = (index: number) => {
    const newItems = [...acceptedItems];
    newItems[index] = !newItems[index];
    setAcceptedItems(newItems);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-primary-light to-white p-4 md:p-8"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary-foreground" />
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
              You must accept all the following declarations to proceed with
              nomination
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {consentItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${
                      acceptedItems[index]
                        ? "bg-green-50 border-green-200"
                        : "bg-muted/30 border-muted"
                    }`}
                  >
                    <Checkbox
                      id={`consent-${index}`}
                      checked={acceptedItems[index]}
                      onCheckedChange={() => toggleItem(index)}
                      className="mt-1"
                    />
                    <label
                      htmlFor={`consent-${index}`}
                      className="text-sm leading-relaxed cursor-pointer"
                    >
                      {item}
                    </label>
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
                  disabled={!allItemsAccepted}
                  className="mt-1"
                />
                <label
                  htmlFor="main-consent"
                  className={`text-sm font-medium ${
                    !allItemsAccepted ? "text-muted-foreground" : ""
                  }`}
                >
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

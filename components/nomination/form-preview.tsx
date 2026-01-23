// components/nomination/form-preview.tsx
"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { ArrowLeft, CreditCard, Printer, FileText } from "lucide-react";
import { useNomination } from "@/app/context/nomination-context";

interface FormPreviewProps {
  onProceedToPayment: () => void;
  onBack: () => void;
}

export function FormPreview({ onProceedToPayment, onBack }: FormPreviewProps) {
  const { formData } = useNomination();
  const printRef = useRef<HTMLDivElement>(null);
  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: "General",
      sc: "Scheduled Caste",
      st_bl: "Scheduled Tribe (BL)",
      st_lt: "Scheduled Tribe (LT)",
      obc_central: "OBC (Central List)",
      obc_state: "OBC (State List)",
    };
    return labels[category] || category;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Preview Nomination Form
        </h2>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      <Card className="shadow-lg print:shadow-none" ref={printRef}>
        <CardContent className="p-8 font-serif">
          {/* Form Header */}
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-xl font-bold">FORM-18</h1>
            <p className="text-sm text-muted-foreground">
              [See sub-rule (3) of rule 25]
            </p>
            <h2 className="text-lg font-bold underline">NOMINATION PAPER</h2>
          </div>

          <Separator className="my-6" />

          {/* Proposer Section */}
          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              * I nominate as a candidate for election to the{" "}
              <span className="border-b border-black px-2 font-medium min-w-[200px] inline-block">
                {formData.municipality}
              </span>{" "}
              Municipality from the{" "}
              <span className="border-b border-black px-2 font-medium min-w-[150px] inline-block">
                {formData.municipalWard}
              </span>{" "}
              Municipal ward.
            </p>

            <div className="grid grid-cols-1 gap-3 mt-4">
              <p>
                Candidate's name:{" "}
                <span className="border-b border-black px-2 font-medium min-w-[300px] inline-block">
                  {formData.candidateName}
                </span>
              </p>
              <p>
                Father's / Husband's name:{" "}
                <span className="border-b border-black px-2 font-medium min-w-[250px] inline-block">
                  {formData.fatherOrHusbandName}
                </span>
              </p>
              <p>
                Full postal address:{" "}
                <span className="border-b border-black px-2 font-medium min-w-[350px] inline-block">
                  {formData.fullPostalAddress}
                </span>
              </p>
            </div>

            <p className="mt-4">
              His name is entered at Serial No.{" "}
              <span className="border-b border-black px-2 font-medium">
                {formData.serialNoCandidate}
              </span>{" "}
              in Part No.{" "}
              <span className="border-b border-black px-2 font-medium">
                {formData.partNoCandidate}
              </span>{" "}
              of electoral roll of the Municipality.
            </p>

            <p className="mt-4">
              My name is{" "}
              <span className="border-b border-black px-2 font-medium">
                {formData.proposerName}
              </span>{" "}
              and it is entered at Serial No.{" "}
              <span className="border-b border-black px-2 font-medium">
                {formData.proposerSerialNo}
              </span>{" "}
              in Part No.{" "}
              <span className="border-b border-black px-2 font-medium">
                {formData.proposerPartNo}
              </span>{" "}
              of the electoral roll of the Municipality.
            </p>

            <div className="flex justify-between mt-6">
              <p>
                Date:{" "}
                <span className="border-b border-black px-2 font-medium">
                  {currentDate}
                </span>
              </p>
              <p className="text-right">
                ________________________
                <br />
                <span className="text-xs">(Signature of the proposer)</span>
              </p>
            </div>

            <p className="text-xs italic mt-2">
              * Appropriate particulars of the election to be inserted here.
            </p>
          </div>

          <Separator className="my-6" />

          {/* Candidate Declaration Section */}
          <div className="space-y-4 text-sm leading-relaxed">
            <p className="font-medium">
              I, the above mentioned candidate, assent to this nomination and
              hereby declare:-
            </p>

            <div className="ml-4 space-y-2">
              <p>
                (a) that I have completed{" "}
                <span className="border-b border-black px-2 font-medium">
                  {formData.age}
                </span>{" "}
                years of age.
              </p>

              <p>
                (b) that the symbols I have chosen are in order of preference:
              </p>
              <div className="ml-8 space-y-1">
                <p>
                  (i){" "}
                  <span className="border-b border-black px-2 font-medium min-w-[150px] inline-block">
                    {formData.symbolPreference1}
                  </span>
                </p>
                <p>
                  (ii){" "}
                  <span className="border-b border-black px-2 font-medium min-w-[150px] inline-block">
                    {formData.symbolPreference2 || "_______________"}
                  </span>
                </p>
                <p>
                  (iii){" "}
                  <span className="border-b border-black px-2 font-medium min-w-[150px] inline-block">
                    {formData.symbolPreference3 || "_______________"}
                  </span>
                </p>
              </div>

              <p>
                (c) that I am set up at this election by{" "}
                <span className="border-b border-black px-2 font-medium">
                  {formData.politicalParty}
                </span>{" "}
                Political Party.
              </p>

              <p>
                (d) that my name and my *father's / husband's name have been
                correctly spelt out above;
              </p>

              <p>
                (e) that to the best of my knowledge and belief, I am qualified
                and not also disqualified for being chosen to fill the seat in
                the{" "}
                <span className="border-b border-black px-2 font-medium">
                  {formData.municipality}
                </span>{" "}
                Municipality.
              </p>

              {formData.category !== "general" && (
                <p>
                  * I further declare that I am a member of the{" "}
                  <span className="border-b border-black px-2 font-medium">
                    {formData.casteTribeName}
                  </span>{" "}
                  caste/tribe,
                  <br />
                  which is a{" "}
                  <span className="font-medium">
                    {getCategoryLabel(formData.category)}
                  </span>{" "}
                  of the State of Sikkim.
                </p>
              )}
            </div>

            <div className="flex justify-between mt-6">
              <p>
                Date:{" "}
                <span className="border-b border-black px-2 font-medium">
                  {currentDate}
                </span>
              </p>
              <p className="text-right">
                ________________________
                <br />
                <span className="text-xs">(Signature of candidate)</span>
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Official Use Section */}
          <div className="space-y-4 text-sm bg-muted/30 p-4 rounded-lg">
            <p className="font-medium text-center">
              (To be filled by the Municipality Returning Officer)
            </p>

            <p>
              Serial No. of the nomination paper:{" "}
              <span className="border-b border-black px-2 min-w-[150px] inline-block">
                _______________
              </span>
            </p>
            <p>
              This nomination was delivered to me at my office at:{" "}
              <span className="border-b border-black px-2 min-w-[100px] inline-block">
                _______________
              </span>
            </p>

            <div className="flex justify-between mt-4">
              <p>
                Date:{" "}
                <span className="border-b border-black px-2">
                  _______________
                </span>
              </p>
              <p>Municipal Returning Officer</p>
            </div>
          </div>

          <Separator className="my-6 border-dashed" />

          {/* Receipt Section */}
          <div className="space-y-4 text-sm bg-primary/5 p-4 rounded-lg">
            <p className="font-medium text-center">
              Receipt for nomination paper and notice of scrutiny
              <br />
              <span className="text-xs font-normal">
                (to be handed over to the person presenting the nomination
                paper)
              </span>
            </p>

            <p>
              Serial No. of nomination paper:{" "}
              <span className="border-b border-black px-2">
                _______________
              </span>
            </p>
            <p>
              The nomination paper of{" "}
              <span className="border-b border-black px-2 font-medium">
                {formData.candidateName}
              </span>
              <br />a candidate for election from ward No.{" "}
              <span className="border-b border-black px-2 font-medium">
                {formData.municipalWard}
              </span>{" "}
              of the{" "}
              <span className="border-b border-black px-2 font-medium">
                {formData.municipality}
              </span>
              <br />
              Municipality was delivered to me at my office at _________ (hour)
              on _________ (date) by the *candidate/proposer.
            </p>
            <p>
              All nomination papers will be taken up for scrutiny at _________
              (hour) on _________ (date) at _________ (place)
            </p>

            <p className="text-xs italic">
              *Strike out the word not applicable.
            </p>

            <div className="flex justify-between mt-4">
              <p>
                Date:{" "}
                <span className="border-b border-black px-2">
                  _______________
                </span>
              </p>
              <p>Municipal Returning Officer</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 print:hidden">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Edit Form
        </Button>
        <Button
          className="bg-primary hover:bg-primary-hover"
          // onClick={onProceedToPayment}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Proceed to Payment
        </Button>
      </div>
    </motion.div>
  );
}

// components/nomination/form-preview.tsx
"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

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
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "", "height=800,width=800");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>FORM-18 - Nomination Paper</title>
          <style>
            @media print {
              body {
                font-family: 'Times New Roman', serif;
                font-size: 12pt;
                line-height: 1.6;
                padding: 20px;
                margin: 0;
              }
              .no-print { display: none !important; }
              .print-header {
                text-align: center;
                margin-bottom: 20px;
              }
              .print-header h1 {
                font-size: 18pt;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .print-header h2 {
                font-size: 14pt;
                text-decoration: underline;
                margin-bottom: 10px;
              }
              .print-header p {
                font-size: 10pt;
                color: #666;
              }
              .field-value {
                border-bottom: 1px solid #000;
                padding: 0 8px;
                min-width: 150px;
                display: inline-block;
              }
              .section {
                margin: 20px 0;
                padding: 15px;
                border: 1px solid #ddd;
              }
              .signature-line {
                border-top: 1px solid #000;
                width: 200px;
                margin-top: 30px;
                text-align: center;
                font-size: 10pt;
              }
              .symbol-image {
                width: 80px;
                height: 80px;
                object-fit: contain;
                border: 1px solid #ddd;
                padding: 5px;
              }
            }
            body {
              font-family: 'Times New Roman', serif;
              font-size: 12pt;
              line-height: 1.6;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .print-header {
              text-align: center;
              margin-bottom: 20px;
            }
            .print-header h1 {
              font-size: 18pt;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .print-header h2 {
              font-size: 14pt;
              text-decoration: underline;
              margin-bottom: 10px;
            }
            .print-header p {
              font-size: 10pt;
              color: #666;
            }
            .field-value {
              border-bottom: 1px solid #000;
              padding: 0 8px;
              min-width: 150px;
              display: inline-block;
              font-weight: 500;
            }
            .section {
              margin: 20px 0;
              padding: 15px;
              border: 1px solid #ddd;
              background: #f9f9f9;
            }
            .section-title {
              font-weight: bold;
              margin-bottom: 10px;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #000;
              width: 200px;
              margin-top: 30px;
              padding-top: 5px;
              text-align: center;
              font-size: 10pt;
            }
            .flex-between {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 20px;
            }
            .symbol-container {
              display: flex;
              align-items: center;
              gap: 15px;
              margin: 10px 0;
              padding: 10px;
              background: #f0f0f0;
              border-radius: 5px;
            }
            .symbol-image {
              width: 80px;
              height: 80px;
              object-fit: contain;
              border: 1px solid #ddd;
              background: white;
              padding: 5px;
            }
            hr {
              border: none;
              border-top: 1px dashed #ccc;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Preview Nomination Form
        </h2>
        {/* Print button hidden as per requirement */}
        {/*
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        */}
      </div>

      <Card className="shadow-lg print:shadow-none" ref={printRef}>
        <CardContent className="p-8 font-serif">
          {/* Form Header */}
          <div className="print-header text-center space-y-2 mb-6">
            <h1 className="text-xl font-bold">FORM-18</h1>
            <p className="text-sm text-muted-foreground">
              [See sub-rule (3) of rule 25]
            </p>
            <h2 className="text-lg font-bold underline">NOMINATION PAPER</h2>
            <p className="text-sm text-muted-foreground">
              Municipality Election 2026
            </p>
          </div>

          <Separator className="my-6" />

          {/* Location Details - Commented out as per requirement */}
          {/*
          <div className="section bg-muted/20 p-4 rounded-lg mb-6">
            <p className="section-title font-medium text-center mb-3">
              Election Details
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">District</p>
                <p className="font-semibold">{formData.district}</p>
              </div>
              <div>
                <p className="text-muted-foreground">ULB/Municipality</p>
                <p className="font-semibold">{formData.municipality}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ward</p>
                <p className="font-semibold">{formData.municipalWard}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Constituency</p>
                <p className="font-semibold">
                  {formData.constituency || "N/A"}
                </p>
              </div>
            </div>
          </div>
          */}

          {/* Proposer Section */}
          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              * I nominate as an applicant for election to the{" "}
              <span className="field-value border-b border-black px-2 font-medium min-w-[200px] inline-block">
                {formData.municipality}
              </span>{" "}
              Municipality from the{" "}
              <span className="field-value border-b border-black px-2 font-medium min-w-[150px] inline-block">
                {formData.municipalWard}
              </span>{" "}
              Municipal ward.
            </p>

            <div className="grid grid-cols-1 gap-3 mt-4">
              <p>
                Applicant's name:{" "}
                <span className="field-value border-b border-black px-2 font-medium min-w-[300px] inline-block">
                  {formData.candidateName}
                </span>
              </p>
              <p>
                Father's / Husband's name:{" "}
                <span className="field-value border-b border-black px-2 font-medium min-w-[250px] inline-block">
                  {formData.fatherOrHusbandName}
                </span>
              </p>
              <p>
                Full postal address:{" "}
                <span className="field-value border-b border-black px-2 font-medium min-w-[350px] inline-block">
                  {formData.fullPostalAddress}
                </span>
              </p>
            </div>

            <p className="mt-4">
              His name is entered at Serial No.{" "}
              <span className="field-value border-b border-black px-2 font-medium">
                {formData.serialNoCandidate}
              </span>{" "}
              in Part No.{" "}
              <span className="field-value border-b border-black px-2 font-medium">
                {formData.partNoCandidate}
              </span>{" "}
              of electoral roll of the Municipality.
            </p>

            <p className="mt-4">
              My name is{" "}
              <span className="field-value border-b border-black px-2 font-medium">
                {formData.proposerName}
              </span>{" "}
              and it is entered at Serial No.{" "}
              <span className="field-value border-b border-black px-2 font-medium">
                {formData.proposerSerialNo}
              </span>{" "}
              in Part No.{" "}
              <span className="field-value border-b border-black px-2 font-medium">
                {formData.proposerPartNo}
              </span>{" "}
              of the electoral roll of the Municipality.
            </p>

            <div className="flex-between flex justify-between mt-6">
              <p>
                Date:{" "}
                <span className="field-value border-b border-black px-2 font-medium">
                  {currentDate}
                </span>
              </p>
              <div className="text-right">
                <div className="signature-line">
                  ________________________
                  <br />
                  <span className="text-xs">(Signature of the proposer)</span>
                </div>
              </div>
            </div>

            <p className="text-xs italic mt-2">
              * Appropriate particulars of the election to be inserted here.
            </p>
          </div>

          <Separator className="my-6" />

          {/* Applicant Declaration Section */}
          <div className="space-y-4 text-sm leading-relaxed">
            <p className="font-medium">
              I, the above mentioned applicant, assent to this nomination and
              hereby declare:-
            </p>

            <div className="ml-4 space-y-2">
              <p>
                (a) that I have completed{" "}
                <span className="field-value border-b border-black px-2 font-medium">
                  {formData.age}
                </span>{" "}
                years of age.
              </p>

              <p>(b) that the symbol I have chosen is:</p>
              <div className="symbol-container flex items-center gap-4 p-3 bg-muted/30 rounded-lg ml-8">
                {formData.partySymbolImage && (
                  <div className="relative w-16 h-16 border rounded bg-white p-1">
                    <Image
                      src={formData.partySymbolImage}
                      alt={formData.partySymbol}
                      fill
                      className="object-contain symbol-image"
                    />
                  </div>
                )}
                <div>
                  <p className="font-semibold">{formData.partySymbol}</p>
                  <Badge variant="outline" className="mt-1">
                    {formData.politicalParty}
                  </Badge>
                </div>
              </div>

              <p>
                (c) that I am set up at this election by{" "}
                <span className="field-value border-b border-black px-2 font-medium">
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
                <span className="field-value border-b border-black px-2 font-medium">
                  {formData.municipality}
                </span>{" "}
                Municipality.
              </p>

              {formData.category !== "general" && (
                <p>
                  * I further declare that I am a member of the{" "}
                  <span className="field-value border-b border-black px-2 font-medium">
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

            <div className="flex-between flex justify-between mt-6">
              <p>
                Date:{" "}
                <span className="field-value border-b border-black px-2 font-medium">
                  {currentDate}
                </span>
              </p>
              <div className="text-right">
                <div className="signature-line">
                  ________________________
                  <br />
                  <span className="text-xs">(Signature of applicant)</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Official Use Section */}
          <div className="section space-y-4 text-sm bg-muted/30 p-4 rounded-lg">
            <p className="section-title font-medium text-center">
              (To be filled by the Municipality Returning Officer)
            </p>

            <p>
              Serial No. of the nomination paper:{" "}
              <span className="signature-line">_______________</span>
            </p>
            <p>
              This nomination was delivered to me at my office at:{" "}
              <span className="signature-line">_______________</span>
            </p>

            <div className="flex-between flex justify-between mt-4">
              <p>
                Date: <span className="signature-line">_______________</span>
              </p>
              <p>Municipal Returning Officer</p>
            </div>
          </div>

          {/* Receipt Section - Commented out as per requirement */}
          {/* 
          <Separator className="my-6 border-dashed" />
          <div className="space-y-4 text-sm bg-primary/5 p-4 rounded-lg">
            <p className="font-medium text-center">
              Receipt for nomination paper and notice of scrutiny
              <br />
              <span className="text-xs font-normal">
                (to be handed over to the person presenting the nomination
                paper)
              </span>
            </p>
            ... Receipt content ...
          </div>
          */}
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
          onClick={onProceedToPayment}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Proceed to Payment
        </Button>
      </div>
    </motion.div>
  );
}

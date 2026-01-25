// components/nomination/form-preview.tsx
"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import html2PDF from "jspdf-html2canvas";

import {
  ArrowLeft,
  CreditCard,
  FileText,
  Download,
  Loader2,
} from "lucide-react";
import { useNomination } from "@/app/context/nomination-context";

interface FormPreviewProps {
  onProceedToPayment: () => void;
  onBack: () => void;
}

export function FormPreview({ onProceedToPayment, onBack }: FormPreviewProps) {
  const { formData } = useNomination();
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const generatePDF = async () => {
    const printContent = printRef.current;
    if (!printContent) return;

    setIsGenerating(true);

    try {
      await html2PDF(printContent, {
        jsPDF: {
          unit: "pt",
          format: "a4",
          orientation: "portrait",
        },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          scrollX: 0,
          scrollY: -window.scrollY,
          logging: false,
        },
        imageType: "image/jpeg",
        imageQuality: 0.98,
        margin: {
          top: 40,
          right: 40,
          bottom: 40,
          left: 40,
        },
        autoResize: true,
        output: `FORM-18_Nomination_${formData.candidateName?.replace(/\s+/g, "_") || "Paper"}.pdf`,
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
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
        <Button
          variant="outline"
          size="sm"
          onClick={generatePDF}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </>
          )}
        </Button>
      </div>

      {/* PDF Content Container */}
      <Card className="shadow-lg print:shadow-none overflow-hidden">
        <div
          ref={printRef}
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: "12pt",
            lineHeight: "1.6",
            backgroundColor: "#ffffff",
            color: "#000000",
            padding: "40px",
            maxWidth: "100%",
          }}
        >
          {/* Form Header */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h1
              style={{
                fontSize: "18pt",
                fontWeight: "bold",
                margin: "0 0 8px 0",
              }}
            >
              FORM-18
            </h1>
            <p
              style={{
                fontSize: "10pt",
                color: "#666666",
                margin: "0 0 8px 0",
              }}
            >
              [See sub-rule (3) of rule 25]
            </p>
            <h2
              style={{
                fontSize: "14pt",
                fontWeight: "bold",
                textDecoration: "underline",
                margin: "0 0 8px 0",
              }}
            >
              NOMINATION PAPER
            </h2>
            <p
              style={{
                fontSize: "11pt",
                color: "#666666",
                margin: "0",
              }}
            >
              Municipality Election 2026
            </p>
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid #e0e0e0",
              margin: "20px 0",
            }}
          />

          {/* Proposer Section */}
          <div style={{ marginBottom: "24px" }}>
            <p style={{ margin: "12px 0" }}>
              * I nominate as an applicant for election to the{" "}
              <span
                style={{
                  borderBottom: "1px solid #000",
                  padding: "0 8px",
                  fontWeight: "500",
                  display: "inline-block",
                  minWidth: "200px",
                }}
              >
                {formData.municipality}
              </span>{" "}
              Municipality from the{" "}
              <span
                style={{
                  borderBottom: "1px solid #000",
                  padding: "0 8px",
                  fontWeight: "500",
                  display: "inline-block",
                  minWidth: "150px",
                }}
              >
                {formData.municipalWard}
              </span>{" "}
              Municipal ward.
            </p>

            <p style={{ margin: "12px 0" }}>
              Applicant's name:{" "}
              <span
                style={{
                  borderBottom: "1px solid #000",
                  padding: "0 8px",
                  fontWeight: "500",
                  display: "inline-block",
                  minWidth: "280px",
                }}
              >
                {formData.candidateName}
              </span>
            </p>

            <p style={{ margin: "12px 0" }}>
              Father's / Husband's name:{" "}
              <span
                style={{
                  borderBottom: "1px solid #000",
                  padding: "0 8px",
                  fontWeight: "500",
                  display: "inline-block",
                  minWidth: "230px",
                }}
              >
                {formData.fatherOrHusbandName}
              </span>
            </p>

            <p style={{ margin: "12px 0" }}>
              Full postal address:{" "}
              <span
                style={{
                  borderBottom: "1px solid #000",
                  padding: "0 8px",
                  fontWeight: "500",
                  display: "inline-block",
                  minWidth: "300px",
                }}
              >
                {formData.fullPostalAddress}
              </span>
            </p>

            {/*
            <p style={{ margin: "16px 0" }}>
              His name is entered at Serial No.{" "}
              <span
                style={{
                  borderBottom: "1px solid #000",
                  padding: "0 8px",
                  fontWeight: "500",
                  display: "inline-block",
                  minWidth: "60px",
                }}
              >
                {formData.serialNoCandidate || "___"}
              </span>{" "}
              in Part No.{" "}
              <span
                style={{
                  borderBottom: "1px solid #000",
                  padding: "0 8px",
                  fontWeight: "500",
                  display: "inline-block",
                  minWidth: "60px",
                }}
              >
                {formData.partNoCandidate || "___"}
              </span>{" "}
              of electoral roll of the Municipality.
            </p>
            */}

            <p style={{ margin: "16px 0" }}>
              My name is{" "}
              <span
                style={{
                  borderBottom: "1px solid #000",
                  padding: "0 8px",
                  fontWeight: "500",
                  display: "inline-block",
                  minWidth: "120px",
                }}
              >
                {formData.proposerName}
              </span>{" "}
              and it is entered at Serial No.{" "}
              <span
                style={{
                  borderBottom: "1px solid #000",
                  padding: "0 8px",
                  fontWeight: "500",
                  display: "inline-block",
                  minWidth: "60px",
                }}
              >
                {formData.proposerSerialNo}
              </span>{" "}
              in Part No.{" "}
              <span
                style={{
                  borderBottom: "1px solid #000",
                  padding: "0 8px",
                  fontWeight: "500",
                  display: "inline-block",
                  minWidth: "60px",
                }}
              >
                {formData.proposerPartNo}
              </span>{" "}
              of the electoral roll of the Municipality.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginTop: "24px",
              }}
            >
              <p style={{ margin: "0" }}>
                Date:{" "}
                <span
                  style={{
                    borderBottom: "1px solid #000",
                    padding: "0 8px",
                    fontWeight: "500",
                    display: "inline-block",
                    minWidth: "140px",
                  }}
                >
                  {currentDate}
                </span>
              </p>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    borderTop: "1px solid #000",
                    width: "200px",
                    paddingTop: "5px",
                    marginTop: "30px",
                  }}
                >
                  <span style={{ fontSize: "10pt" }}>
                    (Signature of the proposer)
                  </span>
                </div>
              </div>
            </div>

            <p
              style={{
                fontStyle: "italic",
                fontSize: "10pt",
                marginTop: "12px",
              }}
            >
              * Appropriate particulars of the election to be inserted here.
            </p>
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid #e0e0e0",
              margin: "20px 0",
            }}
          />

          {/* Applicant Declaration Section */}
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontWeight: "500", marginBottom: "16px" }}>
              I, the above mentioned applicant, assent to this nomination and
              hereby declare:-
            </p>

            <div style={{ marginLeft: "20px" }}>
              <p style={{ margin: "10px 0" }}>
                (a) that I have completed{" "}
                <span
                  style={{
                    borderBottom: "1px solid #000",
                    padding: "0 8px",
                    fontWeight: "500",
                    display: "inline-block",
                    minWidth: "40px",
                  }}
                >
                  {formData.age}
                </span>{" "}
                years of age.
              </p>

              <p style={{ margin: "10px 0" }}>
                (b) that the symbol I have chosen is:
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  margin: "12px 0 12px 30px",
                  padding: "12px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "6px",
                }}
              >
                {formData.partySymbolImage && (
                  <img
                    src={formData.partySymbolImage}
                    alt={formData.partySymbol}
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "contain",
                      border: "1px solid #ddd",
                      backgroundColor: "white",
                      padding: "4px",
                      borderRadius: "4px",
                    }}
                  />
                )}
                <div>
                  <p style={{ fontWeight: "600", margin: "0 0 4px 0" }}>
                    {formData.partySymbol}
                  </p>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 10px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "10pt",
                      backgroundColor: "#fff",
                    }}
                  >
                    {formData.politicalParty}
                  </span>
                </div>
              </div>

              <p style={{ margin: "10px 0" }}>
                (c) that I am set up at this election by{" "}
                <span
                  style={{
                    borderBottom: "1px solid #000",
                    padding: "0 8px",
                    fontWeight: "500",
                    display: "inline-block",
                    minWidth: "180px",
                  }}
                >
                  {formData.politicalParty}
                </span>{" "}
                Political Party.
              </p>

              <p style={{ margin: "10px 0" }}>
                (d) that my name and my *father's / husband's name have been
                correctly spelt out above;
              </p>

              <p style={{ margin: "10px 0" }}>
                (e) that to the best of my knowledge and belief, I am qualified
                and not also disqualified for being chosen to fill the seat in
                the{" "}
                <span
                  style={{
                    borderBottom: "1px solid #000",
                    padding: "0 8px",
                    fontWeight: "500",
                    display: "inline-block",
                    minWidth: "200px",
                  }}
                >
                  {formData.municipality}
                </span>{" "}
                Municipality.
              </p>

              {formData.category !== "general" && (
                <p style={{ margin: "10px 0" }}>
                  * I further declare that I am a member of the{" "}
                  <span
                    style={{
                      borderBottom: "1px solid #000",
                      padding: "0 8px",
                      fontWeight: "500",
                      display: "inline-block",
                      minWidth: "150px",
                    }}
                  >
                    {formData.casteTribeName}
                  </span>{" "}
                  caste/tribe, which is a{" "}
                  <strong>{getCategoryLabel(formData.category)}</strong> of the
                  State of Sikkim.
                </p>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginTop: "24px",
              }}
            >
              <p style={{ margin: "0" }}>
                Date:{" "}
                <span
                  style={{
                    borderBottom: "1px solid #000",
                    padding: "0 8px",
                    fontWeight: "500",
                    display: "inline-block",
                    minWidth: "140px",
                  }}
                >
                  {currentDate}
                </span>
              </p>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    borderTop: "1px solid #000",
                    width: "200px",
                    paddingTop: "5px",
                    marginTop: "30px",
                  }}
                >
                  <span style={{ fontSize: "10pt" }}>
                    (Signature of applicant)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid #e0e0e0",
              margin: "20px 0",
            }}
          />

          {/* Official Use Section */}
          <div
            style={{
              padding: "16px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              backgroundColor: "#fafafa",
            }}
          >
            <p
              style={{
                fontWeight: "500",
                textAlign: "center",
                marginBottom: "16px",
              }}
            >
              (To be filled by the Municipality Returning Officer)
            </p>

            <p style={{ margin: "12px 0" }}>
              Serial No. of the nomination paper:{" "}
              <span
                style={{
                  borderBottom: "1px solid #000",
                  display: "inline-block",
                  minWidth: "150px",
                }}
              >
                &nbsp;
              </span>
            </p>

            <p style={{ margin: "12px 0" }}>
              This nomination was delivered to me at my office at:{" "}
              <span
                style={{
                  borderBottom: "1px solid #000",
                  display: "inline-block",
                  minWidth: "150px",
                }}
              >
                &nbsp;
              </span>
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginTop: "20px",
              }}
            >
              <p style={{ margin: "0" }}>
                Date:{" "}
                <span
                  style={{
                    borderBottom: "1px solid #000",
                    display: "inline-block",
                    minWidth: "120px",
                  }}
                >
                  &nbsp;
                </span>
              </p>
              <p style={{ fontWeight: "500", margin: "0" }}>
                Municipal Returning Officer
              </p>
            </div>
          </div>
        </div>
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

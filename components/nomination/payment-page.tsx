// components/nomination/payment-page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  FileText,
  X,
  Building2,
  Receipt,
} from "lucide-react";
import { useNomination } from "@/app/context/nomination-context";
import { otpSchema, OtpFormData } from "@/lib/auth/validations/auth";

// Hardcoded OTP for demo
const DEMO_OTP = "123456";

// BR Form Schema
const brSchema = z.object({
  brNumber: z.string().min(1, "BR Number is required"),
  document: z
    .any()
    .refine((file) => file !== null, "BR proof document is required"),
});

type BRFormData = z.infer<typeof brSchema>;
type PaymentStep = "br-details" | "otp";

interface PaymentPageProps {
  onPaymentSuccess: () => void;
  onBack: () => void;
}

export function PaymentPage({ onPaymentSuccess, onBack }: PaymentPageProps) {
  const { formData } = useNomination();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>("br-details");
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  const [declarations, setDeclarations] = useState({
    electoralRoll: false,
    notDisqualified: false,
    infoCorrect: false,
    noGuarantee: false,
    subjectToScrutiny: false,
    legalConsequences: false,
    termsAccepted: false,
  });

  const fee = 500;

  const brForm = useForm<BRFormData>({
    resolver: zodResolver(brSchema),
    defaultValues: { brNumber: "", document: null },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      brForm.setValue("document", file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    brForm.setValue("document", null);
  };

  const onBRSubmit = async (data: BRFormData) => {
    setIsProcessing(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsProcessing(false);
      setPaymentStep("otp");
    } catch {
      setError("Failed to submit BR details. Please try again.");
      setIsProcessing(false);
    }
  };

  const onOtpSubmit = async (data: OtpFormData) => {
    setError(null);
    setIsProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (data.otp === DEMO_OTP) {
        setIsProcessing(false);
        setShowInstructionsModal(true);
      } else {
        setError("Invalid OTP. Please try again. (Hint: Use 123456)");
        setIsProcessing(false);
      }
    } catch {
      setError("OTP verification failed");
      setIsProcessing(false);
    }
  };

  const handleFinalSubmit = () => {
    const allChecked = Object.values(declarations).every((val) => val);
    if (!allChecked) {
      setError("Please accept all declarations before proceeding");
      return;
    }
    setShowInstructionsModal(false);
    onPaymentSuccess();
  };

  const allDeclarationsChecked = Object.values(declarations).every(
    (val) => val,
  );

  const handleResendOtp = async () => {
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const handleBackFromOtp = () => {
    setPaymentStep("br-details");
    otpForm.reset();
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  ENS Sikkim
                </h1>
                <p className="text-xs text-muted-foreground">
                  Bank Reconciliation
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">
                Nomination Fee
              </p>
              <p className="text-2xl font-bold text-primary">₹{fee}.00</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress Indicator ── */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4">
            {/* Step 1 */}
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  paymentStep === "br-details"
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/20 text-primary"
                }`}
              >
                {paymentStep === "br-details" ? (
                  "1"
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
              </div>
              <span
                className={`font-medium text-sm ${
                  paymentStep === "br-details"
                    ? "text-foreground"
                    : "text-primary"
                }`}
              >
                BR Details
              </span>
            </div>

            <div className="w-12 h-0.5 bg-border" />

            {/* Step 2 */}
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  paymentStep === "otp"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </div>
              <span
                className={`font-medium text-sm ${
                  paymentStep === "otp"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Verification
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {paymentStep === "br-details" ? (
            <motion.div
              key="br-details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border border-border shadow-lg p-0">
                <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-6 w-6" />
                    <div>
                      <CardTitle className="text-xl pt-4">
                        Bank Reconciliation Details
                      </CardTitle>
                      <p className="text-primary-foreground/80 text-sm mt-1">
                        Provide your BR number and upload proof of payment
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <Form {...brForm}>
                    <form
                      onSubmit={brForm.handleSubmit(onBRSubmit)}
                      className="space-y-6"
                    >
                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      {/* BR Number */}
                      <FormField
                        control={brForm.control}
                        name="brNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground font-medium">
                              Bank Reconciliation Number
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter BR Number (e.g., BR123456789)"
                                className="h-12 text-lg border-input focus:border-primary focus:ring-ring"
                                {...field}
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground mt-1">
                              Enter the BR number from your bank transaction
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Document Upload */}
                      <FormField
                        control={brForm.control}
                        name="document"
                        render={() => (
                          <FormItem>
                            <FormLabel className="text-foreground font-medium">
                              Upload BR Proof Document
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-4">
                                {!uploadedFile ? (
                                  <label
                                    htmlFor="file-upload"
                                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-input rounded-lg cursor-pointer hover:border-primary hover:bg-secondary transition-colors"
                                  >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                      <Upload className="h-12 w-12 text-muted-foreground mb-3" />
                                      <p className="mb-2 text-sm text-foreground font-medium">
                                        Click to upload or drag and drop
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        PDF, PNG, JPG or JPEG (Max. 5MB)
                                      </p>
                                    </div>
                                    <input
                                      id="file-upload"
                                      type="file"
                                      className="hidden"
                                      accept=".pdf,.png,.jpg,.jpeg"
                                      onChange={handleFileChange}
                                    />
                                  </label>
                                ) : (
                                  <div className="border-2 border-primary/30 bg-secondary rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-start gap-3 flex-1">
                                        {previewUrl ? (
                                          <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-16 h-16 object-cover rounded border border-border"
                                          />
                                        ) : (
                                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                                            <FileText className="h-8 w-8 text-muted-foreground" />
                                          </div>
                                        )}
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-foreground">
                                            {uploadedFile.name}
                                          </p>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {(
                                              uploadedFile.size /
                                              1024 /
                                              1024
                                            ).toFixed(2)}{" "}
                                            MB
                                          </p>
                                          <div className="flex items-center gap-1 mt-2">
                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                            <span className="text-xs text-primary font-medium">
                                              File uploaded successfully
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={handleRemoveFile}
                                        className="text-destructive hover:text-destructive/80 p-1"
                                      >
                                        <X className="h-5 w-5" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <p className="text-xs text-muted-foreground mt-1">
                              Upload your bank receipt or transaction screenshot
                              as proof
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Info Alert */}
                      <Alert className="bg-secondary border-accent">
                        <AlertCircle className="h-4 w-4 text-primary" />
                        <AlertDescription className="text-secondary-foreground text-sm">
                          Please ensure that your BR number matches the document
                          you're uploading. This information will be verified
                          before processing your nomination.
                        </AlertDescription>
                      </Alert>

                      {/* Action Buttons */}
                      <div className="flex gap-4 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onBack}
                          disabled={isProcessing}
                          className="flex-1 h-12"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={isProcessing}
                          className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-medium"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Processing…
                            </>
                          ) : (
                            "Continue to Verification"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* ── OTP Step ── */
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="max-w-md mx-auto">
                <Card className="border border-border shadow-lg p-0">
                  <CardHeader className="bg-secondary border-b border-border text-center py-8 rounded-t-lg">
                    <div className="mx-auto w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-primary text-xl">
                      BR Details Submitted!
                    </CardTitle>
                    <p className="text-sm text-secondary-foreground mt-2">
                      Bank Reconciliation Number:{" "}
                      <strong>{brForm.getValues("brNumber")}</strong>
                    </p>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    <Alert className="bg-secondary border-accent">
                      <AlertCircle className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-secondary-foreground text-sm">
                        Enter the OTP sent to your registered mobile number to
                        complete your nomination submission.
                      </AlertDescription>
                    </Alert>

                    <Form {...otpForm}>
                      <form
                        onSubmit={otpForm.handleSubmit(onOtpSubmit)}
                        className="space-y-6"
                      >
                        {error && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}

                        <FormField
                          control={otpForm.control}
                          name="otp"
                          render={({ field }) => (
                            <FormItem className="flex flex-col items-center">
                              <Label className="mb-4 text-foreground font-medium">
                                Enter 6-digit OTP
                              </Label>
                              <FormControl>
                                <InputOTP
                                  maxLength={6}
                                  value={field.value}
                                  onChange={field.onChange}
                                >
                                  <InputOTPGroup>
                                    {[0, 1, 2, 3, 4, 5].map((i) => (
                                      <InputOTPSlot
                                        key={i}
                                        index={i}
                                        className="w-12 h-12 text-lg border-input"
                                      />
                                    ))}
                                  </InputOTPGroup>
                                </InputOTP>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex flex-col gap-3">
                          <Button
                            type="submit"
                            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-medium"
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Verifying…
                              </>
                            ) : (
                              "Verify & Submit Nomination"
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleBackFromOtp}
                            disabled={isProcessing}
                            className="h-12"
                          >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to BR Details
                          </Button>
                        </div>
                      </form>
                    </Form>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Didn't receive OTP?{" "}
                        <button
                          type="button"
                          className="text-primary hover:underline font-medium"
                          onClick={handleResendOtp}
                        >
                          Resend OTP
                        </button>
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
                      <p>
                        Demo OTP:{" "}
                        <strong className="text-foreground">123456</strong>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Instructions & Declarations Modal ── */}
      <Dialog
        open={showInstructionsModal}
        onOpenChange={setShowInstructionsModal}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="bg-primary text-primary-foreground p-6 pb-4">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <AlertCircle className="h-6 w-6" />
              Instructions to Candidates
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 text-sm mt-2">
              Please read carefully before proceeding with your nomination
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[calc(90vh-220px)]">
            <div className="p-6 space-y-6">
              {/* Instructions */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground text-lg">
                  Read Carefully Before Proceeding
                </h3>
                <ol className="space-y-3 text-sm text-foreground/80">
                  {[
                    "Ensure your name appears correctly in the electoral roll of the concerned Municipal ward.",
                    null, // placeholder for the complex item
                    "Verify spelling of name exactly as per electoral roll.",
                    "Ensure digital copies are clear and legible.",
                    "Review all entries before final submission.",
                    "Submit nomination before the last date notified under Rule 21.",
                    "After submission, download the final application form, print & sign it and submit it before the Municipal Returning Officer to confirm the nomination.",
                    "The Municipal Returning Officer will generate an acknowledgement receipt along with the scrutiny day details.",
                    "Attend scrutiny proceedings on the notified date.",
                  ].map((text, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="font-bold text-primary min-w-[24px]">
                        {idx + 1}.
                      </span>
                      {idx === 1 ? (
                        <div className="space-y-1">
                          <span>Keep ready:</span>
                          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                            <li>
                              Electoral Roll Number (Part Number and Serial
                              Number)
                            </li>
                            <li>Proposer's Electoral Roll details</li>
                            <li>Caste certificate (if applicable)</li>
                            <li>Proof of deposit payment</li>
                          </ul>
                        </div>
                      ) : (
                        <span>{text}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Declarations */}
              <div className="border-t border-border pt-6">
                <h3 className="font-semibold text-foreground text-lg mb-4">
                  Mandatory Declaration and Consent
                  <span className="text-destructive ml-1">*</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  All declarations must be accepted before submission
                </p>

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  {(
                    [
                      {
                        key: "electoralRoll",
                        label:
                          "I declare that my name is included in the electoral roll of the concerned Municipal ward.",
                      },
                      {
                        key: "notDisqualified",
                        label:
                          "I declare that I am not disqualified under the Sikkim Municipalities Act, 2007 and the Rules made thereunder.",
                      },
                      {
                        key: "infoCorrect",
                        label:
                          "I confirm that all information furnished by me is true and correct to the best of my knowledge.",
                      },
                      {
                        key: "noGuarantee",
                        label:
                          "I understand that submission of this form does not guarantee acceptance of nomination.",
                      },
                      {
                        key: "subjectToScrutiny",
                        label:
                          "I agree that my nomination is subject to scrutiny and decision by the Municipal Returning Officer as per Rule 28.",
                      },
                      {
                        key: "legalConsequences",
                        label:
                          "I understand that providing false information may attract legal consequences and rejection of nomination.",
                      },
                      {
                        key: "termsAccepted",
                        label:
                          "I have read and understood the Terms & Conditions and Instructions.",
                      },
                    ] as const
                  ).map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <Checkbox
                        id={key}
                        checked={declarations[key]}
                        onCheckedChange={(checked) =>
                          setDeclarations({
                            ...declarations,
                            [key]: checked as boolean,
                          })
                        }
                        className="mt-1 border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <label
                        htmlFor={key}
                        className="text-sm text-foreground/80 cursor-pointer leading-relaxed"
                      >
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Modal Footer */}
          <div className="border-t border-border p-6 bg-muted">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowInstructionsModal(false);
                  setError(null);
                }}
                className="flex-1 h-12"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleFinalSubmit}
                disabled={!allDeclarationsChecked}
                className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium disabled:bg-muted disabled:text-muted-foreground"
              >
                {allDeclarationsChecked ? (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Accept & Submit Nomination
                  </>
                ) : (
                  "Please Accept All Declarations"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// components/nomination/payment-page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import {
  CreditCard,
  Smartphone,
  Building2,
  ArrowLeft,
  Shield,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useNomination } from "@/app/context/nomination-context";
import { otpSchema, OtpFormData } from "@/lib/auth/validations/auth";

// Hardcoded OTP for demo
const DEMO_OTP = "123456";

type PaymentStep = "payment" | "otp";

interface PaymentPageProps {
  onPaymentSuccess: () => void;
  onBack: () => void;
}

export function PaymentPage({ onPaymentSuccess, onBack }: PaymentPageProps) {
  const { formData } = useNomination();
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>("payment");
  const [error, setError] = useState<string | null>(null);

  const fee =
    formData.category === "sc" ||
    formData.category === "st_bl" ||
    formData.category === "st_lt"
      ? 250
      : 500;

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    // After successful payment, show OTP verification
    setPaymentStep("otp");
  };

  const onOtpSubmit = async (data: OtpFormData) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Verify OTP (hardcoded for demo)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (data.otp === DEMO_OTP) {
        onPaymentSuccess();
      } else {
        setError("Invalid OTP. Please try again. (Hint: Use 123456)");
      }
    } catch {
      setError("OTP verification failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    // Simulate resending OTP
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const handleBackFromOtp = () => {
    setPaymentStep("payment");
    otpForm.reset();
    setError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary">
          {paymentStep === "payment" ? "Payment" : "Verify Payment"}
        </h2>
        <p className="text-muted-foreground">
          {paymentStep === "payment"
            ? "Complete payment to submit your nomination"
            : "Enter OTP to confirm your payment"}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {paymentStep === "payment" ? (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Select Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <div
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        paymentMethod === "upi"
                          ? "border-primary bg-primary/5"
                          : "border-muted"
                      }`}
                      onClick={() => setPaymentMethod("upi")}
                    >
                      <RadioGroupItem value="upi" id="upi" />
                      <Smartphone className="h-5 w-5 text-primary" />
                      <Label htmlFor="upi" className="cursor-pointer flex-1">
                        <span className="font-medium">UPI Payment</span>
                        <p className="text-xs text-muted-foreground">
                          Pay using Google Pay, PhonePe, Paytm
                        </p>
                      </Label>
                    </div>

                    <div
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        paymentMethod === "card"
                          ? "border-primary bg-primary/5"
                          : "border-muted"
                      }`}
                      onClick={() => setPaymentMethod("card")}
                    >
                      <RadioGroupItem value="card" id="card" />
                      <CreditCard className="h-5 w-5 text-primary" />
                      <Label htmlFor="card" className="cursor-pointer flex-1">
                        <span className="font-medium">Debit/Credit Card</span>
                        <p className="text-xs text-muted-foreground">
                          Visa, Mastercard, RuPay
                        </p>
                      </Label>
                    </div>

                    <div
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        paymentMethod === "netbanking"
                          ? "border-primary bg-primary/5"
                          : "border-muted"
                      }`}
                      onClick={() => setPaymentMethod("netbanking")}
                    >
                      <RadioGroupItem value="netbanking" id="netbanking" />
                      <Building2 className="h-5 w-5 text-primary" />
                      <Label
                        htmlFor="netbanking"
                        className="cursor-pointer flex-1"
                      >
                        <span className="font-medium">Net Banking</span>
                        <p className="text-xs text-muted-foreground">
                          All major banks supported
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === "upi" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3 pt-4"
                    >
                      <Label>Enter UPI ID</Label>
                      <Input placeholder="yourname@upi" />
                    </motion.div>
                  )}

                  {paymentMethod === "card" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3 pt-4"
                    >
                      <div>
                        <Label>Card Number</Label>
                        <Input placeholder="1234 5678 9012 3456" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Expiry Date</Label>
                          <Input placeholder="MM/YY" />
                        </div>
                        <div>
                          <Label>CVV</Label>
                          <Input placeholder="123" type="password" />
                        </div>
                      </div>
                      <div>
                        <Label>Name on Card</Label>
                        <Input placeholder="Enter name as on card" />
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Nomination Fee</span>
                      <span>₹{fee}.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Processing Fee</span>
                      <span>₹0.00</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary">₹{fee}.00</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Badge
                      variant="secondary"
                      className="w-full justify-center"
                    >
                      {formData.category === "general"
                        ? "General Category"
                        : "Reserved Category (SC/ST)"}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="flex-col space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    <span>Secure payment via SSL encryption</span>
                  </div>
                </CardFooter>
              </Card>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={onBack}
                disabled={isProcessing}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Preview
              </Button>
              <Button
                className="bg-primary hover:bg-primary-hover min-w-[150px]"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Pay ₹{fee}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>Payment Successful!</CardTitle>
                <CardDescription>
                  Amount: ₹{fee}.00 has been debited
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please verify OTP sent to your registered mobile number to
                    complete the nomination submission.
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
                          <Label className="mb-4">Enter 6-digit OTP</Label>
                          <FormControl>
                            <InputOTP
                              maxLength={6}
                              value={field.value}
                              onChange={field.onChange}
                            >
                              <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
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
                        className="w-full bg-primary hover:bg-primary-hover"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
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
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
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

                <div className="text-xs text-muted-foreground text-center pt-4 border-t">
                  <p>
                    Demo OTP: <strong>123456</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

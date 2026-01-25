// components/nomination/payment-page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Clock,
  ChevronRight,
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

  const fee = 500; // Fixed application fee

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setPaymentStep("otp");
  };

  const onOtpSubmit = async (data: OtpFormData) => {
    setError(null);
    setIsProcessing(true);

    try {
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
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const handleBackFromOtp = () => {
    setPaymentStep("payment");
    otpForm.reset();
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* BillDesk Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <img src="/billdesk.png" alt="BillDesk" className="h-10 w-auto" />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Lock className="h-4 w-4 text-orange-500" />
              <span>Secure Payment Gateway</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                1
              </div>
              <span className="font-medium text-gray-700">Select Payment</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  paymentStep === "otp"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                2
              </div>
              <span
                className={`font-medium ${paymentStep === "otp" ? "text-gray-700" : "text-gray-400"}`}
              >
                Verify Payment
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">
                3
              </div>
              <span className="font-medium text-gray-400">Complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* FIXED: Changed py- to py-6 */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {paymentStep === "payment" ? (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Payment Methods */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Payment Options Card */}
                  <Card className="border-0 shadow-sm rounded-lg overflow-hidden p-0">
                    <CardHeader className="bg-gray-50 border-b border-gray-200 py-3 px-4">
                      <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-orange-500" />
                        Select Payment Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <RadioGroup
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                        className="divide-y divide-gray-100"
                      >
                        {/* UPI */}
                        <div
                          className={`flex items-center p-4 cursor-pointer transition-colors ${
                            paymentMethod === "upi"
                              ? "bg-orange-50 border-l-4 border-orange-500"
                              : "hover:bg-gray-50 border-l-4 border-transparent"
                          }`}
                          onClick={() => setPaymentMethod("upi")}
                        >
                          <RadioGroupItem
                            value="upi"
                            id="upi"
                            className="text-orange-500"
                          />
                          <div className="ml-3 flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Smartphone className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <Label
                                htmlFor="upi"
                                className="cursor-pointer font-medium text-gray-800"
                              >
                                UPI Payment
                              </Label>
                              <p className="text-xs text-gray-500">
                                Google Pay, PhonePe, Paytm, BHIM UPI
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png"
                              alt="UPI"
                              className="h-6 w-auto"
                            />
                          </div>
                        </div>

                        {/* Debit/Credit Card */}
                        <div
                          className={`flex items-center p-4 cursor-pointer transition-colors ${
                            paymentMethod === "card"
                              ? "bg-orange-50 border-l-4 border-orange-500"
                              : "hover:bg-gray-50 border-l-4 border-transparent"
                          }`}
                          onClick={() => setPaymentMethod("card")}
                        >
                          <RadioGroupItem
                            value="card"
                            id="card"
                            className="text-orange-500"
                          />
                          <div className="ml-3 flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <CreditCard className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <Label
                                htmlFor="card"
                                className="cursor-pointer font-medium text-gray-800"
                              >
                                Debit / Credit Card
                              </Label>
                              <p className="text-xs text-gray-500">
                                Visa, Mastercard, RuPay, Amex
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Net Banking */}
                        <div
                          className={`flex items-center p-4 cursor-pointer transition-colors ${
                            paymentMethod === "netbanking"
                              ? "bg-orange-50 border-l-4 border-orange-500"
                              : "hover:bg-gray-50 border-l-4 border-transparent"
                          }`}
                          onClick={() => setPaymentMethod("netbanking")}
                        >
                          <RadioGroupItem
                            value="netbanking"
                            id="netbanking"
                            className="text-orange-500"
                          />
                          <div className="ml-3 flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <Label
                                htmlFor="netbanking"
                                className="cursor-pointer font-medium text-gray-800"
                              >
                                Net Banking
                              </Label>
                              <p className="text-xs text-gray-500">
                                All major banks supported
                              </p>
                            </div>
                          </div>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  {/* Payment Details Card */}
                  <Card className="border-0 shadow-sm rounded-lg overflow-hidden p-0">
                    <CardHeader className="bg-gray-50 border-b border-gray-200 py-3 px-4">
                      <CardTitle className="text-base font-semibold text-gray-700">
                        {paymentMethod === "upi" && "Enter UPI Details"}
                        {paymentMethod === "card" && "Enter Card Details"}
                        {paymentMethod === "netbanking" && "Select Your Bank"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      {paymentMethod === "upi" && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-4"
                        >
                          <div>
                            <Label className="text-gray-600 text-sm">
                              UPI ID
                            </Label>
                            <Input
                              placeholder="yourname@upi"
                              className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              Example: mobilenumber@upi, name@okicici
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {paymentMethod === "card" && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-4"
                        >
                          <div>
                            <Label className="text-gray-600 text-sm">
                              Card Number
                            </Label>
                            <Input
                              placeholder="1234 5678 9012 3456"
                              className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-gray-600 text-sm">
                                Valid Through
                              </Label>
                              <Input
                                placeholder="MM/YY"
                                className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                              />
                            </div>
                            <div>
                              <Label className="text-gray-600 text-sm">
                                CVV
                              </Label>
                              <Input
                                placeholder="***"
                                type="password"
                                maxLength={4}
                                className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-gray-600 text-sm">
                              Name on Card
                            </Label>
                            <Input
                              placeholder="Enter name as on card"
                              className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            />
                          </div>
                        </motion.div>
                      )}

                      {paymentMethod === "netbanking" && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-4 gap-3">
                            {[
                              "SBI",
                              "HDFC",
                              "ICICI",
                              "Axis",
                              "PNB",
                              "BOB",
                              "Kotak",
                              "Others",
                            ].map((bank) => (
                              <div
                                key={bank}
                                className="p-3 border border-gray-200 rounded-lg text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors"
                              >
                                <span className="text-sm font-medium text-gray-700">
                                  {bank}
                                </span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Order Summary Sidebar */}
                <div className="space-y-4">
                  {/* Amount Card */}
                  <Card className="border-0 shadow-sm rounded-lg overflow-hidden p-0">
                    <CardHeader className="bg-orange-500 py-4 px-4">
                      <CardTitle className="text-base font-semibold text-white">
                        Payment Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Merchant</span>
                          <span className="font-medium text-gray-800">
                            SEC Sikkim
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Description</span>
                          <span className="font-medium text-gray-800">
                            Nomination Fee
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Base Amount</span>
                          <span className="text-gray-800">₹{fee}.00</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Convenience Fee</span>
                          <span className="text-gray-800">₹0.00</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">GST</span>
                          <span className="text-gray-800">₹0.00</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-700">
                            Total Amount
                          </span>
                          <span className="text-2xl font-bold text-orange-500">
                            ₹{fee}.00
                          </span>
                        </div>
                      </div>

                      <Badge
                        className={`w-full justify-center py-1.5 ${
                          formData.category === "general"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {formData.category === "general"
                          ? "General Category"
                          : "Reserved Category (Reduced Fee)"}
                      </Badge>
                    </CardContent>
                  </Card>

                  {/* Security Card */}
                  <Card className="border-0 shadow-sm rounded-lg overflow-hidden bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Shield className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">
                          100% Secure Payment
                        </span>
                      </div>
                      <div className="space-y-2 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <Lock className="h-3 w-3 text-gray-400" />
                          <span>256-bit SSL Encryption</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-gray-400" />
                          <span>PCI DSS Compliant</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-3 w-3 text-gray-400" />
                          <span>RBI Authorized Payment Gateway</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Timer */}
                  <Card className="border-0 shadow-sm rounded-lg overflow-hidden border-l-4 border-orange-500">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Session Timeout
                          </p>
                          <p className="text-xs text-gray-500">
                            Complete payment within 10:00 mins
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={onBack}
                  disabled={isProcessing}
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Cancel Payment
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="bg-orange-500 hover:bg-orange-600 text-white min-w-[180px] h-11"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Pay ₹{fee}.00
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
            >
              <div className="max-w-md mx-auto">
                <Card className="border-0 shadow-sm rounded-lg overflow-hidden p-0">
                  <CardHeader className="bg-green-50 border-b border-green-100 text-center py-6">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-green-700">
                      Payment Successful!
                    </CardTitle>
                    <p className="text-sm text-green-600 mt-1">
                      Transaction Amount: <strong>₹{fee}.00</strong>
                    </p>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <Alert className="bg-orange-50 border-orange-200">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <AlertDescription className="text-orange-700 text-sm">
                        Enter OTP sent to your registered mobile number to
                        complete submission.
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
                              <Label className="mb-4 text-gray-600">
                                Enter 6-digit OTP
                              </Label>
                              <FormControl>
                                <InputOTP
                                  maxLength={6}
                                  value={field.value}
                                  onChange={field.onChange}
                                >
                                  <InputOTPGroup>
                                    <InputOTPSlot
                                      index={0}
                                      className="border-gray-300"
                                    />
                                    <InputOTPSlot
                                      index={1}
                                      className="border-gray-300"
                                    />
                                    <InputOTPSlot
                                      index={2}
                                      className="border-gray-300"
                                    />
                                    <InputOTPSlot
                                      index={3}
                                      className="border-gray-300"
                                    />
                                    <InputOTPSlot
                                      index={4}
                                      className="border-gray-300"
                                    />
                                    <InputOTPSlot
                                      index={5}
                                      className="border-gray-300"
                                    />
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
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11"
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
                            className="border-gray-300 text-gray-600"
                          >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                          </Button>
                        </div>
                      </form>
                    </Form>

                    <div className="text-center">
                      <p className="text-sm text-gray-500">
                        Didn't receive OTP?{" "}
                        <button
                          type="button"
                          className="text-orange-500 hover:underline font-medium"
                          onClick={handleResendOtp}
                        >
                          Resend OTP
                        </button>
                      </p>
                    </div>

                    <div className="text-xs text-gray-400 text-center pt-4 border-t border-gray-100">
                      <p>
                        Demo OTP:{" "}
                        <strong className="text-gray-600">123456</strong>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BillDesk Footer */}
      <div className="bg-gray-800 mt-8">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img
                src="/billdesk.png"
                alt="BillDesk"
                className="h-6 w-auto invert"
              />
              <span className="text-xs text-gray-400">
                Powered by BillDesk Payment Gateway
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>© 2026 BillDesk</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

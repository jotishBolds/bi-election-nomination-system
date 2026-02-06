"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth/auth-context";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Loader2,
  AlertCircle,
  Phone,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import {
  PhoneLoginFormData,
  phoneLoginSchema,
  OtpFormData,
  otpSchema,
} from "@/lib/auth/validations/auth";

type LoginStep = "phone" | "otp";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, verifyOtp } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginStep, setLoginStep] = useState<LoginStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");

  const showRegistrationSuccess = searchParams.get("registered") === "true";

  const phoneForm = useForm<PhoneLoginFormData>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: { phone: "" },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  async function onPhoneSubmit(data: PhoneLoginFormData) {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await login({
        email: "tenzin.bhutia@sikkim.gov",
        password: "applicant123",
      });
      if (result.success) {
        setPhoneNumber(data.phone);
        setLoginStep("otp");
      } else {
        setError(result.error || "Failed to send OTP");
      }
    } catch {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onOtpSubmit(data: OtpFormData) {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await verifyOtp(data.otp);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(
          result.error || "Invalid OTP. Please try again. (Hint: Use 123456)",
        );
      }
    } catch {
      setError("OTP verification failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleBack = () => {
    setLoginStep("phone");
    setError(null);
    otpForm.reset();
  };

  const handleResendOtp = async () => {
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {loginStep === "phone" ? (
          <motion.div
            key="phone-step"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {showRegistrationSuccess && (
              <Alert className="mb-6 border-primary/30 bg-secondary">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <AlertDescription className="text-secondary-foreground">
                  Registration completed! Sign in with your phone number.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Form {...phoneForm}>
                <form
                  onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={phoneForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">
                          Phone Number
                        </FormLabel>
                        <FormControl>
                          <div className="flex">
                            <div className="inline-flex items-center px-4 rounded-l-xl border-2 border-r-0 border-input bg-muted text-secondary-foreground">
                              <Phone className="h-4 w-4 mr-2 text-primary/70" />
                              <span className="text-sm font-medium">+91</span>
                            </div>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="Enter 10-digit number"
                              className="rounded-l-none rounded-r-xl border-2 border-input focus-visible:ring-ring focus-visible:border-primary h-12 text-base"
                              maxLength={10}
                              disabled={isSubmitting}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl font-semibold text-base shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-5 w-5" />
                        Send OTP
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-semibold text-primary hover:underline"
                    onClick={() => router.push("/register")}
                  >
                    Register here
                  </Button>
                </p>
              </div>

              <div className="text-xs text-muted-foreground/60 text-center space-y-1 pt-4 border-t border-border">
                <p className="font-medium text-muted-foreground/80">
                  Demo Credentials
                </p>
                <p>Phone: Any 10-digit number</p>
                <p>
                  OTP: <span className="font-mono font-bold">123456</span>
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="otp-step"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 text-secondary-foreground hover:bg-accent"
              onClick={handleBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 bg-accent rounded-2xl flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Verify Your Number
              </h3>
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code sent to{" "}
                <span className="font-semibold text-secondary-foreground">
                  +91 {phoneNumber}
                </span>
              </p>
            </div>

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
                      <FormControl>
                        <InputOTP
                          maxLength={6}
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <InputOTPGroup className="gap-2">
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                              <InputOTPSlot
                                key={index}
                                index={index}
                                className="rounded-xl border-2 border-input focus:border-primary h-14 w-12 text-lg font-bold text-foreground"
                              />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl font-semibold text-base shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Verify & Login
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Didn&apos;t receive the code?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline font-semibold"
                  onClick={handleResendOtp}
                >
                  Resend OTP
                </button>
              </p>
            </div>

            <div className="text-xs text-muted-foreground/60 text-center pt-4 border-t border-border">
              <p>
                Demo OTP:{" "}
                <span className="font-mono font-bold text-secondary-foreground">
                  123456
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

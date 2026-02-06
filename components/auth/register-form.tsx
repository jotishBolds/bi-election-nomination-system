"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

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
  ArrowLeft,
  User,
  Phone,
  ShieldCheck,
  CreditCard,
  UserPlus,
} from "lucide-react";
import { OtpFormData, otpSchema } from "@/lib/auth/validations/auth";

const DEMO_OTP = "123456";

const phoneRegistrationSchema = z.object({
  epicNo: z
    .string()
    .min(1, "EPIC number is required")
    .min(6, "EPIC number must be at least 6 characters"),
  name: z
    .string()
    .min(1, "Full name is required")
    .min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
});

type PhoneRegistrationFormData = z.infer<typeof phoneRegistrationSchema>;
type RegistrationStep = "form" | "otp";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationStep, setRegistrationStep] =
    useState<RegistrationStep>("form");
  const [registrationData, setRegistrationData] =
    useState<PhoneRegistrationFormData | null>(null);

  const registrationForm = useForm<PhoneRegistrationFormData>({
    resolver: zodResolver(phoneRegistrationSchema),
    defaultValues: {
      epicNo: "",
      name: "",
      phone: "",
    },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  async function onRegistrationSubmit(data: PhoneRegistrationFormData) {
    setError(null);
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setRegistrationData(data);
      setRegistrationStep("otp");
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onOtpSubmit(data: OtpFormData) {
    setError(null);
    setIsSubmitting(true);
    try {
      if (data.otp === DEMO_OTP) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        router.push("/register?success=true");
      } else {
        setError("Invalid OTP. Please try again. (Hint: Use 123456)");
      }
    } catch {
      setError("OTP verification failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleBack = () => {
    setRegistrationStep("form");
    setError(null);
    otpForm.reset();
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {registrationStep === "form" ? (
          <motion.div
            key="registration-form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <Form {...registrationForm}>
              <form
                onSubmit={registrationForm.handleSubmit(onRegistrationSubmit)}
                className="space-y-5"
              >
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={registrationForm.control}
                  name="epicNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">
                        EPIC Number
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/70" />
                          <Input
                            {...field}
                            type="text"
                            placeholder="Enter your EPIC number"
                            className="pl-10 h-12 rounded-xl border-2 border-input focus-visible:ring-ring focus-visible:border-primary text-base"
                            disabled={isSubmitting}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registrationForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/70" />
                          <Input
                            {...field}
                            type="text"
                            placeholder="Enter your full name"
                            className="pl-10 h-12 rounded-xl border-2 border-input focus-visible:ring-ring focus-visible:border-primary text-base"
                            disabled={isSubmitting}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registrationForm.control}
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
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-semibold text-primary hover:underline"
                  onClick={() => router.push("/login")}
                >
                  Sign in here
                </Button>
              </p>
            </div>

            <div className="text-xs text-muted-foreground/60 text-center space-y-1 pt-4 border-t border-border mt-6">
              <p className="font-medium text-muted-foreground/80">Demo OTP</p>
              <p>
                OTP: <span className="font-mono font-bold">123456</span>
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="otp-verification"
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
                  +91 {registrationData?.phone}
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
                    "Complete Registration"
                  )}
                </Button>
              </form>
            </Form>

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

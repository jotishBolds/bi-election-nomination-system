"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
  User,
  Phone,
} from "lucide-react";
import {
  RegistrationFormData,
  registrationSchema,
  OtpFormData,
  otpSchema,
} from "@/lib/auth/validations/auth";

type RegistrationStep = "form" | "otp";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationStep, setRegistrationStep] =
    useState<RegistrationStep>("form");
  const [registrationData, setRegistrationData] =
    useState<RegistrationFormData | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const registrationForm = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      epicNo: "",
      name: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  async function onRegistrationSubmit(data: RegistrationFormData) {
    setError(null);
    setIsSubmitting(true);

    try {
      // Call API to send OTP
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-otp",
          data,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setRegistrationData(data);
        setRegistrationStep("otp");
        // Show dev OTP if available
        if (result.devOtp) {
          setDevOtp(result.devOtp);
        }
      } else {
        setError(result.error || "Registration failed");
      }
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
      if (!registrationData) {
        setError("Registration data not found. Please start over.");
        setRegistrationStep("form");
        return;
      }

      // Call API to verify OTP and complete registration
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-otp",
          phone: registrationData.phone,
          otp: data.otp,
          registrationData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Registration successful, redirect to login
        router.push("/login?registered=true");
      } else {
        setError(result.error || "OTP verification failed");
      }
    } catch {
      setError("OTP verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleBack = () => {
    setRegistrationStep("form");
    setError(null);
    setDevOtp(null);
    otpForm.reset();
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {registrationStep === "form" ? (
          <motion.div
            key="registration-form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Form {...registrationForm}>
              <form
                onSubmit={registrationForm.handleSubmit(onRegistrationSubmit)}
                className="space-y-6"
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
                      <FormLabel>EPIC Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
                          <Input
                            {...field}
                            type="text"
                            placeholder="Enter your EPIC number"
                            className="pl-10"
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
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
                          <Input
                            {...field}
                            type="text"
                            placeholder="Enter your full name"
                            className="pl-10"
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
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                          <Input
                            {...field}
                            type="tel"
                            placeholder="Enter your 10-digit phone number"
                            className="pl-10"
                            disabled={isSubmitting}
                            maxLength={10}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registrationForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10"
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter your password"
                            className="pl-10"
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
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="Confirm your password"
                            className="pl-10"
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
                  className="w-full bg-primary hover:bg-primary-hover"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </Form>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium text-primary hover:underline"
                  onClick={() => router.push("/login")}
                >
                  Sign in here
                </Button>
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="otp-verification"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Button
              variant="ghost"
              size="sm"
              className="mb-4"
              onClick={handleBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4 text-slate-500" />
              Back
            </Button>

            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold">Verify OTP</h3>
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code sent to {registrationData?.phone}
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

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-hover"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              </form>
            </Form>

            {devOtp && (
              <div className="text-xs text-muted-foreground text-center pt-4 border-t bg-yellow-50 p-2 rounded">
                <p className="font-medium text-yellow-700">
                  Development Mode - OTP: <strong>{devOtp}</strong>
                </p>
                <p className="text-yellow-600">Check console for OTP</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

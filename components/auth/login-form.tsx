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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Phone,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import {
  LoginFormData,
  loginSchema,
  PhoneLoginFormData,
  phoneLoginSchema,
  OtpFormData,
  otpSchema,
} from "@/lib/auth/validations/auth";

// Hardcoded OTP for demo
const DEMO_OTP = "123456";

type LoginMethod = "email" | "phone";
type LoginStep = "credentials" | "otp";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, verifyOtp } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
  const [loginStep, setLoginStep] = useState<LoginStep>("credentials");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Check if user just registered
  const showRegistrationSuccess = searchParams.get("registered") === "true";

  const emailForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const phoneForm = useForm<PhoneLoginFormData>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: {
      phone: "",
    },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  async function onEmailSubmit(data: LoginFormData) {
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login(data);

      if (result.success) {
        setLoginStep("otp");
        setOtpSent(true);
      } else {
        setError(result.error || "Login failed");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onPhoneSubmit(data: PhoneLoginFormData) {
    setError(null);
    setIsSubmitting(true);

    try {
      // For phone login, use a default user account but require OTP
      const result = await login({
        email: "tenzin.bhutia@sikkim.gov",
        password: "applicant123",
      });

      if (result.success && result.requiresOtp) {
        setPhoneNumber(data.phone);
        setLoginStep("otp");
        setOtpSent(true);
      } else {
        setError(result.error || "Login failed");
      }
    } catch {
      setError("Failed to send OTP");
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
    setLoginStep("credentials");
    setOtpSent(false);
    setError(null);
    otpForm.reset();
  };

  const handleResendOtp = async () => {
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setOtpSent(true);
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {loginStep === "credentials" ? (
          <motion.div
            key="credentials"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {showRegistrationSuccess && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Registration completed successfully! Please login with your
                  credentials.
                </AlertDescription>
              </Alert>
            )}

            <Tabs
              value={loginMethod}
              onValueChange={(v) => setLoginMethod(v as LoginMethod)}
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email" className="gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="gap-2">
                  <Phone className="h-4 w-4 text-emerald-500" />
                  Phone
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email">
                <Form {...emailForm}>
                  <form
                    onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                    className="space-y-6"
                  >
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <FormField
                      control={emailForm.control}
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
                      control={emailForm.control}
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
                        "Continue"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="phone">
                <Form {...phoneForm}>
                  <form
                    onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
                    className="space-y-6"
                  >
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <FormField
                      control={phoneForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <div className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground">
                                <Phone className="h-4 w-4 mr-1 text-emerald-500" />
                                <span className="text-sm">+91</span>
                              </div>
                              <Input
                                {...field}
                                type="tel"
                                placeholder="Enter 10 digit number"
                                className="rounded-l-none"
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
                      className="w-full bg-primary hover:bg-primary-hover"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        "Send OTP"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium text-primary hover:underline"
                  onClick={() => router.push("/register")}
                >
                  Register here
                </Button>
              </p>
            </div>

            <div className="text-xs text-muted-foreground text-center space-y-1 pt-4 border-t mt-6">
              <p className="font-medium">Applicant Credentials:</p>
              <p>Email: tenzin.bhutia@sikkim.gov / applicant123</p>
              <p>OTP: 123456</p>
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
                {loginMethod === "phone"
                  ? `Enter the 6-digit code sent to +91 ${phoneNumber}`
                  : "Enter the 6-digit code sent to your email"}
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
                    "Verify & Login"
                  )}
                </Button>
              </form>
            </Form>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?{" "}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

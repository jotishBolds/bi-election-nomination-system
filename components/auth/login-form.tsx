"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
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
  Shield,
  QrCode,
  Smartphone,
  Copy,
  Check,
} from "lucide-react";
import {
  LoginFormData,
  loginSchema,
  PhoneLoginFormData,
  phoneLoginSchema,
  OtpFormData,
  otpSchema,
} from "@/lib/auth/validations/auth";

type LoginMethod = "email" | "phone";
type LoginStep = "credentials" | "otp" | "totp" | "totp-setup";

interface TOTPSetupData {
  secret: string;
  qrCode: string;
  otpauthUrl: string;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
  const [loginStep, setLoginStep] = useState<LoginStep>("credentials");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");

  // TOTP setup state
  const [totpSetupData, setTotpSetupData] = useState<TOTPSetupData | null>(
    null,
  );
  const [totpSetupToken, setTotpSetupToken] = useState("");
  const [totpSetupStep, setTotpSetupStep] = useState<
    "qr" | "verify" | "complete"
  >("qr");
  const [copied, setCopied] = useState(false);
  // Track if this is an RO/Admin user needing TOTP setup during phone login
  const [isPrivilegedNeedsTOTPSetup, setIsPrivilegedNeedsTOTPSetup] =
    useState(false);

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
      // Store credentials for OTP verification
      setIdentifier(data.email);
      setPassword(data.password);

      // Send OTP for login - this will check if user exists and role
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: data.email,
          type: "LOGIN",
          channel: "email",
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Check if this is an RO/Admin requiring TOTP
        if (result.requiresTOTP) {
          if (result.totpEnabled) {
            // TOTP is set up — go directly to TOTP input
            setLoginStep("totp");
          } else {
            // TOTP not set up — need to set it up first
            // For email login, password already verifies identity
            await initiateTOTPSetup(data.email);
          }
        } else {
          // Regular candidate — normal OTP flow
          setLoginStep("otp");
          if (result.devOtp) {
            setDevOtp(result.devOtp);
          }
        }
      } else {
        // Show the error from OTP API (user not found, etc.)
        setError(result.error || "Failed to send OTP. Please try again.");
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
      setPhoneNumber(data.phone);
      setIdentifier(data.phone);

      // Send OTP to phone - this checks role and TOTP status
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: data.phone,
          type: "LOGIN",
          channel: "sms",
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Check if this is an RO/Admin requiring TOTP
        if (result.requiresTOTP) {
          if (result.totpEnabled) {
            // TOTP is enabled — go directly to TOTP input (no SMS sent)
            setLoginStep("totp");
          } else {
            // TOTP not set up — SMS OTP was sent for identity verification
            // After OTP verification, will redirect to TOTP setup
            setIsPrivilegedNeedsTOTPSetup(true);
            setLoginStep("otp");
            if (result.devOtp) {
              setDevOtp(result.devOtp);
            }
          }
        } else {
          // Regular candidate — normal SMS OTP flow
          setIsPrivilegedNeedsTOTPSetup(false);
          setLoginStep("otp");
          if (result.devOtp) {
            setDevOtp(result.devOtp);
          }
        }
      } else {
        setError(result.error || "Failed to send OTP");
      }
    } catch {
      setError("Failed to send OTP");
    } finally {
      setIsSubmitting(false);
    }
  }

  /** Initiate TOTP setup for RO/Admin during login */
  async function initiateTOTPSetup(ident: string) {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/totp/login-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: ident }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setTotpSetupData(result.data);
        setTotpSetupStep("qr");
        setLoginStep("totp-setup");
      } else {
        setError(result.error || "Failed to initiate TOTP setup");
      }
    } catch {
      setError("Failed to set up two-factor authentication");
    } finally {
      setIsSubmitting(false);
    }
  }

  /** Verify TOTP setup token and enable TOTP */
  async function onTotpSetupVerify() {
    setError(null);
    setIsSubmitting(true);

    try {
      if (totpSetupToken.length !== 6) {
        setError("Please enter a 6-digit code from your authenticator app");
        return;
      }

      const response = await fetch("/api/auth/totp/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          token: totpSetupToken,
          action: "enable",
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setTotpSetupStep("complete");
        // After short delay, proceed to TOTP login
        setTimeout(() => {
          setTotpCode("");
          setLoginStep("totp");
        }, 2000);
      } else {
        setError(result.error || "Invalid code. Please try again.");
      }
    } catch {
      setError("Failed to verify authenticator code");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onOtpSubmit(data: OtpFormData) {
    setError(null);
    setIsSubmitting(true);

    try {
      // Verify OTP first
      const otpResponse = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          otp: data.otp,
          type: "LOGIN",
        }),
      });

      const otpResult = await otpResponse.json();

      if (!otpResult.success) {
        setError(otpResult.error || "Invalid OTP");
        return;
      }

      // OTP verified — now check the login flow
      if (loginMethod === "email" && password) {
        // Email login for candidate (RO/Admin skip OTP entirely)
        const result = await signIn("credentials", {
          email: identifier,
          password: password,
          redirect: false,
        });

        if (result?.error) {
          setError(result.error);
          return;
        }

        // Check if the user needs TOTP (shouldn't happen for candidates,
        // but handle edge case)
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();

        if (session?.user?.requiresTOTP && !session?.user?.totpVerified) {
          setLoginStep("totp");
          return;
        }

        router.push("/dashboard");
      } else {
        // Phone login

        // Check if this was a TOTP setup flow (RO/Admin phone login, first time)
        // We tracked this flag when OTP was sent
        if (isPrivilegedNeedsTOTPSetup) {
          // RO/Admin without TOTP — identity verified via SMS, now set up TOTP
          await initiateTOTPSetup(identifier);
          return;
        }

        // Regular candidate — complete phone login
        const result = await signIn("phone-otp", {
          phone: identifier,
          otpVerified: "true",
          redirect: false,
        });

        if (result?.error) {
          setError(result.error);
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      setError("OTP verification failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onTotpSubmit() {
    setError(null);
    setIsSubmitting(true);

    try {
      if (totpCode.length !== 6) {
        setError("Please enter a 6-digit authenticator code");
        return;
      }

      // Verify TOTP via public endpoint first
      const verifyResponse = await fetch("/api/auth/totp/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          token: totpCode,
        }),
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResult.success) {
        setError(
          verifyResult.error ||
            "Invalid authenticator code. Please check your app and try again.",
        );
        return;
      }

      // TOTP verified — now sign in
      if (loginMethod === "email" && password) {
        // Email login with TOTP
        const result = await signIn("credentials", {
          email: identifier,
          password: password,
          totp: totpCode,
          redirect: false,
        });

        if (result?.error) {
          setError(
            result.error === "Invalid authenticator code"
              ? "Invalid authenticator code. Please check your app and try again."
              : result.error,
          );
        } else {
          router.push("/dashboard");
        }
      } else {
        // Phone login with TOTP (RO/Admin)
        const result = await signIn("phone-otp", {
          phone: identifier,
          totpVerified: "true",
          redirect: false,
        });

        if (result?.error) {
          setError(result.error);
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      setError("TOTP verification failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleBack = () => {
    if (loginStep === "totp") {
      setLoginStep("credentials");
      setError(null);
      setTotpCode("");
      setIsPrivilegedNeedsTOTPSetup(false);
      return;
    }
    if (loginStep === "totp-setup") {
      setLoginStep("credentials");
      setError(null);
      setTotpSetupData(null);
      setTotpSetupToken("");
      setTotpSetupStep("qr");
      setIsPrivilegedNeedsTOTPSetup(false);
      return;
    }
    setLoginStep("credentials");
    setError(null);
    setDevOtp(null);
    setIsPrivilegedNeedsTOTPSetup(false);
    otpForm.reset();
  };

  const handleResendOtp = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          type: "LOGIN",
          channel: loginMethod === "phone" ? "sms" : "email",
        }),
      });

      const result = await response.json();
      if (result.devOtp) {
        setDevOtp(result.devOtp);
      }
    } catch {
      setError("Failed to resend OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySecret = async () => {
    if (totpSetupData?.secret) {
      await navigator.clipboard.writeText(totpSetupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
          </motion.div>
        ) : loginStep === "otp" ? (
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
                Didn&apos;t receive the code?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline font-medium"
                  onClick={handleResendOtp}
                  disabled={isSubmitting}
                >
                  Resend OTP
                </button>
              </p>
            </div>

            {devOtp && (
              <div className="text-xs text-muted-foreground text-center pt-4 border-t bg-yellow-50 p-2 rounded">
                <p className="font-medium text-yellow-700">
                  Development Mode - OTP: <strong>{devOtp}</strong>
                </p>
                <p className="text-yellow-600">Check server console for OTP</p>
              </div>
            )}
          </motion.div>
        ) : null}

        {/* TOTP Setup Step - For RO/Admin first-time setup during login */}
        {loginStep === "totp-setup" && (
          <motion.div
            key="totp-setup"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Button
              variant="ghost"
              size="sm"
              className="mb-2"
              onClick={handleBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4 text-slate-500" />
              Back
            </Button>

            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold">
                Setup Two-Factor Authentication
              </h3>
              <p className="text-sm text-muted-foreground">
                As an RO/Admin, you must set up authenticator app access for
                secure login.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {totpSetupStep === "qr" && totpSetupData && (
              <div className="space-y-5">
                {/* Step 1: QR Code */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <span className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      1
                    </span>
                    Scan QR code with your authenticator app
                  </h4>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Smartphone className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-800">
                      Use <strong>Google Authenticator</strong> or{" "}
                      <strong>Microsoft Authenticator</strong>
                    </p>
                  </div>
                  <div className="flex justify-center p-3 bg-white border rounded-lg">
                    <img
                      src={totpSetupData.qrCode}
                      alt="TOTP QR Code"
                      className="w-44 h-44"
                    />
                  </div>
                </div>

                {/* Manual Key */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-xs flex items-center gap-2 text-muted-foreground">
                    <QrCode className="h-3 w-3" />
                    Can&apos;t scan? Enter this key manually:
                  </h4>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-slate-100 rounded text-xs font-mono break-all">
                      {totpSetupData.secret}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopySecret}
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setTotpSetupStep("verify")}
                >
                  Continue to Verification
                </Button>
              </div>
            )}

            {totpSetupStep === "verify" && (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <span className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                    2
                  </span>
                  Enter the 6-digit code from your app
                </h4>

                <div className="flex flex-col items-center space-y-4">
                  <InputOTP
                    maxLength={6}
                    value={totpSetupToken}
                    onChange={setTotpSetupToken}
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
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code shown in your authenticator app
                  </p>
                </div>

                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={onTotpSetupVerify}
                  disabled={isSubmitting || totpSetupToken.length !== 6}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Verify & Enable
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setTotpSetupStep("qr")}
                >
                  Back to QR Code
                </Button>
              </div>
            )}

            {totpSetupStep === "complete" && (
              <div className="text-center space-y-3">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-800">
                  Setup Complete!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Two-factor authentication has been enabled. Redirecting to
                  login...
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* TOTP Login Step - For RO/Admin with TOTP already enabled */}
        {loginStep === "totp" && (
          <motion.div
            key="totp"
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
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold">Authenticator Code</h3>
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app (Google
                Authenticator / Microsoft Authenticator)
              </p>
            </div>

            <div className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col items-center space-y-4">
                <InputOTP maxLength={6} value={totpCode} onChange={setTotpCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary-hover"
                onClick={onTotpSubmit}
                disabled={isSubmitting || totpCode.length !== 6}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// components/dashboard/panels/totp-setup-panel.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle,
  QrCode,
  Smartphone,
  Copy,
  Check,
} from "lucide-react";

interface TOTPSetupData {
  secret: string;
  qrCode: string;
  otpauthUrl: string;
}

export function TOTPSetupPanel() {
  const [step, setStep] = useState<"idle" | "setup" | "verify" | "done">(
    "idle",
  );
  const [setupData, setSetupData] = useState<TOTPSetupData | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/totp/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 400 && result.error?.includes("already")) {
          setError(
            "TOTP is already enabled on your account. If you need to reset it, contact an administrator.",
          );
          setStep("done");
          return;
        }
        throw new Error(result.error || "Failed to setup TOTP");
      }

      setSetupData(result.data);
      setStep("setup");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to setup TOTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (token.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/totp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to verify TOTP");
      }

      setSuccess(
        "TOTP has been enabled successfully! You will need to enter a code from your authenticator app when logging in.",
      );
      setStep("done");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Invalid code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = async () => {
    if (setupData?.secret) {
      await navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-orange-600" />
          Two-Factor Authentication (TOTP)
        </CardTitle>
        <CardDescription>
          Secure your account with Google Authenticator or any TOTP app.
          Required for RO and Admin roles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {step === "idle" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Smartphone className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">How it works:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    Install <strong>Google Authenticator</strong> or{" "}
                    <strong>Microsoft Authenticator</strong> on your phone
                  </li>
                  <li>Click the button below to generate a QR code</li>
                  <li>Scan the QR code with your authenticator app</li>
                  <li>Enter the 6-digit code from the app to verify</li>
                </ol>
              </div>
            </div>
            <Button onClick={handleSetup} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Setup Two-Factor Authentication
                </>
              )}
            </Button>
          </div>
        )}

        {step === "setup" && setupData && (
          <div className="space-y-6">
            {/* Step 1: Scan QR */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <span className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  1
                </span>
                Scan this QR code with your authenticator app
              </h4>
              <div className="flex justify-center p-4 bg-white border rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={setupData.qrCode}
                  alt="TOTP QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* Manual entry backup */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <span className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  ?
                </span>
                Can&apos;t scan? Enter this secret manually:
              </h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-slate-100 rounded text-sm font-mono break-all">
                  {setupData.secret}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopySecret}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Step 2: Verify */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <span className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  2
                </span>
                Enter the 6-digit code from your app
              </h4>
              <div className="flex items-end gap-3">
                <div className="space-y-1.5 flex-1 max-w-[200px]">
                  <Label htmlFor="totp-token">Verification Code</Label>
                  <Input
                    id="totp-token"
                    value={token}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setToken(val);
                    }}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-lg tracking-widest font-mono"
                  />
                </div>
                <Button
                  onClick={handleVerify}
                  disabled={loading || token.length !== 6}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Verify & Enable
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "done" && !error && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-800">
              Two-factor authentication is <strong>enabled</strong>. You will
              need your authenticator app code when logging in.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

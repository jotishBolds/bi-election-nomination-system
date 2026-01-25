"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { RegisterForm } from "@/components/auth/register-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

function RegisterContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      const timeout = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dashboard-bg">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-white p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto">
            <img
              src="/main-logo.png"
              alt="Election Nomination System"
              className="h-16 w-auto mx-auto"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-primary">
              Create Account
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Register for the Election Nomination System
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {showSuccess && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Registration completed successfully! You can now login with your
                credentials.
              </AlertDescription>
            </Alert>
          )}
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}

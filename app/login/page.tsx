"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="flex items-center gap-3 text-primary">
          <div className="h-8 w-8 border-4 border-accent border-t-primary rounded-full animate-spin" />
          <span className="text-lg font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-[#e6faf0] to-accent/30 p-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-accent/40 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <Card className="w-full max-w-md shadow-2xl shadow-primary/10 border-accent/60 bg-card relative z-10">
        <CardHeader className="space-y-5 text-center pb-2">
          <div className="mx-auto">
            <img
              src="/main-logo-new.png"
              alt="Election Nomination System"
              className="h-16 w-auto"
            />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-2xl font-bold text-foreground">
              Election Nomination System
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in with your phone number to continue
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

function RegisterContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setDialogOpen(true);
    }
  }, [searchParams]);

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
      <div className="absolute -top-32 -left-32 w-72 h-72 bg-accent/50 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

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
              Create Account
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Register for the Election Nomination System
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <RegisterForm />
        </CardContent>
      </Card>

      {/* Success Dialog — solid white, no glass/blur */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-accent bg-card max-w-sm">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-accent rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-foreground text-xl">
              Registration Successful!
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Your account has been created successfully. You can now sign in
              with your phone number.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              onClick={() => router.push("/login?registered=true")}
              className="w-full h-12 rounded-xl font-semibold shadow-lg shadow-primary/20"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Proceed to Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-secondary">
          <div className="h-8 w-8 border-4 border-accent border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}

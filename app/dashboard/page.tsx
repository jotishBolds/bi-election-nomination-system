"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ROPanel } from "@/components/dashboard/panels/ro-panel";
import { CandidatePanel } from "@/components/dashboard/panels/candidate-panel";
import { SESPanel } from "@/components/dashboard/panels/ses-panel";
import { SuperAdminPanel } from "@/components/dashboard/panels/super-admin-panel";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dashboard-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const renderPanel = () => {
    switch (user.role) {
      case "RO":
        return <ROPanel />;
      case "CANDIDATE":
        return <CandidatePanel />;
      case "SES":
        return <SESPanel />;
      case "SUPER_ADMIN":
        return <SuperAdminPanel />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return <DashboardLayout>{renderPanel()}</DashboardLayout>;
}

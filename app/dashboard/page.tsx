"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Loader2 } from "lucide-react";

// Admin Panels
import { SuperAdminPanel } from "@/components/dashboard/panels/super-admin-panel";
import {
  UserManagementPanel,
  ElectionConfigPanel,
  AuditLogsPanel,
  CMSPanel,
  SymbolsPanel,
  VoterRollPanel,
  BRPaymentsPanel,
} from "@/components/dashboard/panels/admin";

// SEC Panels
import { SESPanel } from "@/components/dashboard/panels/ses-panel";
import {
  DistrictsPanel,
  ULBsPanel,
  WardsPanel,
  ROManagementPanel,
  NominationsPanel as SECNominationsPanel,
  ReportsPanel as SECReportsPanel,
} from "@/components/dashboard/panels/sec";

// RO Panels
import { ROPanel } from "@/components/dashboard/panels/ro-panel";
import {
  ApplicationsListPanel,
  ScrutinyPanel,
  WithdrawPanel,
  ContestPanel,
  UncontestPanel,
  ROReportsPanel,
  FormReportsPanel,
} from "@/components/dashboard/panels/ro";

// Candidate Panels
import { CandidatePanel } from "@/components/dashboard/panels/candidate-panel";
import { CandidateNominationsPanel } from "@/components/dashboard/panels/candidate";

// Profile Panel (shared across all roles)
import { ProfileSettingsPanel } from "@/components/dashboard/panels/profile-settings-panel";

function DashboardContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");

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
    // If no tab is selected, show the default dashboard panel for each role
    if (!activeTab) {
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
    }

    // Profile settings is shared across all roles
    if (activeTab === "profile") {
      return <ProfileSettingsPanel />;
    }

    // Handle tab-specific panels for SUPER_ADMIN
    if (user.role === "SUPER_ADMIN") {
      switch (activeTab) {
        case "users":
          return <UserManagementPanel />;
        case "roles":
          return <UserManagementPanel />; // Can reuse with roles filter
        case "election-config":
        case "schedule":
          return <ElectionConfigPanel />;
        case "parties":
          return <SymbolsPanel />;
        case "symbols":
          return <SymbolsPanel />;
        case "voter-roll":
          return <VoterRollPanel />;
        case "br-payments":
          return <BRPaymentsPanel />;
        case "cms":
          return <CMSPanel />;
        case "audit-logs":
          return <AuditLogsPanel />;
        case "reports":
          return <SECReportsPanel />; // Admin can see SEC reports
        default:
          return <SuperAdminPanel />;
      }
    }

    // Handle tab-specific panels for SES
    if (user.role === "SES") {
      switch (activeTab) {
        case "districts":
          return <DistrictsPanel />;
        case "ulbs":
          return <ULBsPanel />;
        case "wards":
          return <WardsPanel />;
        case "ro-management":
          return <ROManagementPanel />;
        case "nominations":
          return <SECNominationsPanel />;
        case "reports":
          return <SECReportsPanel />;
        default:
          return <SESPanel />;
      }
    }

    // Handle tab-specific panels for RO
    if (user.role === "RO") {
      switch (activeTab) {
        case "applications":
          return <ApplicationsListPanel />;
        case "scrutiny":
          return <ScrutinyPanel />;
        case "withdraw":
          return <WithdrawPanel />;
        case "contest":
          return <ContestPanel />;
        case "uncontest":
          return <UncontestPanel />;
        case "reports":
          return <ROReportsPanel />;
        case "form-reports":
          return <FormReportsPanel />;
        default:
          return <ROPanel />;
      }
    }

    // Handle tab-specific panels for CANDIDATE
    if (user.role === "CANDIDATE") {
      switch (activeTab) {
        case "nominations":
          return <CandidateNominationsPanel />;
        default:
          return <CandidatePanel />;
      }
    }

    return <div>Unknown tab</div>;
  };

  return <DashboardLayout>{renderPanel()}</DashboardLayout>;
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-dashboard-bg">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

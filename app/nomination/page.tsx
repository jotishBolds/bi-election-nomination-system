// app/nomination/page.tsx
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { NominationFlow } from "@/components/nomination/nomination-flow";

export default function NominationPage() {
  return (
    <DashboardLayout>
      <NominationFlow />
    </DashboardLayout>
  );
}

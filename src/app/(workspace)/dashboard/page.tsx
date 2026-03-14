import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardSnapshot } from "@/lib/dashboard";
import { runtimeFlags } from "@/lib/env";

export default async function DashboardPage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <DashboardView
      snapshot={snapshot}
      runtimeMode={runtimeFlags.hasClaude ? "live" : "demo"}
    />
  );
}

import { SettingsView } from "@/components/settings/settings-view";
import { getDashboardSnapshot } from "@/lib/dashboard";
import { runtimeFlags } from "@/lib/env";

export default async function SettingsPage() {
  const snapshot = await getDashboardSnapshot();

  return <SettingsView currentUser={snapshot.currentUser} runtimeFlags={runtimeFlags} />;
}

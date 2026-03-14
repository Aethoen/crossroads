import { AppShell } from "@/components/app-shell";
import { WorkspaceGate } from "@/components/auth/workspace-gate";
import { getDashboardSnapshot } from "@/lib/dashboard";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const snapshot = await getDashboardSnapshot();

  return (
    <WorkspaceGate>
      <AppShell
        summary={{
          currentUserName: snapshot.currentUser.name,
          friendCount: snapshot.users.length - 1,
          relationshipCount: snapshot.friendships.filter((entry) => entry.status === "accepted").length,
          liveLocationCount: snapshot.locations.filter((entry) => entry.source === "live").length,
        }}
      >
        {children}
      </AppShell>
    </WorkspaceGate>
  );
}

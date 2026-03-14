import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CalendarConnect } from "@/components/settings/CalendarConnect";
import { LocationSettings } from "@/components/settings/LocationSettings";
import { ActivityPreferences } from "@/components/settings/ActivityPreferences";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { calendarConnected: true, locationSharingEnabled: true },
  });

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <div>
          <p className="paper-note inline-flex w-fit px-4 py-2 text-lg">Toolbox</p>
          <h1 className="mt-4 text-4xl font-bold">Settings</h1>
          <p className="mt-2 text-xl text-muted-foreground">
            Configure your connections and preferences.
          </p>
        </div>
        <CalendarConnect connected={user?.calendarConnected ?? false} />
        <LocationSettings enabled={user?.locationSharingEnabled ?? false} />
        <ActivityPreferences />
      </div>
    </AppShell>
  );
}

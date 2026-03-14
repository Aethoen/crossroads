import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SuggestionFeed } from "@/components/dashboard/SuggestionFeed";
import { UpcomingMeetups } from "@/components/dashboard/UpcomingMeetups";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  return (
    <AppShell>
      <div className="space-y-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="paper-note inline-flex w-fit px-4 py-2 text-lg">Weekly sketch</p>
            <h1 className="mt-4 text-4xl font-bold md:text-5xl">
            Hey {session.user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="mt-2 max-w-2xl text-xl text-muted-foreground">
              Here&apos;s who you could hang out with soon.
            </p>
          </div>
          <div className="paper-panel-soft max-w-sm px-4 py-3">
            <p className="text-lg text-muted-foreground">
              The dashboard keeps all suggestions, meetups, and group energy in one place.
            </p>
          </div>
        </div>
        <UpcomingMeetups />
        <SuggestionFeed />
      </div>
    </AppShell>
  );
}

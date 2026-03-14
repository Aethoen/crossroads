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
        <div>
          <h1 className="text-2xl font-bold">
            Hey {session.user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's who you could hang out with soon.
          </p>
        </div>
        <UpcomingMeetups />
        <SuggestionFeed />
      </div>
    </AppShell>
  );
}

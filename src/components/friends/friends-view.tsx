import { CheckCircle2, GitBranchPlus, LocateFixed, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { DashboardSnapshot } from "@/lib/types";

type FriendsViewProps = {
  snapshot: DashboardSnapshot;
};

export function FriendsView({ snapshot }: FriendsViewProps) {
  const friends = snapshot.users.filter((user) => user.id !== snapshot.currentUser.id);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="surface-glow">
        <p className="section-label">Coordination graph</p>
        <CardTitle className="mt-4 text-5xl leading-[0.95]">
          Friend requests become scheduling signals the moment they are accepted.
        </CardTitle>
        <CardDescription className="mt-4 max-w-2xl text-base leading-7">
          The MVP stays intentionally closed-world: people already know each other, so the product can focus on overlap, trust, and real plans instead of discovery.
        </CardDescription>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="primary">Add friend by email</Button>
          <Button variant="ghost">Import seed graph</Button>
        </div>
        <div className="mt-8 grid gap-4">
          {friends.map((friend) => {
            const location = snapshot.locations.find((entry) => entry.userId === friend.id);
            const routine = snapshot.routines.find((entry) => entry.ownerType === "user" && entry.ownerId === friend.id);

            return (
              <div
                key={friend.id}
                className="rounded-[24px] border border-card-border/70 bg-white/64 px-5 py-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-lg font-semibold">{friend.name}</div>
                    <p className="mt-1 text-sm text-muted">
                      {location ? `${location.source === "live" ? "Live nearby" : "Manual check-in"} · ${location.label}` : "No recent location"}
                    </p>
                  </div>
                  <Badge variant="cool">
                    {snapshot.suggestions.filter((suggestion) => suggestion.participantIds.includes(friend.id)).length} shared suggestions
                  </Badge>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted">
                  {routine?.summary ??
                    `${friend.name.split(" ")[0]} has calendar sync enabled and contributes activity preference signals to the matcher.`}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.22em] text-stone-500">
                  {friend.locationMode === "live" ? "Warm lead" : "Needs a fresh check-in"}
                </p>
              </div>
            );
          })}
        </div>
      </Card>
      <div className="grid gap-6">
        <Card className="bg-stone-950 text-stone-100">
          <p className="section-label text-stone-400">Why this matters</p>
          <div className="mt-5 grid gap-4">
            <div className="flex gap-4">
              <LocateFixed className="mt-1 h-5 w-5 text-primary" />
              <p className="text-sm leading-6 text-stone-300">
                Accepted relationships unlock location-aware matching with far less privacy ambiguity than open discovery.
              </p>
            </div>
            <div className="flex gap-4">
              <Sparkles className="mt-1 h-5 w-5 text-accent" />
              <p className="text-sm leading-6 text-stone-300">
                Each friendship edge accumulates activity hints and prior accept or skip outcomes for better AI ranking.
              </p>
            </div>
            <div className="flex gap-4">
              <GitBranchPlus className="mt-1 h-5 w-5 text-secondary" />
              <p className="text-sm leading-6 text-stone-300">
                The demo graph is small, but the service layer is already shaped for denser circles and group-heavy campuses.
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-secondary" />
            <p className="font-semibold">Seeded demo path</p>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">
            This seed keeps one gym partner, one study partner, and one flexible social friend so the dashboard can surface visibly different meetup patterns.
          </p>
        </Card>
      </div>
    </div>
  );
}

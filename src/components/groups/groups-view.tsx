import { Flame, MapPinned, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { activityLabels } from "@/lib/constants";
import type { DashboardSnapshot } from "@/lib/types";

type GroupsViewProps = {
  snapshot: DashboardSnapshot;
};

export function GroupsView({ snapshot }: GroupsViewProps) {
  return (
    <div className="grid gap-6">
      <Card className="surface-glow overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="section-label">Shared rituals</p>
            <CardTitle className="mt-4 text-5xl leading-[0.95]">
              Groups let the engine spot patterns before any one person starts planning.
            </CardTitle>
            <CardDescription className="mt-4 max-w-2xl text-base leading-7">
              Gym crews, study pods, roommates, brunch circles. The group layer gives Claude social scaffolding so suggestions feel contextual instead of random.
            </CardDescription>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="secondary">Create group</Button>
              <Button variant="ghost">Invite members</Button>
            </div>
          </div>
          <div className="rounded-[30px] border border-card-border/70 bg-stone-950 px-5 py-5 text-stone-100">
            <p className="section-label text-stone-500">Group heuristics</p>
            <div className="mt-5 grid gap-5">
              <div className="flex gap-3">
                <UsersRound className="mt-1 h-5 w-5 text-accent" />
                <p className="text-sm leading-6 text-stone-300">
                  Prefer 2 to 4 participants to keep confirmation rates high in the MVP.
                </p>
              </div>
              <div className="flex gap-3">
                <Flame className="mt-1 h-5 w-5 text-primary" />
                <p className="text-sm leading-6 text-stone-300">
                  Boost groups with recurring routine cards such as Tuesday and Thursday study blocks after lab.
                </p>
              </div>
              <div className="flex gap-3">
                <MapPinned className="mt-1 h-5 w-5 text-secondary" />
                <p className="text-sm leading-6 text-stone-300">
                  Venue suggestions anchor to the centroid of live or manual check-ins before they reach Claude.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-3">
        {snapshot.groups.map((group) => {
          const memberCount = snapshot.groupMembers.filter((member) => member.groupId === group.id).length;
          const routine = snapshot.routines.find((entry) => entry.ownerType === "group" && entry.ownerId === group.id);

          return (
            <Card key={group.id} className="h-full">
              <Badge variant="cool" className="w-fit">
                {memberCount} members
              </Badge>
              <CardTitle className="mt-4">{group.name}</CardTitle>
              <p className="mt-4 text-sm font-semibold text-foreground">
                {activityLabels[group.defaultActivity ?? group.activity ?? "hangout"]}
              </p>
              <p className="mt-2 text-sm text-muted">
                {routine ? `${routine.daysOfWeek.length} recurring windows · ${routine.locationLabel}` : group.homeAreaLabel}
              </p>
              <CardDescription className="mt-3">{group.description}</CardDescription>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

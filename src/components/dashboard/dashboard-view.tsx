"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowRight,
  CalendarClock,
  MapPin,
  RefreshCcw,
  Sparkles,
  TimerReset,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { activityLabels } from "@/lib/constants";
import type { DashboardSnapshot, MeetupRecord, MeetupSuggestion, UserProfile } from "@/lib/types";

const accentClasses = [
  "bg-primary/12 text-primary",
  "bg-secondary/12 text-secondary",
  "bg-accent/30 text-stone-800",
  "bg-stone-900/10 text-stone-800",
];

type DashboardViewProps = {
  snapshot: DashboardSnapshot;
  runtimeMode: "demo" | "live";
};

function formatTimeLabel(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const dayLabel =
    diffDays <= 0 ? "Today" : diffDays === 1 ? "Tomorrow" : date.toLocaleDateString("en-US", { weekday: "short" });

  return `${dayLabel} · ${date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function formatDuration(minutes: number) {
  return `${minutes} min`;
}

function participantInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function DashboardView({ snapshot, runtimeMode }: DashboardViewProps) {
  const userMap = useMemo(
    () => new Map(snapshot.users.map((user) => [user.id, user])),
    [snapshot.users],
  );
  const [suggestions, setSuggestions] = useState(snapshot.suggestions);
  const [meetups, setMeetups] = useState(snapshot.meetups);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const visibleSuggestions = useMemo(
    () => suggestions.filter((suggestion) => suggestion.status === "active"),
    [suggestions],
  );
  const liveLocations = snapshot.locations.filter((location) => location.source === "live").length;

  async function refreshSuggestions() {
    startTransition(async () => {
      const response = await fetch("/api/suggestions/refresh", { method: "POST" });
      const payload = (await response.json()) as { suggestions: MeetupSuggestion[] };
      setSuggestions(payload.suggestions);
      setInvitedIds([]);
    });
  }

  async function confirmSuggestion(suggestionId: string) {
    startTransition(async () => {
      const response = await fetch(`/api/suggestions/${suggestionId}/confirm`, { method: "POST" });
      const payload = (await response.json()) as { meetup: MeetupRecord };
      setSuggestions((current) =>
        current.map((suggestion) =>
          suggestion.id === suggestionId ? { ...suggestion, status: "confirmed" } : suggestion,
        ),
      );
      setMeetups((current) => [payload.meetup, ...current]);
    });
  }

  async function skipSuggestion(suggestionId: string) {
    startTransition(async () => {
      await fetch(`/api/suggestions/${suggestionId}/skip`, { method: "POST" });
      setSuggestions((current) =>
        current.map((suggestion) =>
          suggestion.id === suggestionId ? { ...suggestion, status: "skipped" } : suggestion,
        ),
      );
    });
  }

  function inviteSuggestion(suggestionId: string) {
    setInvitedIds((current) => (current.includes(suggestionId) ? current : [...current, suggestionId]));
  }

  const stats = [
    {
      label: "AI shortlist",
      value: visibleSuggestions.length.toString().padStart(2, "0"),
      detail: `${runtimeMode === "demo" ? "demo-backed" : "live"} meetup suggestions ready now`,
    },
    {
      label: "Active routines",
      value: snapshot.routines.length.toString().padStart(2, "0"),
      detail: "weekly habits reinforcing realistic meetup timing",
    },
    {
      label: "Live location pulse",
      value: liveLocations.toString().padStart(2, "0"),
      detail: "friends currently broadcasting a fresh area signal",
    },
  ];

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="surface-glow overflow-hidden">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="section-label">Suggested meetups</p>
              <h2 className="display-title mt-4 max-w-2xl text-5xl leading-[0.95] text-balance">
                Crossroads turns free time, proximity, and habit memory into plans your friends will actually confirm.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted">
                Candidate clusters come from deterministic overlap matching. Claude gets only valid windows, nearby venue options, and social memory cards, then returns structured meetup JSON.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => visibleSuggestions[0] && void confirmSuggestion(visibleSuggestions[0].id)}
                  disabled={isPending || visibleSuggestions.length === 0}
                >
                  Confirm top pick
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="lg" onClick={() => void refreshSuggestions()} disabled={isPending}>
                  <RefreshCcw className="h-4 w-4" />
                  Refresh shortlist
                </Button>
              </div>
            </div>
            <div className="grid gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[24px] border border-card-border/70 bg-white/62 px-4 py-4"
                >
                  <p className="section-label">{stat.label}</p>
                  <div className="display-title mt-3 text-4xl">{stat.value}</div>
                  <p className="mt-2 text-sm leading-6 text-muted">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card className="bg-stone-950 text-stone-100">
          <p className="section-label text-stone-400">How the engine thinks</p>
          <CardTitle className="mt-4 text-3xl text-stone-50">
            Structured reasoning, not a chat wrapper.
          </CardTitle>
          <CardDescription className="mt-4 text-stone-300">
            The shortlist is grounded in calendar overlap, location proximity, routine cards, and group relationships before Claude ranks the final candidates.
          </CardDescription>
          <div className="mt-6 grid gap-4">
            <div className="rounded-[24px] border border-stone-800 bg-stone-900/80 p-4">
              <div className="section-label text-stone-500">Inputs</div>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                {snapshot.friendships.filter((friendship) => friendship.status === "accepted").length} friend edges,{" "}
                {snapshot.groups.length} groups, {snapshot.locations.length} fresh location check-ins, and{" "}
                {snapshot.memoryCards.length} memory cards.
              </p>
            </div>
            <div className="rounded-[24px] border border-stone-800 bg-stone-900/80 p-4">
              <div className="section-label text-stone-500">Output</div>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                Up to five practical meetup suggestions with a reason string, ranked for low travel friction and high social fit.
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.45fr_0.55fr]">
        <div className="grid gap-5">
          {visibleSuggestions.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              order={index + 1}
              isPending={isPending}
              invited={invitedIds.includes(suggestion.id)}
              onConfirm={() => void confirmSuggestion(suggestion.id)}
              onInvite={() => inviteSuggestion(suggestion.id)}
              onSkip={() => void skipSuggestion(suggestion.id)}
              userMap={userMap}
            />
          ))}
          {visibleSuggestions.length === 0 ? (
            <Card>
              <p className="section-label">No more active picks</p>
              <CardTitle className="mt-3">The current shortlist has been cleared.</CardTitle>
              <CardDescription className="mt-3">
                Refresh suggestions to generate a new set of candidate meetups from the seeded graph.
              </CardDescription>
            </Card>
          ) : null}
        </div>
        <div className="grid gap-6">
          <Card>
            <p className="section-label">Tonight&apos;s pattern</p>
            <CardTitle className="mt-3">Small groups still win when travel time stays invisible.</CardTitle>
            <CardDescription className="mt-3">
              The highest-scoring suggestions keep groups between two and four people, under a short walk apart, and anchored to a shared habit.
            </CardDescription>
            <Divider className="my-5" />
            <div className="grid gap-3 text-sm text-muted">
              <div className="flex items-center gap-3">
                <TimerReset className="h-4 w-4 text-primary" />
                72-hour suggestion horizon
              </div>
              <div className="flex items-center gap-3">
                <UsersRound className="h-4 w-4 text-secondary" />
                Friend graph prioritized over cold discovery
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-accent" />
                Claude fallback stays deterministic if no API key is present
              </div>
            </div>
          </Card>
          <Card className="bg-white/70">
            <p className="section-label">Confirmed meetups</p>
            <CardTitle className="mt-3">One click turns a suggestion into a concrete plan.</CardTitle>
            <div className="mt-5 grid gap-4">
              {meetups.length === 0 ? (
                <p className="text-sm leading-6 text-muted">
                  Confirm any suggestion to watch it appear in the meetup timeline.
                </p>
              ) : (
                meetups.slice(0, 3).map((meetup) => (
                  <div
                    key={meetup.id}
                    className="rounded-[22px] border border-card-border/70 bg-white/72 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="cool">{activityLabels[meetup.activity]}</Badge>
                      <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                        Confirmed
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-foreground">
                      {formatTimeLabel(meetup.start)}
                    </p>
                    <p className="mt-2 text-sm text-muted">{meetup.location.name}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

type SuggestionCardProps = {
  suggestion: MeetupSuggestion;
  order: number;
  invited: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onInvite: () => void;
  onSkip: () => void;
  userMap: Map<string, UserProfile>;
};

function SuggestionCard({
  suggestion,
  order,
  invited,
  isPending,
  onConfirm,
  onInvite,
  onSkip,
  userMap,
}: SuggestionCardProps) {
  return (
    <Card className="surface-glow overflow-hidden">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="display-title flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-stone-950 text-xl text-stone-50">
            {String(order).padStart(2, "0")}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="warm">{activityLabels[suggestion.activity]}</Badge>
              <Badge variant="neutral">{Math.round(suggestion.confidence * 100)}% confidence</Badge>
            </div>
            <h3 className="display-title mt-3 text-3xl leading-tight">
              {activityLabels[suggestion.activity]} with{" "}
              {suggestion.participantIds
                .map((participantId) => userMap.get(participantId)?.name ?? participantId)
                .join(", ")}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{suggestion.reason}</p>
          </div>
        </div>
        <div className="rounded-[24px] border border-card-border/70 bg-white/72 px-4 py-4 text-sm text-muted">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            {formatTimeLabel(suggestion.startAt ?? suggestion.start)}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-secondary" />
            {suggestion.locationName ?? suggestion.location.name}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <TimerReset className="h-4 w-4 text-accent" />
            {formatDuration(suggestion.durationMinutes)}
          </div>
        </div>
      </div>
      <Divider className="my-5" />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {suggestion.participantIds.map((participantId, index) => {
              const participant = userMap.get(participantId);
              const name = participant?.name ?? participantId;
              return (
                <div key={participantId} className="flex items-center gap-3 rounded-full bg-white/70 px-3 py-2">
                  <Avatar className="h-9 w-9 border-0">
                    {participant?.avatarUrl ? <AvatarImage src={participant.avatarUrl} alt={name} /> : null}
                    <AvatarFallback className={accentClasses[index % accentClasses.length]}>
                      {participantInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{name}</span>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-muted">
            {suggestion.groupId ? "Group-backed candidate" : "Friend-pair candidate"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={onConfirm} disabled={isPending}>
            Confirm
          </Button>
          <Button variant="secondary" onClick={onInvite} disabled={isPending || invited}>
            {invited ? "Invite sent" : "Invite"}
          </Button>
          <Button variant="ghost" onClick={onSkip} disabled={isPending}>
            Skip
          </Button>
        </div>
      </div>
    </Card>
  );
}

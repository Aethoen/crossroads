"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, Clock, LogOut, MapPin, X } from "lucide-react";
import { MeetupWithParticipants } from "@/types";
import { cn } from "@/lib/utils";

const activityColors: Record<string, string> = {
  GYM: "bg-[#ffd4d4] text-[#7c2626]",
  EAT: "bg-[#ffe1bf] text-[#8c4a12]",
  STUDY: "bg-[#d7e7ff] text-[#244b80]",
  HANGOUT: "bg-[#fff9c4] text-[#675300]",
  COFFEE: "bg-[#e8d7c7] text-[#68462a]",
};

function formatTime(date: Date): string {
  return new Date(date).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function MeetupCard({
  meetup,
  onLeave,
  onAccept,
  onDecline,
  busy,
}: {
  meetup: MeetupWithParticipants;
  onLeave: (id: string) => void;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  busy: boolean;
}) {
  const isPendingInvite = meetup.myStatus === "PENDING";
  const isWaiting = meetup.myStatus === "ACCEPTED" && meetup.status === "PENDING";

  return (
    <Card className={cn("transition-transform duration-100 hover:rotate-[0.5deg]", isPendingInvite && "border-dashed")}>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{meetup.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={cn(activityColors[meetup.activity])}>
              {meetup.activity}
            </Badge>
            {!isPendingInvite && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                disabled={busy}
                onClick={() => onLeave(meetup.id)}
                title="Leave meetup"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-2 space-y-2">
        <div className="flex items-center gap-1 text-base text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatTime(meetup.startTime)} · {meetup.durationMinutes} min</span>
        </div>
        {meetup.location && (
          <div className="flex items-center gap-1 text-base text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{meetup.location}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1">
            {meetup.participants.map((p) => (
              <Avatar key={p.id} className="h-8 w-8 border-2 border-background">
                <AvatarImage src={p.image ?? ""} />
                <AvatarFallback className="text-sm">
                  {p.name?.slice(0, 1).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {meetup.participants.map((p) => p.name ?? p.email).join(", ")}
          </span>
        </div>

        {isPendingInvite && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" disabled={busy} onClick={() => onAccept(meetup.id)} className="flex-1">
              <Check className="h-4 w-4 mr-1" /> Accept
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onDecline(meetup.id)} className="flex-1">
              <X className="h-4 w-4 mr-1" /> Decline
            </Button>
          </div>
        )}

        {isWaiting && (
          <p className="text-sm text-muted-foreground italic">Waiting for others to accept…</p>
        )}
      </CardContent>
    </Card>
  );
}

export function UpcomingMeetups() {
  const [meetups, setMeetups] = useState<MeetupWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/meetups")
      .then((r) => r.json())
      .then((data) => setMeetups(data))
      .finally(() => setLoading(false));
  }, []);

  async function handleLeave(meetupId: string) {
    setBusy(meetupId);
    try {
      const res = await fetch(`/api/meetups/${meetupId}`, { method: "DELETE" });
      if (res.ok) setMeetups((prev) => prev.filter((m) => m.id !== meetupId));
    } finally {
      setBusy(null);
    }
  }

  async function handleAccept(meetupId: string) {
    setBusy(meetupId);
    try {
      const res = await fetch(`/api/meetups/${meetupId}/accept`, { method: "POST" });
      if (res.ok) {
        setMeetups((prev) =>
          prev.map((m) =>
            m.id === meetupId ? { ...m, myStatus: "ACCEPTED", status: "CONFIRMED" } : m
          )
        );
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleDecline(meetupId: string) {
    setBusy(meetupId);
    try {
      const res = await fetch(`/api/meetups/${meetupId}/decline`, { method: "POST" });
      if (res.ok) setMeetups((prev) => prev.filter((m) => m.id !== meetupId));
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="paper-panel-soft h-36 animate-pulse" />;
  if (meetups.length === 0) return null;

  const invites = meetups.filter((m) => m.myStatus === "PENDING");
  const rest = meetups.filter((m) => m.myStatus !== "PENDING");

  return (
    <div className="space-y-4">
      {invites.length > 0 && (
        <div className="space-y-2">
          <h2 className="section-title text-3xl font-semibold">Invites</h2>
          {invites.map((m) => (
            <MeetupCard key={m.id} meetup={m} onLeave={handleLeave} onAccept={handleAccept} onDecline={handleDecline} busy={busy === m.id} />
          ))}
        </div>
      )}
      {rest.length > 0 && (
        <div className="space-y-2">
          <h2 className="section-title text-3xl font-semibold">Upcoming Meetups</h2>
          {rest.map((m) => (
            <MeetupCard key={m.id} meetup={m} onLeave={handleLeave} onAccept={handleAccept} onDecline={handleDecline} busy={busy === m.id} />
          ))}
        </div>
      )}
    </div>
  );
}

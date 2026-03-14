"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin } from "lucide-react";
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

export function UpcomingMeetups() {
  const [meetups, setMeetups] = useState<MeetupWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/meetups")
      .then((r) => r.json())
      .then((data) => setMeetups(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="paper-panel-soft h-36 animate-pulse" />
    );
  }

  if (meetups.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="section-title text-3xl font-semibold">Upcoming Meetups</h2>
      <div className="space-y-2">
        {meetups.map((meetup) => (
          <Card key={meetup.id} className="transition-transform duration-100 hover:rotate-[0.5deg]">
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{meetup.title}</CardTitle>
                <Badge className={cn(activityColors[meetup.activity])}>
                  {meetup.activity}
                </Badge>
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

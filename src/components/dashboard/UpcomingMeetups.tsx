"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin } from "lucide-react";
import { MeetupWithParticipants } from "@/types";
import { cn } from "@/lib/utils";

const activityColors: Record<string, string> = {
  GYM: "bg-red-100 text-red-800",
  EAT: "bg-orange-100 text-orange-800",
  STUDY: "bg-blue-100 text-blue-800",
  HANGOUT: "bg-purple-100 text-purple-800",
  COFFEE: "bg-amber-100 text-amber-800",
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
      <div className="h-32 rounded-xl bg-muted animate-pulse" />
    );
  }

  if (meetups.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Upcoming Meetups</h2>
      <div className="space-y-2">
        {meetups.map((meetup) => (
          <Card key={meetup.id} className="hover:shadow-sm transition-shadow">
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{meetup.title}</CardTitle>
                <Badge className={cn("text-xs", activityColors[meetup.activity])}>
                  {meetup.activity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="py-2 space-y-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatTime(meetup.startTime)} · {meetup.durationMinutes} min</span>
              </div>
              {meetup.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{meetup.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1">
                  {meetup.participants.map((p) => (
                    <Avatar key={p.id} className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={p.image ?? ""} />
                      <AvatarFallback className="text-xs">
                        {p.name?.slice(0, 1).toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
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

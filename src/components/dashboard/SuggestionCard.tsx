"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Check, X } from "lucide-react";
import { SuggestionWithParticipants } from "@/types";
import { cn } from "@/lib/utils";

const activityColors: Record<string, string> = {
  GYM: "bg-[#ffd4d4] text-[#7c2626]",
  EAT: "bg-[#ffe1bf] text-[#8c4a12]",
  STUDY: "bg-[#d7e7ff] text-[#244b80]",
  HANGOUT: "bg-[#fff9c4] text-[#675300]",
  COFFEE: "bg-[#e8d7c7] text-[#68462a]",
};

const activityEmoji: Record<string, string> = {
  GYM: "💪",
  EAT: "🍽️",
  STUDY: "📚",
  HANGOUT: "🎉",
  COFFEE: "☕",
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

interface SuggestionCardProps {
  suggestion: SuggestionWithParticipants;
  onConfirm: (id: string) => Promise<void>;
  onSkip: (id: string) => Promise<void>;
}

export function SuggestionCard({ suggestion, onConfirm, onSkip }: SuggestionCardProps) {
  const [loading, setLoading] = useState<"confirm" | "skip" | null>(null);

  async function handleConfirm() {
    setLoading("confirm");
    await onConfirm(suggestion.id);
    setLoading(null);
  }

  async function handleSkip() {
    setLoading("skip");
    await onSkip(suggestion.id);
    setLoading(null);
  }

  const confidencePct = Math.round(suggestion.confidence * 100);

  return (
    <Card className="rotate-[0.4deg] transition-transform duration-100 hover:-rotate-[0.4deg]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge className={cn(activityColors[suggestion.activity])}>
            {activityEmoji[suggestion.activity]} {suggestion.activity}
          </Badge>
          <span className="paper-panel-soft px-2 py-1 text-sm text-muted-foreground">
            {confidencePct}% match
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {(suggestion.participantProfiles ?? []).map((p) => (
              <Avatar key={p.id} className="h-7 w-7 border-2 border-background">
                <AvatarImage src={p.image ?? ""} />
                <AvatarFallback className="text-xs">
                  {p.name?.slice(0, 2).toUpperCase() ?? "??"}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-lg font-medium">
            {(suggestion.participantProfiles ?? [])
              .map((p) => p.name ?? p.email)
              .join(" + ")}
          </span>
        </div>
        <div className="flex items-center gap-1 text-base text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatTime(suggestion.startTime)}</span>
          <span className="ml-1">· {suggestion.durationMinutes} min</span>
        </div>
        {suggestion.location && (
          <div className="flex items-center gap-1 text-base text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{suggestion.location}</span>
          </div>
        )}
        <p className="text-base text-foreground/80">{suggestion.reason}</p>
      </CardContent>
      <CardFooter className="gap-2 pt-0">
        <Button
          size="sm"
          className="flex-1"
          onClick={handleConfirm}
          disabled={loading !== null}
        >
          {loading === "confirm" ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Check className="h-4 w-4 mr-1" /> Confirm
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleSkip}
          disabled={loading !== null}
        >
          {loading === "skip" ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-transparent" />
          ) : (
            <>
              <X className="h-4 w-4 mr-1" /> Skip
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

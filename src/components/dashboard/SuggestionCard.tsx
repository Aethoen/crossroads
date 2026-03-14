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
  GYM: "bg-red-100 text-red-800",
  EAT: "bg-orange-100 text-orange-800",
  STUDY: "bg-blue-100 text-blue-800",
  HANGOUT: "bg-purple-100 text-purple-800",
  COFFEE: "bg-amber-100 text-amber-800",
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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge className={cn("text-xs", activityColors[suggestion.activity])}>
            {activityEmoji[suggestion.activity]} {suggestion.activity}
          </Badge>
          <span className="text-xs text-muted-foreground">{confidencePct}% match</span>
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
          <span className="text-sm font-medium">
            {(suggestion.participantProfiles ?? [])
              .map((p) => p.name ?? p.email)
              .join(" + ")}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatTime(suggestion.startTime)}</span>
          <span className="ml-1">· {suggestion.durationMinutes} min</span>
        </div>
        {suggestion.location && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{suggestion.location}</span>
          </div>
        )}
        <p className="text-sm text-foreground/80">{suggestion.reason}</p>
      </CardContent>
      <CardFooter className="gap-2 pt-0">
        <Button
          size="sm"
          className="flex-1"
          onClick={handleConfirm}
          disabled={loading !== null}
        >
          {loading === "confirm" ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-muted" />
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

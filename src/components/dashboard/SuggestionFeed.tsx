"use client";

import { useCallback, useEffect, useState } from "react";
import { SuggestionCard } from "./SuggestionCard";
import { SuggestionWithParticipants } from "@/types";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function SuggestionFeed() {
  const [suggestions, setSuggestions] = useState<SuggestionWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSuggestions = useCallback(async (force = false) => {
    try {
      const url = force
        ? "/api/suggestions?force=1"
        : "/api/suggestions";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load suggestions");
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
      setError(null);
    } catch {
      setError("Could not load suggestions");
    }
  }, []);

  useEffect(() => {
    loadSuggestions().finally(() => setLoading(false));
  }, [loadSuggestions]);

  async function handleRefresh() {
    setRefreshing(true);
    // Delete pending suggestions then re-fetch fresh ones
    try {
      await fetch("/api/suggestions/invalidate", { method: "POST" });
    } catch {
      // ignore
    }
    await loadSuggestions();
    setRefreshing(false);
  }

  async function handleConfirm(id: string) {
    const res = await fetch(`/api/meetups/${id}/confirm`, { method: "POST" });
    if (res.ok) {
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    }
  }

  async function handleSkip(id: string) {
    const res = await fetch(`/api/suggestions/${id}/skip`, { method: "POST" });
    if (res.ok) {
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Suggestions</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          {error}
        </div>
      )}

      {suggestions.length === 0 && !error && (
        <div className="text-center py-12 text-muted-foreground space-y-2">
          <p className="font-medium">No suggestions yet</p>
          <p className="text-sm">
            Add friends, connect your calendar, and share your location to get
            personalized meetup suggestions.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((s) => (
          <SuggestionCard
            key={s.id}
            suggestion={s}
            onConfirm={handleConfirm}
            onSkip={handleSkip}
          />
        ))}
      </div>
    </div>
  );
}

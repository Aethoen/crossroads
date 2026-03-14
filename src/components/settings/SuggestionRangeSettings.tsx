"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const RANGE_OPTIONS = [
  { value: "1", label: "1 day ahead" },
  { value: "3", label: "3 days ahead" },
  { value: "7", label: "7 days ahead" },
];

export function SuggestionRangeSettings() {
  const [range, setRange] = useState<string>("1");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: { suggestionRangeDays: number }) => {
        setRange(String(data.suggestionRangeDays));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleChange(value: string | null) {
    if (!value) return;
    setRange(value);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestionRangeDays: Number(value) }),
    });
    // Invalidate cached suggestions so next load uses the new range
    await fetch("/api/suggestions/invalidate", { method: "POST" });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Suggestion Range</CardTitle>
        <CardDescription>
          How far ahead to look when suggesting meetups.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-10 bg-muted animate-pulse rounded-lg" />
        ) : (
          <div className="flex items-center gap-4">
            <Label htmlFor="suggestion-range">Look ahead</Label>
            <Select value={range} onValueChange={handleChange}>
              <SelectTrigger id="suggestion-range" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

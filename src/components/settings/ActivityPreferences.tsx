"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ActivityType } from "@/types";

const activities: { value: ActivityType; label: string; emoji: string }[] = [
  { value: "GYM", label: "Gym", emoji: "💪" },
  { value: "EAT", label: "Eat out", emoji: "🍽️" },
  { value: "STUDY", label: "Study", emoji: "📚" },
  { value: "HANGOUT", label: "Hangout", emoji: "🎉" },
  { value: "COFFEE", label: "Coffee", emoji: "☕" },
];

export function ActivityPreferences() {
  const [selected, setSelected] = useState<Set<ActivityType>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((data: { activity: ActivityType }[]) => {
        setSelected(new Set(data.map((p) => p.activity)));
      })
      .finally(() => setLoading(false));
  }, []);

  function toggle(activity: ActivityType) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(activity)) {
        next.delete(activity);
      } else {
        next.add(activity);
      }
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activities: [...selected] }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <Card className="-rotate-[0.3deg]">
      <CardHeader>
        <CardTitle className="text-2xl">Activity Preferences</CardTitle>
        <CardDescription>
          Select activities you enjoy so Claude can suggest relevant meetups.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="paper-panel-soft h-28 animate-pulse" />
        ) : (
          <>
            <div className="space-y-3">
              {activities.map(({ value, label, emoji }) => (
                <div key={value} className="paper-panel-soft flex items-center justify-between px-4 py-3">
                  <Label className="flex cursor-pointer items-center gap-2 text-lg">
                    <span>{emoji}</span>
                    <span>{label}</span>
                  </Label>
                  <Switch
                    checked={selected.has(value)}
                    onCheckedChange={() => toggle(value)}
                  />
                </div>
              ))}
            </div>
            <Button onClick={handleSave} size="sm" disabled={saving}>
              {saving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

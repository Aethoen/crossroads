"use client";

import { useState } from "react";
import { LockKeyhole, Orbit, Route, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { UserProfile } from "@/lib/types";

const iconMap = [ShieldCheck, Route, Orbit];

type SettingsViewProps = {
  currentUser: UserProfile;
  runtimeFlags: {
    hasGoogleAuth: boolean;
    hasDatabase: boolean;
    hasClaude: boolean;
    hasPlaces: boolean;
  };
};

export function SettingsView({ currentUser, runtimeFlags }: SettingsViewProps) {
  const [calendarEnabled, setCalendarEnabled] = useState(currentUser.calendarConnected);
  const [locationEnabled, setLocationEnabled] = useState(currentUser.locationMode !== "disabled");
  const [routineInferenceEnabled, setRoutineInferenceEnabled] = useState(runtimeFlags.hasClaude);

  const panels = [
    {
      title: "Calendar Sync",
      body: currentUser.calendarConnected
        ? "Google Calendar is connected. Crossroads can read the next 14 days and recent history for routine inference."
        : "Calendar scopes are not connected yet. Demo mode still works with seeded availability data.",
      value: currentUser.calendarConnected ? "Healthy" : "Demo mode",
    },
    {
      title: "Location Pulse",
      body: currentUser.locationMode === "live"
        ? "Live location is active while the app is open, with manual check-in available as a fallback."
        : "Location is opt-in. Manual check-ins remain enough for the MVP matching flow.",
      value: currentUser.locationMode === "live" ? "Opted in" : "Manual only",
    },
    {
      title: "Suggestion Engine",
      body: runtimeFlags.hasClaude
        ? "Claude is available and returns the final shortlist as structured JSON."
        : "Claude is not configured, so the app is using the deterministic fallback suggestion engine.",
      value: runtimeFlags.hasClaude ? "Structured JSON" : "Fallback mode",
    },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card className="surface-glow">
        <p className="section-label">Signals and privacy</p>
        <CardTitle className="mt-4 text-5xl leading-[0.95]">
          Tight control over what the engine sees, with enough signal to make useful plans.
        </CardTitle>
        <CardDescription className="mt-4 max-w-2xl text-base leading-7">
          The MVP keeps privacy legible: opt-in location, read-only calendar sync, and exact coordinates only for trusted friends and group matching.
        </CardDescription>
        <div className="mt-8 grid gap-4">
          <SettingToggle
            title="Calendar read access"
            description="Needed to compute free-time windows and infer recurring routines."
            checked={calendarEnabled}
            onCheckedChange={setCalendarEnabled}
          />
          <SettingToggle
            title="Live location pulse"
            description="Only active while the app is open. Falls back to manual check-in when disabled."
            checked={locationEnabled}
            onCheckedChange={setLocationEnabled}
          />
          <SettingToggle
            title="Routine inference"
            description="Lets Claude compress calendar history into lightweight weekly pattern cards."
            checked={routineInferenceEnabled}
            onCheckedChange={setRoutineInferenceEnabled}
          />
        </div>
      </Card>
      <div className="grid gap-5">
        {panels.map((panel, index) => {
          const Icon = iconMap[index] ?? LockKeyhole;

          return (
            <Card key={panel.title}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <Icon className="mt-0.5 h-5 w-5 text-secondary" />
                    <CardTitle className="text-2xl">{panel.title}</CardTitle>
                  </div>
                  <CardDescription className="mt-4">{panel.body}</CardDescription>
                </div>
                <Badge variant="gold">{panel.value}</Badge>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

type SettingToggleProps = {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

function SettingToggle({
  title,
  description,
  checked,
  onCheckedChange,
}: SettingToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[24px] border border-card-border/70 bg-white/62 px-5 py-5">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

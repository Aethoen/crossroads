"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarRange,
  Check,
  LoaderCircle,
  LocateFixed,
  MapPinned,
  Route,
  Sparkles,
} from "lucide-react";
import { authClient } from "@/components/auth/auth-client";
import { PublicSessionRedirect } from "@/components/auth/public-session-redirect";
import type { AppSession } from "@/components/auth/auth-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { Activity, LocationMode } from "@/lib/types";

const activityOptions: Activity[] = ["gym", "eat", "study", "hangout", "coffee"];

type OnboardingViewProps = {
  googleEnabled: boolean;
  calendarEnabled: boolean;
};

export function OnboardingView({
  googleEnabled,
  calendarEnabled,
}: OnboardingViewProps) {
  const router = useRouter();
  const sessionState = authClient.useSession();
  const session = sessionState.data as AppSession;

  const [selectedActivities, setSelectedActivities] = useState<Activity[]>(["gym", "coffee", "study"]);
  const [locationMode, setLocationMode] = useState<LocationMode>("live");
  const [manualLabel, setManualLabel] = useState("Campus Center");
  const [shareLiveLocation, setShareLiveLocation] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const calendarConnected = Boolean(session?.user?.calendarConnected);
  const completionReady = useMemo(
    () => selectedActivities.length > 0 && (calendarConnected || !calendarEnabled),
    [calendarConnected, calendarEnabled, selectedActivities.length],
  );

  async function handleCalendarConnect() {
    if (!calendarEnabled) {
      return;
    }

    window.location.href = "/api/google/calendar/connect";
  }

  async function handleFinish() {
    setIsSaving(true);

    try {
      const onboardingResponse = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          activityPreferences: selectedActivities,
          locationMode: shareLiveLocation ? "live" : locationMode,
          manualLabel,
        }),
      });

      if (!onboardingResponse.ok) {
        throw new Error("Failed to complete onboarding");
      }

      if (!shareLiveLocation && locationMode === "manual") {
        const manualCheckInResponse = await fetch("/api/location/check-in", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            label: manualLabel,
            latitude: 40.7308,
            longitude: -73.9973,
          }),
        });

        if (!manualCheckInResponse.ok) {
          throw new Error("Failed to save manual location");
        }
      }

      router.replace("/dashboard");
    } finally {
      setIsSaving(false);
    }
  }

  if (sessionState.isPending) {
    return (
      <div className="grid min-h-screen place-items-center px-4 py-6 lg:px-6">
        <Card className="surface-glow w-full max-w-xl text-center">
          <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-secondary" />
          <CardTitle className="mt-6 text-3xl">Loading onboarding state.</CardTitle>
          <CardDescription className="mt-3">
            Checking your Better Auth session and which signals are already connected.
          </CardDescription>
        </Card>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <>
        <PublicSessionRedirect />
        <div className="grid min-h-screen place-items-center px-4 py-6 lg:px-6">
          <Card className="surface-glow w-full max-w-xl text-center">
            <CardTitle className="text-3xl">A session is required before onboarding.</CardTitle>
            <CardDescription className="mt-3">
              Crossroads will send you back to login if the session is missing or expired.
            </CardDescription>
          </Card>
        </div>
      </>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1500px] items-center px-4 py-6 lg:px-6">
      <div className="grid w-full gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="surface-glow grain rounded-[34px] border border-card-border/80 bg-card p-7 shadow-panel">
          <Badge variant="cool" className="w-fit">
            Better Auth onboarding
          </Badge>
          <p className="section-label mt-6">Signal setup</p>
          <h1 className="display-title mt-4 text-5xl leading-[0.95]">
            Build a scheduling profile before the first suggestion lands.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            Calendar and location stay transparent. Choose what Crossroads can see, then step into the protected workspace with better defaults.
          </p>

          <div className="mt-8 grid gap-4">
            <StepCard
              icon={CalendarRange}
              title="Connect Google Calendar"
              description="Read-only Calendar access powers overlap detection and recurring routine inference."
              stateLabel={calendarConnected ? "Connected" : "Pending"}
              action={
                <Button
                  variant={calendarConnected ? "secondary" : "primary"}
                  onClick={() => void handleCalendarConnect()}
                  disabled={!googleEnabled || !calendarEnabled || calendarConnected}
                >
                  {calendarConnected ? "Calendar connected" : "Connect Calendar"}
                </Button>
              }
            />

            <StepCard
              icon={Sparkles}
              title="Choose activity bias"
              description="These preferences help the matcher score gym, study, food, coffee, and hangout windows."
              stateLabel={`${selectedActivities.length} selected`}
              action={
                <div className="flex flex-wrap gap-2">
                  {activityOptions.map((activity) => {
                    const selected = selectedActivities.includes(activity);
                    return (
                      <button
                        key={activity}
                        type="button"
                        className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition-colors ${
                          selected
                            ? "border-secondary/30 bg-secondary/12 text-secondary"
                            : "border-card-border bg-white/60 text-muted"
                        }`}
                        onClick={() =>
                          setSelectedActivities((current) =>
                            current.includes(activity)
                              ? current.filter((entry) => entry !== activity)
                              : [...current, activity],
                          )
                        }
                      >
                        {selected ? <Check className="mr-2 inline h-3.5 w-3.5" /> : null}
                        {activity}
                      </button>
                    );
                  })}
                </div>
              }
            />

            <StepCard
              icon={MapPinned}
              title="Choose location mode"
              description="Foreground live sharing keeps the proximity signal fresh. Manual mode remains the fallback."
              stateLabel={shareLiveLocation ? "Live enabled" : `Mode: ${locationMode}`}
              action={
                <div className="grid gap-4">
                  <label className="flex items-center justify-between gap-4 rounded-[20px] border border-card-border/70 bg-white/64 px-4 py-3">
                    <div>
                      <div className="font-semibold">Share live location while the app is open</div>
                      <p className="mt-1 text-sm text-muted">
                        Uses browser geolocation in the foreground and sends periodic heartbeats.
                      </p>
                    </div>
                    <Switch checked={shareLiveLocation} onCheckedChange={setShareLiveLocation} />
                  </label>

                  {!shareLiveLocation ? (
                    <div className="flex flex-wrap gap-2">
                      {(["manual", "disabled"] as LocationMode[]).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition-colors ${
                            locationMode === mode
                              ? "border-primary/30 bg-primary/12 text-primary"
                              : "border-card-border bg-white/60 text-muted"
                          }`}
                          onClick={() => setLocationMode(mode)}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <div className="rounded-[20px] border border-card-border/70 bg-white/64 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <LocateFixed className="h-4 w-4 text-secondary" />
                      <div className="font-semibold">Manual fallback label</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["Campus Center", "North Library", "Rec Quad", "Commons Kitchen"].map((label) => (
                        <button
                          key={label}
                          type="button"
                          className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition-colors ${
                            manualLabel === label
                              ? "border-secondary/30 bg-secondary/12 text-secondary"
                              : "border-card-border bg-white/60 text-muted"
                          }`}
                          onClick={() => setManualLabel(label)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              }
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              variant="primary"
              onClick={() => void handleFinish()}
              disabled={isSaving || !completionReady}
            >
              {isSaving ? "Saving setup" : "Enter workspace"}
              <Route className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="lg" onClick={() => router.replace("/dashboard")}>
              Use demo defaults
            </Button>
          </div>
        </section>

        <section className="grid gap-6">
          <Card className="bg-stone-950 text-stone-100">
            <p className="section-label text-stone-400">Current account</p>
            <CardTitle className="mt-4 text-4xl text-stone-50">
              {session.user.name ?? session.user.email ?? "Signed-in account"}
            </CardTitle>
            <CardDescription className="mt-4 text-stone-300">
              Better Auth already established identity. This step only decides which coordination signals can shape suggestions.
            </CardDescription>
            <div className="mt-6 grid gap-4">
              <div className="rounded-[24px] border border-stone-800 bg-stone-900/70 p-4">
                <div className="text-sm font-semibold text-stone-100">Session</div>
                <p className="mt-2 text-sm leading-6 text-stone-300">
                  Signed in with Google and ready to enter the protected workspace.
                </p>
              </div>
              <div className="rounded-[24px] border border-stone-800 bg-stone-900/70 p-4">
                <div className="text-sm font-semibold text-stone-100">Calendar</div>
                <p className="mt-2 text-sm leading-6 text-stone-300">
                  {calendarConnected
                    ? "Calendar is already connected and available for overlap analysis."
                    : "Calendar consent is still pending. You can continue later, but suggestions will be weaker."}
                </p>
              </div>
              <div className="rounded-[24px] border border-stone-800 bg-stone-900/70 p-4">
                <div className="text-sm font-semibold text-stone-100">Location</div>
                <p className="mt-2 text-sm leading-6 text-stone-300">
                  Foreground-only web location keeps the demo credible without pretending background tracking works everywhere.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <p className="section-label">Completion logic</p>
            <CardTitle className="mt-4">The gate only opens when the profile is useful.</CardTitle>
            <CardDescription className="mt-4">
              Crossroads expects at least one activity preference plus either a connected Calendar or an explicit decision to continue without it.
            </CardDescription>
          </Card>
        </section>
      </div>
    </div>
  );
}

type StepCardProps = {
  icon: typeof Sparkles;
  title: string;
  description: string;
  stateLabel: string;
  action: React.ReactNode;
};

function StepCard({
  icon: Icon,
  title,
  description,
  stateLabel,
  action,
}: StepCardProps) {
  return (
    <div className="rounded-[26px] border border-card-border/70 bg-white/68 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-secondary" />
            <div className="font-semibold">{title}</div>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>
        </div>
        <Badge variant="gold">{stateLabel}</Badge>
      </div>
      <div className="mt-5">{action}</div>
    </div>
  );
}

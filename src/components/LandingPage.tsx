"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Calendar,
    title: "Calendar-aware",
    description: "Connects to Google Calendar to find shared free windows automatically.",
  },
  {
    icon: MapPin,
    title: "Proximity-smart",
    description: "Knows when you're nearby friends for spontaneous meetups.",
  },
  {
    icon: Sparkles,
    title: "AI-powered",
    description: "Claude analyzes your availability, preferences, and context to suggest the perfect hangout.",
  },
  {
    icon: Users,
    title: "Group-aware",
    description: "Works with pairs and groups — your study group, friend circle, workout crew.",
  },
];

export function LandingPage() {
  return (
    <div className="page-shell relative min-h-screen overflow-hidden">
      <div className="relative z-10 mx-auto flex max-w-6xl flex-1 flex-col justify-center px-4 py-14 md:px-6 md:py-20">
        <div className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="paper-note inline-flex items-center gap-2 px-4 py-2">
              <Sparkles className="h-5 w-5" strokeWidth={2.5} />
              <span className="text-lg">Sketching your social calendar</span>
            </div>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-bold leading-[0.9] tracking-tight md:text-7xl">
                Plans feel easier when they look{" "}
                <span className="scribble-underline">human</span>.
              </h1>
              <p className="max-w-xl text-xl text-muted-foreground md:text-2xl">
                Stop wondering when to hang out.{" "}
                <span className="font-semibold text-foreground">
                  Crossroads coordinates calendars, places, and people without losing the warmth.
                </span>
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button
                size="lg"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="min-w-56"
              >
                Sign in with Google
              </Button>
              <div className="paper-panel-soft -rotate-1 px-4 py-3">
                <p className="text-lg">Calendar-aware. Group-aware. Nearby-aware.</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="paper-panel relative rotate-2 bg-white p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                    This week
                  </p>
                  <h2 className="section-title text-3xl">Your coordination board</h2>
                </div>
                <div className="ink-icon h-12 w-12 -rotate-6">
                  <Users className="h-5 w-5" strokeWidth={2.5} />
                </div>
              </div>
              <div className="space-y-4">
                {features.slice(0, 3).map(({ icon: Icon, title, description }, index) => (
                  <div
                    key={title}
                    className={cn(
                      "paper-panel-soft flex items-start gap-4 px-4 py-4",
                      index % 2 === 0 ? "-rotate-1" : "rotate-1"
                    )}
                  >
                    <div className="ink-icon mt-1 h-11 w-11 shrink-0">
                      <Icon className="h-5 w-5" strokeWidth={2.5} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="section-title text-xl">{title}</h3>
                      <p className="text-base text-muted-foreground">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="paper-note absolute -bottom-6 -left-2 hidden px-4 py-3 md:block">
              <p className="text-xl">Yes, the cards wiggle on purpose.</p>
            </div>
          </div>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-4">
          {features.map(({ icon: Icon, title, description }, index) => (
            <Card
              key={title}
              className={cn(
                "text-left",
                index % 2 === 0 ? "rotate-1" : "-rotate-1"
              )}
            >
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-center gap-3">
                  <div className="ink-icon h-11 w-11">
                    <Icon className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                  <h3 className="section-title text-2xl">{title}</h3>
                </div>
                <p className="text-base text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

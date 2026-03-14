"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Sparkles, Users } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center space-y-8 py-20">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">Crossroads</h1>
          <p className="text-xl text-muted-foreground max-w-md">
            Stop wondering when to hang out.{" "}
            <span className="text-foreground font-medium">
              AI coordinates your social life.
            </span>
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="text-base px-8"
        >
          Sign in with Google
        </Button>

        <div className="grid gap-4 sm:grid-cols-2 max-w-2xl w-full pt-8">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="text-left">
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarRange, MapPinned, Sparkles, UsersRound } from "lucide-react";
import { authClient } from "@/components/auth/auth-client";
import { PublicSessionRedirect } from "@/components/auth/public-session-redirect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type LoginViewProps = {
  googleEnabled: boolean;
};

export function LoginView({ googleEnabled }: LoginViewProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleGoogleSignIn() {
    if (!googleEnabled) {
      return;
    }

    setIsPending(true);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/onboarding",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <PublicSessionRedirect />
      <div className="mx-auto flex min-h-screen max-w-[1500px] items-center px-4 py-6 lg:px-6">
        <div className="grid w-full gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="surface-glow grain rounded-[34px] border border-card-border/80 bg-card p-7 shadow-panel">
            <Badge variant="gold" className="w-fit">
              Better Auth arrival gate
            </Badge>
            <div className="mt-6 max-w-3xl">
              <p className="section-label">Crossroads</p>
              <h1 className="display-title mt-4 text-6xl leading-[0.92] text-balance">
                Turn a verified Google account into a real meetup engine in under a minute.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
                Sign in once, layer on Calendar and location consent during onboarding, and let Crossroads suggest plans that already fit your group.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => void handleGoogleSignIn()}
                disabled={!googleEnabled || isPending}
              >
                {googleEnabled ? "Continue with Google" : "Google auth not configured"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/dashboard">Open demo workspace</Link>
              </Button>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <SignalCard
                icon={CalendarRange}
                label="Calendar ready"
                body="Step-up Google consent happens after sign-in so the first auth moment stays clear."
              />
              <SignalCard
                icon={MapPinned}
                label="Foreground location"
                body="Only while the app is open, with a manual fallback the user controls."
              />
              <SignalCard
                icon={UsersRound}
                label="Known circles"
                body="Friend and group context stays intact after auth so the dashboard feels immediately useful."
              />
            </div>
          </section>
          <section className="grid gap-6">
            <Card className="bg-stone-950 text-stone-100">
              <p className="section-label text-stone-400">Why the flow is split</p>
              <CardTitle className="mt-4 text-4xl text-stone-50">
                Identity first. Signal permissions second.
              </CardTitle>
              <CardDescription className="mt-4 text-stone-300">
                Better Auth handles the Google session. Calendar and live location then enter as explicit onboarding choices instead of being bundled into a single heavy consent screen.
              </CardDescription>
              <div className="mt-6 grid gap-4 text-sm leading-6 text-stone-300">
                <div className="rounded-[24px] border border-stone-800 bg-stone-900/70 p-4">
                  Google login establishes identity and a durable app session.
                </div>
                <div className="rounded-[24px] border border-stone-800 bg-stone-900/70 p-4">
                  Calendar connect requests only read access for suggestion generation.
                </div>
                <div className="rounded-[24px] border border-stone-800 bg-stone-900/70 p-4">
                  Location stays opt-in and foreground-only for the web MVP.
                </div>
              </div>
            </Card>
            <Card>
              <p className="section-label">Environment status</p>
              <CardTitle className="mt-4">Auth can degrade gracefully for demos.</CardTitle>
              <CardDescription className="mt-4">
                {googleEnabled
                  ? "Google sign-in is available in this environment. On successful auth, the user is routed into onboarding."
                  : "Google credentials are missing, so the login CTA is disabled and the demo workspace remains the fallback."}
              </CardDescription>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
}

type SignalCardProps = {
  icon: typeof Sparkles;
  label: string;
  body: string;
};

function SignalCard({ icon: Icon, label, body }: SignalCardProps) {
  return (
    <div className="rounded-[24px] border border-card-border/70 bg-white/68 p-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-secondary" />
        <div className="font-semibold">{label}</div>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">{body}</p>
    </div>
  );
}

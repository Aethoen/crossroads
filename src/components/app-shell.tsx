"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPinned, LogOut, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { authClient } from "@/components/auth/auth-client";
import type { AppSession } from "@/components/auth/auth-types";
import { navItems } from "@/components/crossroads-demo-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";

type AppShellProps = {
  children: React.ReactNode;
  summary: {
    currentUserName: string;
    friendCount: number;
    relationshipCount: number;
    liveLocationCount: number;
  };
};

export function AppShell({ children, summary }: AppShellProps) {
  const currentPath = usePathname();
  const sessionState = authClient.useSession();
  const session = sessionState.data as AppSession;

  async function handleSignOut() {
    await authClient.signOut();
    window.location.href = "/login";
  }

  const currentUserName = session?.user?.name ?? summary.currentUserName;
  const calendarConnected = Boolean(session?.user?.calendarConnected);
  const locationMode = session?.user?.locationMode ?? "disabled";

  return (
    <div className="mx-auto flex min-h-screen max-w-[1500px] gap-6 px-4 py-5 text-foreground lg:px-6">
      <aside className="backdrop-panel surface-glow hidden w-[290px] shrink-0 rounded-[34px] border border-card-border/80 p-6 lg:flex lg:flex-col">
        <Badge variant="gold" className="w-fit">
          Urban coordination engine
        </Badge>
        <div className="mt-5 space-y-4">
          <div>
            <p className="section-label">Crossroads</p>
            <h1 className="display-title mt-3 text-4xl leading-none">
              Meet at the right moment, not after ten texts.
            </h1>
          </div>
          <p className="text-sm leading-6 text-muted">
            Calendar overlap, live proximity, and friend chemistry condensed into a crisp shortlist.
          </p>
        </div>
        <nav className="mt-8 grid gap-2">
          {navItems.map((item) => {
            const active = currentPath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-[26px] border px-4 py-4 transition-all duration-200",
                  active
                    ? "border-secondary/30 bg-secondary/12 shadow-[0_14px_34px_rgba(15,118,110,0.14)]"
                    : "border-card-border/70 bg-white/50 hover:border-primary/20 hover:bg-white/80",
                )}
              >
                <div className="section-label">{item.kicker}</div>
                <div className="mt-2 text-lg font-semibold">{item.label}</div>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-[28px] border border-card-border/80 bg-stone-900 px-5 py-5 text-stone-100">
          <div className="flex items-center gap-3 text-sm">
            <Sparkles className="h-4 w-4 text-accent" />
            Claude shortlist active
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-300">
            Matching weighs overlap, proximity, and routine memory before the model composes final meetup cards.
          </p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <header className="backdrop-panel flex flex-col gap-4 rounded-[30px] border border-card-border/80 px-5 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-label">{currentUserName}&apos;s coordination graph</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Badge variant="warm">{summary.friendCount} friends in the circle</Badge>
                <Badge variant={calendarConnected ? "cool" : "gold"}>
                  {calendarConnected ? "Calendar synced" : "Calendar pending"}
                </Badge>
                <Badge variant={locationMode === "live" ? "cool" : "neutral"}>
                  {locationMode === "live" ? "Live location on" : "Location fallback"}
                </Badge>
              </div>
            </div>
            <div className="grid gap-3 text-sm text-muted sm:text-right">
              <div className="flex items-center justify-start gap-2 sm:justify-end">
                <UsersRound className="h-4 w-4 text-secondary" />
                {summary.relationshipCount} accepted relationships across active circles
              </div>
              <div className="flex items-center justify-start gap-2 sm:justify-end">
                <MapPinned className="h-4 w-4 text-primary" />
                {summary.liveLocationCount} live location pulses available right now
              </div>
              <div className="flex items-center justify-start gap-2 sm:justify-end">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Protected Better Auth workspace
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border/60 pt-4">
            <p className="text-sm text-muted">
              Signed in as {session?.user?.email ?? "demo@crossroads.local"}.
            </p>
            <Button variant="ghost" size="sm" onClick={() => void handleSignOut()}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
          <nav className="grid gap-2 lg:hidden">
            {navItems.map((item) => {
              const active = currentPath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-[22px] border px-4 py-3 text-sm font-medium",
                    active
                      ? "border-secondary/30 bg-secondary/12"
                      : "border-card-border/70 bg-white/50",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}

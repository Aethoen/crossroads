"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, RefreshCw, CheckCircle } from "lucide-react";
import { GOOGLE_AUTH_SCOPES } from "@/lib/google-scopes";

interface CalendarConnectProps {
  connected: boolean;
}

export function CalendarConnect({ connected: initialConnected }: CalendarConnectProps) {
  const [connected, setConnected] = useState(initialConnected);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);

  async function handleSync() {
    setSyncing(true);
    setErrorMessage(null);
    setNeedsReconnect(false);

    try {
      const res = await fetch("/api/calendar/sync", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setConnected(true);
        setLastSync(`${data.eventsImported} events imported, ${data.freeBlocks} free blocks`);
        return;
      }

      const data = (await res.json().catch(() => null)) as
        | { error?: string; code?: string }
        | null;

      setErrorMessage(data?.error ?? "Calendar sync failed");
      setNeedsReconnect(data?.code === "GOOGLE_SCOPE_MISSING");
    } finally {
      setSyncing(false);
    }
  }

  function handleReconnect() {
    return signIn(
      "google",
      { callbackUrl: "/settings" },
      {
        prompt: "consent",
        access_type: "offline",
        scope: GOOGLE_AUTH_SCOPES,
      }
    );
  }

  return (
    <Card className="-rotate-[0.4deg]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="ink-icon h-11 w-11">
              <Calendar className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <CardTitle className="text-2xl">Google Calendar</CardTitle>
          </div>
          {connected ? (
            <Badge className="bg-[#d8f0d2] text-[#284f1b]">
              <CheckCircle className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">Not synced</Badge>
          )}
        </div>
        <CardDescription>
          Sync your calendar so Crossroads knows when you&apos;re free.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {lastSync && (
          <p className="paper-panel-soft px-3 py-2 text-base text-muted-foreground">{lastSync}</p>
        )}
        {errorMessage && (
          <p className="rounded-md border border-[#d8b4b4] bg-[#fff1f1] px-3 py-2 text-sm text-[#7a2525]">
            {errorMessage}
          </p>
        )}
        <Button onClick={handleSync} disabled={syncing} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : connected ? "Re-sync Calendar" : "Sync Calendar"}
        </Button>
        {needsReconnect && (
          <Button onClick={handleReconnect} variant="outline" size="sm">
            Reconnect Google Calendar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

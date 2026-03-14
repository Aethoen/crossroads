"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, RefreshCw, CheckCircle } from "lucide-react";

interface CalendarConnectProps {
  connected: boolean;
}

export function CalendarConnect({ connected: initialConnected }: CalendarConnectProps) {
  const [connected, setConnected] = useState(initialConnected);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/calendar/sync", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setConnected(true);
        setLastSync(`${data.eventsImported} events imported, ${data.freeBlocks} free blocks`);
      }
    } finally {
      setSyncing(false);
    }
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
        <Button onClick={handleSync} disabled={syncing} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : connected ? "Re-sync Calendar" : "Sync Calendar"}
        </Button>
      </CardContent>
    </Card>
  );
}

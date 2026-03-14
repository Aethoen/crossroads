"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation } from "lucide-react";

interface LocationSettingsProps {
  enabled: boolean;
}

export function LocationSettings({ enabled: initialEnabled }: LocationSettingsProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState("");

  async function handleDetectLocation() {
    if (!navigator.geolocation) {
      setStatus("Geolocation not supported");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const res = await fetch("/api/location/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            label: label || undefined,
          }),
        });
        if (res.ok) {
          setEnabled(true);
          setStatus("Location updated");
        }
        setLoading(false);
      },
      () => {
        setStatus("Could not get location");
        setLoading(false);
      }
    );
  }

  return (
    <Card className="rotate-[0.5deg]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="ink-icon h-11 w-11">
              <MapPin className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <CardTitle className="text-2xl">Location Sharing</CardTitle>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            aria-label="Toggle location sharing"
          />
        </div>
        <CardDescription>
          Share your approximate location to get proximity-aware suggestions.
        </CardDescription>
      </CardHeader>
      {enabled && (
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="location-label">Label (optional)</Label>
            <Input
              id="location-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Campus, Home, Downtown"
            />
          </div>
          {status && <p className="paper-panel-soft px-3 py-2 text-base text-muted-foreground">{status}</p>}
          <Button onClick={handleDetectLocation} disabled={loading} size="sm">
            <Navigation className="h-4 w-4 mr-2" />
            {loading ? "Detecting..." : "Use Current Location"}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

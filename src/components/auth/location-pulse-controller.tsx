"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { LocateFixed, MapPinOff, Radar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LocationMode } from "@/lib/types";

type LocationPulseControllerProps = {
  enabled: boolean;
  mode: LocationMode;
};

export function LocationPulseController({
  enabled,
  mode,
}: LocationPulseControllerProps) {
  const [status, setStatus] = useState<"idle" | "active" | "blocked">("idle");
  const watchIdRef = useRef<number | null>(null);
  const lastSentAtRef = useRef(0);

  const sendHeartbeat = useEffectEvent(async (position: GeolocationPosition) => {
    const now = Date.now();
    if (now - lastSentAtRef.current < 30_000) {
      return;
    }

    lastSentAtRef.current = now;

    try {
      await fetch("/api/location/heartbeat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          source: "live",
        }),
      });
      setStatus("active");
    } catch {
      setStatus("blocked");
    }
  });

  useEffect(() => {
    if (!enabled || mode !== "live" || typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    if (document.visibilityState !== "visible") {
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        void sendHeartbeat(position);
      },
      () => {
        setStatus("blocked");
      },
      {
        enableHighAccuracy: false,
        maximumAge: 15_000,
        timeout: 15_000,
      },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, mode]);

  const badge = useMemo(() => {
    if (!enabled || mode === "disabled") {
      return {
        icon: MapPinOff,
        label: "Location off",
        variant: "neutral" as const,
      };
    }

    if (status === "active") {
      return {
        icon: Radar,
        label: "Live pulse active",
        variant: "cool" as const,
      };
    }

    if (status === "blocked") {
      return {
        icon: MapPinOff,
        label: "Location blocked",
        variant: "gold" as const,
      };
    }

    return {
      icon: LocateFixed,
      label: "Waiting for location",
      variant: "neutral" as const,
    };
  }, [enabled, mode, status]);

  const Icon = badge.icon;

  return (
    <div className="fixed right-4 bottom-4 z-50 rounded-full border border-card-border/70 bg-white/90 px-3 py-2 shadow-[0_18px_40px_rgba(28,25,23,0.12)] backdrop-blur md:right-6 md:bottom-6">
      <Badge variant={badge.variant} className="gap-2">
        <Icon className="h-3.5 w-3.5" />
        {badge.label}
      </Badge>
    </div>
  );
}

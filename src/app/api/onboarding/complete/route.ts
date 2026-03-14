import { NextResponse } from "next/server";
import { z } from "zod";
import { completeOnboarding, updateLocationMode, upsertActivityPreferences } from "@/lib/persistence";
import type { Activity, LocationMode } from "@/lib/types";
import { resolveViewerContext } from "@/lib/viewer";

const completionSchema = z.object({
  activityPreferences: z.array(
    z.enum(["gym", "eat", "study", "hangout", "coffee"]),
  ).min(1),
  locationMode: z.enum(["disabled", "manual", "live"]),
  manualLabel: z.string().min(2).max(120).optional(),
});

function buildActivityWeights(selectedActivities: Activity[]) {
  const allActivities: Activity[] = ["gym", "eat", "study", "hangout", "coffee"];
  return Object.fromEntries(
    allActivities.map((activity) => [activity, selectedActivities.includes(activity) ? 0.9 : 0.35]),
  ) as Record<Activity, number>;
}

export async function POST(request: Request) {
  const viewer = await resolveViewerContext();
  if (viewer.mode !== "auth") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = completionSchema.parse(await request.json());
  const locationMode = body.locationMode as LocationMode;

  await Promise.all([
    upsertActivityPreferences(viewer.userId, buildActivityWeights(body.activityPreferences as Activity[])),
    updateLocationMode(viewer.userId, locationMode),
    completeOnboarding(viewer.userId),
  ]);

  return NextResponse.json({
    ok: true,
    locationMode,
    manualLabel: body.manualLabel ?? null,
  });
}

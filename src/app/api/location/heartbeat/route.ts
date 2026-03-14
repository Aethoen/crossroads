import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertLocation } from "@/lib/location";
import { resolveViewerContext } from "@/lib/viewer";

const heartbeatSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracyMeters: z.number().nullable().optional(),
  label: z.string().min(2).default("Live location"),
});

export async function POST(request: Request) {
  const viewer = await resolveViewerContext();
  if (viewer.mode !== "auth") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = heartbeatSchema.parse(await request.json());
  await upsertLocation({
    userId: viewer.userId,
    latitude: body.latitude,
    longitude: body.longitude,
    accuracyMeters: body.accuracyMeters,
    label: body.label,
    source: "live",
  });

  return NextResponse.json({ ok: true });
}

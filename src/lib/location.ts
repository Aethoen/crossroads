import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, userLocations } from "@/db/schema";
import {
  LOCATION_HEARTBEAT_SECONDS,
  LOCATION_TTL_MINUTES,
} from "@/lib/constants";
import { stableHash } from "@/lib/time";

type LocationInput = {
  userId: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  label: string;
  source: "live" | "manual";
};

export async function upsertLocation({
  userId,
  latitude,
  longitude,
  accuracyMeters,
  label,
  source,
}: LocationInput) {
  const db = getDb();
  if (!db) {
    throw new Error("Database is not configured");
  }

  const now = new Date();
  const expiresAt =
    source === "live"
      ? new Date(now.getTime() + LOCATION_HEARTBEAT_SECONDS * 1000 + 15_000)
      : new Date(now.getTime() + LOCATION_TTL_MINUTES * 60_000);

  await db.delete(userLocations).where(eq(userLocations.userId, userId));
  await db.insert(userLocations).values({
    id: `loc-${stableHash(`${userId}:${source}:${now.toISOString()}`)}`,
    userId,
    latitude,
    longitude,
    accuracyMeters: accuracyMeters ?? null,
    label,
    source,
    capturedAt: now,
    expiresAt,
  });

  await db
    .update(users)
    .set({
      locationMode: source === "live" ? "live" : "manual",
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

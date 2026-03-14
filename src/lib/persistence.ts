import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  activityPreferences,
  calendarEvents,
  googleCalendarConnections,
  userLocations,
  users,
} from "@/db/schema";
import { decryptSecret, encryptSecret } from "@/lib/security";
import type {
  Activity,
  CalendarEvent,
  GoogleCalendarConnection,
  LocationMode,
  OnboardingState,
  UserLocation,
  UserProfile,
} from "@/lib/types";

const activities: Activity[] = ["gym", "eat", "study", "hangout", "coffee"];

function defaultActivityWeights(): Record<Activity, number> {
  return {
    gym: 0.5,
    eat: 0.5,
    study: 0.5,
    hangout: 0.5,
    coffee: 0.5,
  };
}

function toLocationSharingEnabled(mode: LocationMode) {
  return mode !== "disabled";
}

export async function getPersistedUserProfile(userId: string): Promise<UserProfile | null> {
  const db = getDb();
  if (!db) {
    return null;
  }

  const [user, weights] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, userId),
    }),
    db
      .select()
      .from(activityPreferences)
      .where(eq(activityPreferences.userId, userId)),
  ]);

  if (!user) {
    return null;
  }

  const activityWeights = defaultActivityWeights();
  for (const weight of weights) {
    activityWeights[weight.activity] = Number(weight.weight) / 100;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.image ?? user.name,
    avatarUrl: user.image ?? undefined,
    timezone: user.timezone,
    calendarConnected: user.calendarConnected,
    locationSharingEnabled: toLocationSharingEnabled(user.locationMode),
    locationMode: user.locationMode,
    activityPreferences: activityWeights,
  };
}

export async function upsertActivityPreferences(userId: string, weights: Record<Activity, number>) {
  const db = getDb();
  if (!db) {
    return;
  }

  await db.delete(activityPreferences).where(eq(activityPreferences.userId, userId));
  await db.insert(activityPreferences).values(
    activities.map((activity) => ({
      id: `${userId}:${activity}`,
      userId,
      activity,
      weight: Math.round((weights[activity] ?? 0.5) * 100),
      source: "manual",
    })),
  );
}

export async function updateLocationMode(userId: string, locationMode: LocationMode) {
  const db = getDb();
  if (!db) {
    return;
  }

  await db
    .update(users)
    .set({
      locationMode,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function completeOnboarding(userId: string) {
  const db = getDb();
  if (!db) {
    return;
  }

  await db
    .update(users)
    .set({
      onboardingCompletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function getOnboardingState(userId: string): Promise<OnboardingState | null> {
  const db = getDb();
  if (!db) {
    return null;
  }

  const [user, weights, location, connection] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }),
    db
      .select()
      .from(activityPreferences)
      .where(eq(activityPreferences.userId, userId)),
    db.query.userLocations.findFirst({
      where: and(eq(userLocations.userId, userId), gte(userLocations.expiresAt, new Date())),
      orderBy: desc(userLocations.capturedAt),
    }),
    db.query.googleCalendarConnections.findFirst({
      where: eq(googleCalendarConnections.userId, userId),
    }),
  ]);

  if (!user) {
    return null;
  }

  const hasActivityPreferences = weights.length > 0;
  const hasCalendarConnection = Boolean(connection);
  const hasCompletedLocationChoice = user.locationMode !== "disabled" || Boolean(location);

  return {
    hasActivityPreferences,
    hasCalendarConnection,
    hasCompletedLocationChoice,
    isComplete: Boolean(user.onboardingCompletedAt),
  };
}

export async function saveLocationHeartbeat(input: {
  userId: string;
  label: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  source: "live" | "manual";
  expiresAt: Date;
}) {
  const db = getDb();
  if (!db) {
    return;
  }

  await db.insert(userLocations).values({
    id: `${input.userId}:${Date.now()}`,
    userId: input.userId,
    label: input.label,
    latitude: input.latitude,
    longitude: input.longitude,
    accuracyMeters: input.accuracyMeters,
    source: input.source,
    capturedAt: new Date(),
    expiresAt: input.expiresAt,
  });
}

export async function getLatestUserLocation(userId: string): Promise<UserLocation | null> {
  const db = getDb();
  if (!db) {
    return null;
  }

  const location = await db.query.userLocations.findFirst({
    where: and(eq(userLocations.userId, userId), gte(userLocations.expiresAt, new Date())),
    orderBy: desc(userLocations.capturedAt),
  });

  if (!location) {
    return null;
  }

  return {
    id: location.id,
    userId: location.userId,
    label: location.label,
    latitude: location.latitude,
    longitude: location.longitude,
    accuracyMeters: location.accuracyMeters ?? undefined,
    source: location.source as "live" | "manual",
    capturedAt: location.capturedAt.toISOString(),
    expiresAt: location.expiresAt.toISOString(),
  };
}

export async function saveGoogleCalendarConnection(input: {
  userId: string;
  googleAccountId?: string | null;
  primaryCalendarId?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenType?: string | null;
  scope?: string | null;
  tokenExpiresAt?: Date | null;
}) {
  const db = getDb();
  if (!db) {
    return;
  }

  const existing = await db.query.googleCalendarConnections.findFirst({
    where: eq(googleCalendarConnections.userId, input.userId),
  });

  if (existing) {
    await db
      .update(googleCalendarConnections)
      .set({
        googleAccountId: input.googleAccountId ?? existing.googleAccountId,
        primaryCalendarId: input.primaryCalendarId ?? existing.primaryCalendarId,
        accessTokenEncrypted: input.accessToken
          ? encryptSecret(input.accessToken)
          : existing.accessTokenEncrypted,
        refreshTokenEncrypted: input.refreshToken
          ? encryptSecret(input.refreshToken)
          : existing.refreshTokenEncrypted,
        tokenType: input.tokenType ?? existing.tokenType,
        scope: input.scope ?? existing.scope,
        accessTokenExpiresAt: input.tokenExpiresAt ?? existing.accessTokenExpiresAt,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(googleCalendarConnections.userId, input.userId));
  } else {
    await db.insert(googleCalendarConnections).values({
      id: `gcal:${input.userId}`,
      userId: input.userId,
      googleAccountId: input.googleAccountId ?? input.userId,
      primaryCalendarId: input.primaryCalendarId ?? "primary",
      accessTokenEncrypted: encryptSecret(input.accessToken ?? ""),
      refreshTokenEncrypted: input.refreshToken ? encryptSecret(input.refreshToken) : null,
      tokenType: input.tokenType ?? null,
      scope: input.scope ?? null,
      accessTokenExpiresAt: input.tokenExpiresAt ?? null,
      lastSyncedAt: new Date(),
    });
  }

  await db
    .update(users)
    .set({
      calendarConnected: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, input.userId));
}

export async function getGoogleCalendarConnection(
  userId: string,
): Promise<(GoogleCalendarConnection & { accessToken?: string | null; refreshToken?: string | null; tokenExpiresAt?: string | null }) | null> {
  const db = getDb();
  if (!db) {
    return null;
  }

  const connection = await db.query.googleCalendarConnections.findFirst({
    where: eq(googleCalendarConnections.userId, userId),
  });

  if (!connection) {
    return null;
  }

  return {
    id: connection.id,
    userId: connection.userId,
    googleAccountId: connection.googleAccountId,
    primaryCalendarId: connection.primaryCalendarId,
    scope: connection.scope,
    tokenType: connection.tokenType,
    connectedAt: connection.createdAt.toISOString(),
    lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
    accessToken: decryptSecret(connection.accessTokenEncrypted),
    refreshToken: decryptSecret(connection.refreshTokenEncrypted),
    tokenExpiresAt: connection.accessTokenExpiresAt?.toISOString() ?? null,
  };
}

export async function replaceCalendarEventsForUser(userId: string, events: CalendarEvent[]) {
  const db = getDb();
  if (!db) {
    return;
  }

  const existing = await db
    .select({ id: calendarEvents.id })
    .from(calendarEvents)
    .where(eq(calendarEvents.userId, userId));

  if (existing.length > 0) {
    await db
      .delete(calendarEvents)
      .where(inArray(calendarEvents.id, existing.map((event) => event.id)));
  }

  if (events.length > 0) {
    await db.insert(calendarEvents).values(
      events.map((event) => ({
        id: event.id,
        userId,
        googleEventId: event.id,
        title: event.title,
        startsAt: new Date(event.startsAt),
        endsAt: new Date(event.endsAt),
        isBusy: event.isBusy,
        isRecurring: event.isRecurring,
        inferredActivity: event.inferredActivity,
        recurrenceJson: null,
        syncUpdatedAt: new Date(),
      })),
    );
  }
}

export async function listCalendarEventsForUser(userId: string): Promise<CalendarEvent[]> {
  const db = getDb();
  if (!db) {
    return [];
  }

  const rows = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.userId, userId));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    title: row.title,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    isBusy: row.isBusy,
    isRecurring: row.isRecurring,
    inferredActivity: row.inferredActivity ?? undefined,
  }));
}

import { addDays } from "date-fns";
import { and, eq } from "drizzle-orm";
import { google } from "googleapis";
import { getDb } from "@/db";
import { calendarEvents, googleCalendarConnections, users } from "@/db/schema";
import {
  CALENDAR_SYNC_LOOKAHEAD_DAYS,
  CALENDAR_SYNC_LOOKBACK_DAYS,
} from "@/lib/constants";
import { env } from "@/lib/env";
import { decryptSecret, encryptSecret } from "@/lib/security";
import { stableHash } from "@/lib/time";

function getRedirectUri() {
  return (
    env.googleCalendarRedirectUri ?? `${env.appBaseUrl}/api/google/calendar/callback`
  );
}

function getOauthClient() {
  if (!env.googleClientId || !env.googleClientSecret) {
    throw new Error("Google OAuth is not configured");
  }

  return new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    getRedirectUri(),
  );
}

export function getCalendarConnectUrl(userId: string) {
  const oauthClient = getOauthClient();
  return oauthClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
    state: userId,
  });
}

export async function connectGoogleCalendar(userId: string, code: string) {
  const db = getDb();
  if (!db) {
    throw new Error("Database is not configured");
  }

  const oauthClient = getOauthClient();
  const { tokens } = await oauthClient.getToken(code);
  oauthClient.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: oauthClient });
  const calendar = google.calendar({ version: "v3", auth: oauthClient });
  const [googleUser, primaryCalendar] = await Promise.all([
    oauth2.userinfo.get(),
    calendar.calendarList.get({ calendarId: "primary" }),
  ]);

  await db
    .insert(googleCalendarConnections)
    .values({
      id: `gcal-${stableHash(`${userId}:${googleUser.data.id}`)}`,
      userId,
      googleAccountId: googleUser.data.id ?? userId,
      primaryCalendarId: primaryCalendar.data.id ?? "primary",
      accessTokenEncrypted: encryptSecret(tokens.access_token ?? ""),
      refreshTokenEncrypted: tokens.refresh_token
        ? encryptSecret(tokens.refresh_token)
        : null,
      tokenType: tokens.token_type ?? null,
      scope: tokens.scope ?? null,
      accessTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: googleCalendarConnections.userId,
      set: {
        googleAccountId: googleUser.data.id ?? userId,
        primaryCalendarId: primaryCalendar.data.id ?? "primary",
        accessTokenEncrypted: encryptSecret(tokens.access_token ?? ""),
        refreshTokenEncrypted: tokens.refresh_token
          ? encryptSecret(tokens.refresh_token)
          : googleCalendarConnections.refreshTokenEncrypted,
        tokenType: tokens.token_type ?? null,
        scope: tokens.scope ?? null,
        accessTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        updatedAt: new Date(),
      },
    });

  await db
    .update(users)
    .set({
      calendarConnected: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  await syncGoogleCalendar(userId);
}

async function getCalendarAuthClient(userId: string) {
  const db = getDb();
  if (!db) {
    throw new Error("Database is not configured");
  }

  const [connection] = await db
    .select()
    .from(googleCalendarConnections)
    .where(eq(googleCalendarConnections.userId, userId))
    .limit(1);

  if (!connection) {
    throw new Error("Google Calendar is not connected");
  }

  const oauthClient = getOauthClient();
  oauthClient.setCredentials({
    access_token: decryptSecret(connection.accessTokenEncrypted) ?? undefined,
    refresh_token: decryptSecret(connection.refreshTokenEncrypted) ?? undefined,
    expiry_date: connection.accessTokenExpiresAt?.getTime(),
  });

  return { oauthClient, connection };
}

export async function syncGoogleCalendar(userId: string) {
  const db = getDb();
  if (!db) {
    throw new Error("Database is not configured");
  }

  const { oauthClient, connection } = await getCalendarAuthClient(userId);
  const calendar = google.calendar({ version: "v3", auth: oauthClient });
  const now = new Date();
  const timeMin = addDays(now, -CALENDAR_SYNC_LOOKBACK_DAYS).toISOString();
  const timeMax = addDays(now, CALENDAR_SYNC_LOOKAHEAD_DAYS).toISOString();

  const response = await calendar.events.list({
    calendarId: connection.primaryCalendarId,
    singleEvents: true,
    orderBy: "startTime",
    timeMin,
    timeMax,
    maxResults: 500,
  });

  const items = (response.data.items ?? []).filter(
    (event) => event.status !== "cancelled" && (event.start?.dateTime || event.start?.date),
  );

  await db.delete(calendarEvents).where(eq(calendarEvents.userId, userId));

  if (items.length > 0) {
    await db.insert(calendarEvents).values(
      items.map((event) => {
        const startsAt = new Date(event.start?.dateTime ?? `${event.start?.date}T00:00:00.000Z`);
        const endsAt = new Date(event.end?.dateTime ?? `${event.end?.date}T23:59:59.999Z`);
        return {
          id: `cal-${stableHash(`${userId}:${event.id}`)}`,
          userId,
          googleEventId: event.id ?? stableHash(`${startsAt.toISOString()}:${event.summary}`),
          title: event.summary ?? "Untitled event",
          startsAt,
          endsAt,
          isBusy: event.transparency !== "transparent",
          isRecurring: Boolean(event.recurringEventId),
          recurrenceJson: event.recurrence ?? null,
          syncUpdatedAt: new Date(),
        };
      }),
    );
  }

  await db
    .update(googleCalendarConnections)
    .set({
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(googleCalendarConnections.userId, userId)));

  return items.length;
}

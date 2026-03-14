import { google } from "googleapis";
import { prisma } from "./prisma";
import {
  GOOGLE_CALENDAR_EVENTS_SCOPE,
  GOOGLE_CALENDAR_READ_SCOPE,
} from "./google-scopes";

export class GoogleCalendarScopeError extends Error {
  constructor(
    public readonly missingScopes: string[],
    public readonly grantedScopes: string[]
  ) {
    super("Google Calendar token is missing required scopes");
    this.name = "GoogleCalendarScopeError";
  }
}

function isInsufficientScopeError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const maybeError = error as {
    code?: number;
    status?: number;
    message?: string;
    response?: { data?: { error?: { message?: string } } };
  };

  const message =
    maybeError.message ??
    maybeError.response?.data?.error?.message ??
    "";

  return (
    (maybeError.code === 403 || maybeError.status === 403) &&
    /insufficient authentication scopes/i.test(message)
  );
}

function parseScopeList(scope: string | null | undefined) {
  return new Set(
    (scope ?? "")
      .split(/\s+/)
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

export async function getCalendarClient(userId: string, requiredScopes: string[] = []) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { access_token: true, refresh_token: true, scope: true },
  });

  if (!account?.access_token) {
    throw new Error("No Google access token for user");
  }

  const grantedScopes = parseScopeList(account.scope);
  const missingScopes = requiredScopes.filter((scope) => !grantedScopes.has(scope));
  if (missingScopes.length > 0) {
    throw new GoogleCalendarScopeError(missingScopes, [...grantedScopes]);
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? undefined,
  });

  // Auto-refresh handler — persist new token
  oauth2Client.on("tokens", async (tokens) => {
    const update: Record<string, string> = {};
    if (tokens.access_token) update.access_token = tokens.access_token;
    if (tokens.refresh_token) update.refresh_token = tokens.refresh_token;
    if (Object.keys(update).length) {
      await prisma.account.updateMany({
        where: { userId, provider: "google" },
        data: update,
      });
    }
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function fetchCalendarEvents(userId: string) {
  const calendar = await getCalendarClient(userId, [GOOGLE_CALENDAR_READ_SCOPE]);

  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  try {
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: twoWeeksLater.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 200,
    });

    return response.data.items ?? [];
  } catch (error) {
    if (isInsufficientScopeError(error)) {
      throw new GoogleCalendarScopeError([GOOGLE_CALENDAR_READ_SCOPE], []);
    }
    throw error;
  }
}

export async function createCalendarEvent(
  userId: string,
  event: {
    title: string;
    startTime: Date;
    durationMinutes: number;
    location?: string | null;
  }
) {
  const calendar = await getCalendarClient(userId, [GOOGLE_CALENDAR_EVENTS_SCOPE]);

  const endTime = new Date(event.startTime.getTime() + event.durationMinutes * 60 * 1000);

  try {
    const result = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: event.title,
        location: event.location ?? undefined,
        start: { dateTime: event.startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
      },
    });

    return result.data;
  } catch (error) {
    if (isInsufficientScopeError(error)) {
      throw new GoogleCalendarScopeError([GOOGLE_CALENDAR_EVENTS_SCOPE], []);
    }
    throw error;
  }
}

export async function deleteCalendarEvent(userId: string, eventId: string) {
  const calendar = await getCalendarClient(userId, [GOOGLE_CALENDAR_EVENTS_SCOPE]);
  try {
    await calendar.events.delete({ calendarId: "primary", eventId });
  } catch (error) {
    if (isInsufficientScopeError(error)) {
      throw new GoogleCalendarScopeError([GOOGLE_CALENDAR_EVENTS_SCOPE], []);
    }
    throw error;
  }
}

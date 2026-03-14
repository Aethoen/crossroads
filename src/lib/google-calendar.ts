import { google } from "googleapis";
import { prisma } from "./prisma";

export async function getCalendarClient(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { access_token: true, refresh_token: true },
  });

  if (!account?.access_token) {
    throw new Error("No Google access token for user");
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
  const calendar = await getCalendarClient(userId);

  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: twoWeeksLater.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 200,
  });

  return response.data.items ?? [];
}

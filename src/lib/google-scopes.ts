export const GOOGLE_CALENDAR_READ_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly";
export const GOOGLE_CALENDAR_EVENTS_SCOPE =
  "https://www.googleapis.com/auth/calendar.events";

export const GOOGLE_AUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  GOOGLE_CALENDAR_READ_SCOPE,
  GOOGLE_CALENDAR_EVENTS_SCOPE,
].join(" ");

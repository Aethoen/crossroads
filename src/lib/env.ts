export const env = {
  authSecret:
    process.env.BETTER_AUTH_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET,
  appBaseUrl:
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  googleClientId: process.env.AUTH_GOOGLE_ID,
  googleClientSecret: process.env.AUTH_GOOGLE_SECRET,
  googleCalendarRedirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI,
  databaseUrl: process.env.DATABASE_URL,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
};

export const runtimeFlags = {
  hasBetterAuth: Boolean(
    env.authSecret && env.googleClientId && env.googleClientSecret && env.databaseUrl,
  ),
  authEnabled: Boolean(
    env.authSecret && env.googleClientId && env.googleClientSecret && env.databaseUrl,
  ),
  hasGoogleAuth: Boolean(env.googleClientId && env.googleClientSecret),
  hasDatabase: Boolean(env.databaseUrl),
  hasClaude: Boolean(env.anthropicApiKey),
  hasPlaces: Boolean(env.googleMapsApiKey),
};

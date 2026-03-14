import { headers } from "next/headers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies, toNextJsHandler } from "better-auth/next-js";
import * as schema from "@/db/schema";
import { getDb } from "@/db";
import { env, runtimeFlags } from "@/lib/env";

const db = getDb();

export const auth =
  runtimeFlags.hasBetterAuth && db
    ? betterAuth({
        database: drizzleAdapter(db, {
          provider: "pg",
          schema,
          usePlural: true,
        }),
        secret: env.authSecret,
        baseURL: env.appBaseUrl,
        trustedOrigins: [env.appBaseUrl],
        socialProviders: {
          google: {
            clientId: env.googleClientId!,
            clientSecret: env.googleClientSecret!,
            scopes: ["openid", "email", "profile"],
            prompt: "select_account",
          },
        },
        user: {
          additionalFields: {
            timezone: {
              type: "string",
              required: false,
              defaultValue: "America/New_York",
            },
            calendarConnected: {
              type: "boolean",
              required: false,
              defaultValue: false,
              input: false,
            },
            locationMode: {
              type: "string",
              required: false,
              defaultValue: "disabled",
              input: false,
            },
            onboardingCompletedAt: {
              type: "date",
              required: false,
              input: false,
            },
          },
        },
        emailAndPassword: {
          enabled: false,
        },
        plugins: [nextCookies()],
      })
    : null;

export const authHandler = auth
  ? toNextJsHandler(auth)
  : {
      GET: async () => new Response("Better Auth is not configured", { status: 404 }),
      POST: async () => new Response("Better Auth is not configured", { status: 404 }),
      PATCH: async () => new Response("Better Auth is not configured", { status: 404 }),
      PUT: async () => new Response("Better Auth is not configured", { status: 404 }),
      DELETE: async () => new Response("Better Auth is not configured", { status: 404 }),
    };

export async function getAuthSession() {
  if (!auth) {
    return null;
  }

  const requestHeaders = await headers();
  return auth.api.getSession({
    headers: requestHeaders,
  });
}

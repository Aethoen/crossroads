"use client";

import { createAuthClient } from "better-auth/react";

function getAuthClientBaseUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;

  if (configuredUrl) {
    return `${configuredUrl.replace(/\/$/, "")}/api/auth`;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/auth`;
  }

  return "http://localhost:3000/api/auth";
}

export const authClient = createAuthClient({
  baseURL: getAuthClientBaseUrl(),
});

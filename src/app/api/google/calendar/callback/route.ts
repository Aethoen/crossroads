import { NextResponse } from "next/server";
import { connectGoogleCalendar } from "@/lib/google-calendar";
import { env } from "@/lib/env";
import { resolveViewerContext } from "@/lib/viewer";

export async function GET(request: Request) {
  const viewer = await resolveViewerContext();
  if (viewer.mode !== "auth") {
    return NextResponse.redirect(`${env.appBaseUrl}/login?calendar=unauthorized`);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || state !== viewer.userId) {
    return NextResponse.redirect(`${env.appBaseUrl}/onboarding?calendar=invalid`);
  }

  try {
    await connectGoogleCalendar(viewer.userId, code);
    return NextResponse.redirect(`${env.appBaseUrl}/onboarding?calendar=connected`);
  } catch {
    return NextResponse.redirect(`${env.appBaseUrl}/onboarding?calendar=error`);
  }
}

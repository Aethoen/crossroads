import { NextResponse } from "next/server";
import { syncGoogleCalendar } from "@/lib/google-calendar";
import { resolveViewerContext } from "@/lib/viewer";

export async function POST() {
  const viewer = await resolveViewerContext();
  if (viewer.mode !== "auth") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await syncGoogleCalendar(viewer.userId);
  return NextResponse.json({ syncedEvents: count });
}

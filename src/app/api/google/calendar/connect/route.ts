import { NextResponse } from "next/server";
import { getCalendarConnectUrl } from "@/lib/google-calendar";
import { resolveViewerContext } from "@/lib/viewer";

export async function GET() {
  const viewer = await resolveViewerContext();
  if (viewer.mode !== "auth") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(getCalendarConnectUrl(viewer.userId));
}

import { NextResponse } from "next/server";

import { confirmSuggestion } from "@/lib/matching";
import { runForViewer } from "@/lib/viewer";

interface RouteContext {
  params: Promise<{ suggestionId: string }>;
}

export async function POST(_: Request, context: RouteContext) {
  const { suggestionId } = await context.params;
  const meetup = await runForViewer(async (viewer) =>
    confirmSuggestion(viewer.mode === "auth" ? viewer.userId : "user-maya", suggestionId),
  );
  return NextResponse.json({ meetup });
}

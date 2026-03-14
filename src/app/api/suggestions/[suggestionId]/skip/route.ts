import { NextResponse } from "next/server";

import { skipSuggestion } from "@/lib/matching";
import { runForViewer } from "@/lib/viewer";

interface RouteContext {
  params: Promise<{ suggestionId: string }>;
}

export async function POST(_: Request, context: RouteContext) {
  const { suggestionId } = await context.params;
  await runForViewer(async (viewer) => {
    skipSuggestion(viewer.mode === "auth" ? viewer.userId : "user-maya", suggestionId);
    return null;
  });
  return NextResponse.json({ ok: true });
}

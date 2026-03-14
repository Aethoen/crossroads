import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCandidateClusters } from "@/lib/matching";
import { generateSuggestions } from "@/lib/claude";

const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

async function withProfiles(suggestions: { participantIds: string[]; [key: string]: unknown }[]) {
  const ids = [...new Set(suggestions.flatMap((s) => s.participantIds))];
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, email: true, image: true, calendarConnected: true, locationSharingEnabled: true },
  });
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));
  return suggestions.map((s) => ({
    ...s,
    participantProfiles: s.participantIds.map((id) => byId[id]).filter(Boolean),
  }));
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const userSettings = await prisma.user.findUnique({
    where: { id: userId },
    select: { suggestionRangeDays: true },
  });
  const rangeDays = userSettings?.suggestionRangeDays ?? 1;

  // Stale check: return cached pending suggestions if < 4h old
  const cutoff = new Date(Date.now() - CACHE_TTL_MS);
  const cached = await prisma.suggestion.findMany({
    where: {
      forUserId: userId,
      status: "PENDING",
      createdAt: { gte: cutoff },
    },
    orderBy: { confidence: "desc" },
  });

  if (cached.length > 0) {
    return NextResponse.json({ suggestions: await withProfiles(cached), cached: true });
  }

  // Run full pipeline
  try {
    const clusters = await buildCandidateClusters(userId, rangeDays);

    if (clusters.length === 0) {
      return NextResponse.json({ suggestions: [], cached: false });
    }

    const rawSuggestions = await generateSuggestions(clusters, userId);

    // Enforce: at most 1 GYM suggestion per calendar day
    const gymDays = new Set<string>();
    const aiSuggestions = rawSuggestions.filter((s) => {
      if (s.activity !== "GYM") return true;
      const day = new Date(s.start).toISOString().slice(0, 10);
      if (gymDays.has(day)) return false;
      gymDays.add(day);
      return true;
    });

    // Persist suggestions
    const created = await prisma.$transaction(
      aiSuggestions.map((s) =>
        prisma.suggestion.create({
          data: {
            forUserId: userId,
            activity: s.activity,
            participantIds: s.participants,
            startTime: new Date(s.start),
            durationMinutes: s.duration_minutes,
            location: s.location || null,
            reason: s.reason,
            confidence: s.confidence,
          },
        })
      )
    );

    return NextResponse.json({ suggestions: await withProfiles(created), cached: false });
  } catch (error) {
    console.error("Suggestions pipeline error:", error);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}

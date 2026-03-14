import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCandidateClusters } from "@/lib/matching";
import { generateSuggestions } from "@/lib/claude";

const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

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
    return NextResponse.json({ suggestions: cached, cached: true });
  }

  // Run full pipeline
  try {
    const clusters = await buildCandidateClusters(userId);

    if (clusters.length === 0) {
      return NextResponse.json({ suggestions: [], cached: false });
    }

    const aiSuggestions = await generateSuggestions(clusters, userId);

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

    return NextResponse.json({ suggestions: created, cached: false });
  } catch (error) {
    console.error("Suggestions pipeline error:", error);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}

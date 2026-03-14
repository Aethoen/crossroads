import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

import { DEFAULT_MODEL, MAX_SUGGESTIONS } from "@/lib/constants";
import { stableHash } from "@/lib/time";
import type { AppUser, CandidateCluster, MeetupSuggestion, MemoryCard } from "@/lib/types";

const suggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      candidateId: z.string(),
      reason: z.string().min(12),
      confidence: z.number().min(0).max(1),
      locationName: z.string().min(2),
    }),
  ),
});

interface GenerateInput {
  userId: string;
  candidates: CandidateCluster[];
  memoryCards: MemoryCard[];
  users: AppUser[];
}

function resolveApiKey() {
  return process.env.ANTHROPIC_API_KEY ?? process.env.CLAUDE_API_KEY;
}

export async function generateStructuredSuggestions({
  userId,
  candidates,
  memoryCards,
  users,
}: GenerateInput): Promise<MeetupSuggestion[]> {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new Error("Missing Claude API key");
  }

  const relevantCandidates = candidates.slice(0, MAX_SUGGESTIONS);
  const relevantUserIds = Array.from(
    new Set(relevantCandidates.flatMap((candidate) => candidate.participantIds)),
  );
  const relevantMemories = memoryCards.filter((card) =>
    (card.participantIds ?? []).some((participantId) => relevantUserIds.includes(participantId)),
  );

  const result = await generateObject({
    model: anthropic(DEFAULT_MODEL),
    schema: suggestionSchema,
    system:
      "You are an AI meetup planner. Choose only from the provided candidate IDs. Never invent people, times, or places.",
    prompt: JSON.stringify(
      {
        currentUserId: userId,
        users: users
          .filter((user) => relevantUserIds.includes(user.id))
          .map((user) => ({ id: user.id, name: user.name, preferences: user.activityPreferences })),
        candidates: relevantCandidates.map((candidate) => ({
          id: candidate.id,
          activity: candidate.activity,
          participants: candidate.participantIds,
          startAt: candidate.startAt ?? candidate.start,
          durationMinutes: candidate.durationMinutes,
          overlapMinutes: candidate.overlapMinutes,
          proximityKm: candidate.proximityKm,
          venueOptions: (candidate.venueOptions ?? [candidate.location]).map((venue) => venue.name),
          score: candidate.score,
          reasonSignals: candidate.reasonSignals,
        })),
        memoryCards: relevantMemories.map((memory) => ({
          kind: memory.kind,
          activity: memory.activity,
          text: memory.text,
          participants: memory.participantIds,
        })),
      },
      null,
      2,
    ),
  });

  const suggestions: MeetupSuggestion[] = [];
  for (const item of result.object.suggestions) {
    const candidate = relevantCandidates.find((entry) => entry.id === item.candidateId);
    if (!candidate) {
      continue;
    }
    const venueOptions = candidate.venueOptions ?? [candidate.location];
    const venue =
      venueOptions.find((option) => option.name === item.locationName) ??
      venueOptions[0];

    suggestions.push({
      id: `sug-${stableHash(`${candidate.id}:${userId}:claude`)}`,
      userId,
      participantIds: candidate.participantIds,
      groupId: candidate.groupId,
      activity: candidate.activity,
      start: candidate.start,
      startAt: candidate.startAt,
      durationMinutes: candidate.durationMinutes,
      location: venue ?? candidate.location,
      locationName: venue?.name ?? item.locationName,
      locationLat: venue?.latitude,
      locationLng: venue?.longitude,
      reason: item.reason,
      confidence: Number(item.confidence.toFixed(2)),
      score: candidate.score,
      status: "active" as const,
      source: "claude" as const,
      generatedBy: "claude" as const,
    });
  }

  return suggestions;
}

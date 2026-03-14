import Anthropic from "@anthropic-ai/sdk";
import { ActivityType } from "@prisma/client";
import { CandidateCluster, SuggestionObject } from "@/types";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a social coordination assistant. Given pre-computed clusters of friends with overlapping availability, generate meetup suggestions.

Output ONLY a valid JSON array. No prose, no markdown fences, no explanation.

Each suggestion object must match this exact schema:
{
  "activity": "GYM" | "EAT" | "STUDY" | "HANGOUT" | "COFFEE",
  "participants": ["userId1", "userId2"],
  "start": "ISO 8601 datetime string",
  "duration_minutes": number,
  "location": "location description or empty string",
  "reason": "one sentence explaining why this suggestion fits these people",
  "confidence": number between 0.0 and 1.0
}

Rules:
- Generate 3–6 suggestions sorted by confidence descending
- Only suggest activities that overlap between participants' preferences, or HANGOUT as a universal fallback
- Pick start times within the provided free window
- duration_minutes: GYM=60, EAT=60, COFFEE=45, STUDY=90, HANGOUT=90
- For the "location" field: if "Calendar location anchors" are provided, prefer a venue near those locations (e.g., nearby coffee shop, gym in that area); otherwise use current location proximity or leave empty
- Reason must be 1 short sentence, max 12 words, casual and direct (e.g. "Same area, both prefer coffee" or "Shared gym preference, nearby")
- Focus on WHY these people should meet: shared preferences, proximity, group context — NOT when
- Do NOT mention time of day, meal names (lunch/dinner/breakfast), or time references
- No filler words like "offers a", "given the", "low-commitment", "relaxed way to connect" — just state the facts
- Higher confidence when: both users share the activity preference, proximity is same_area or nearby, window is long enough
- Lower confidence when: only one user prefers the activity, proximity is far or unknown`;

function buildUserMessage(
  clusters: CandidateCluster[],
  currentDate: string
): string {
  const lines: string[] = [
    `Current date/time: ${currentDate}`,
    "",
    "Candidate clusters:",
    "",
  ];

  for (let i = 0; i < clusters.length; i++) {
    const c = clusters[i];
    const names = c.participants.map((p) => p.name ?? p.email ?? p.id);
    const ids = c.participants.map((p) => p.id);

    lines.push(`Cluster ${i + 1}:`);
    lines.push(`  Participants: ${names.join(", ")}`);
    lines.push(`  UserIDs: ${ids.join(", ")}`);
    lines.push(
      `  Free window: ${c.sharedWindow.startTime.toISOString()} to ${c.sharedWindow.endTime.toISOString()} (${c.sharedWindow.durationMinutes} min)`
    );
    lines.push(`  Proximity: ${c.proximityLabel}`);
    lines.push(
      `  Shared activity preferences: ${c.activityOverlap.join(", ") || "none"}`
    );
    if (c.calendarAnchorLocations && c.calendarAnchorLocations.length > 0) {
      lines.push(`  Calendar location anchors: ${c.calendarAnchorLocations.join(" / ")}`);
    }
    if (c.groupContext) {
      lines.push(`  Group context: ${c.groupContext}`);
    }
    lines.push(`  Score: ${c.score.toFixed(2)}`);
    lines.push("");
  }

  return lines.join("\n");
}

function parseClaudeResponse(text: string): SuggestionObject[] {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "");
  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed)) {
    throw new Error("Expected JSON array from Claude");
  }

  return parsed.map((item: Record<string, unknown>) => ({
    activity: item.activity as ActivityType,
    participants: item.participants as string[],
    start: item.start as string,
    duration_minutes: item.duration_minutes as number,
    location: item.location as string,
    reason: item.reason as string,
    confidence: item.confidence as number,
  }));
}

function fallbackSuggestions(clusters: CandidateCluster[]): SuggestionObject[] {
  return clusters.slice(0, 3).map((c) => ({
    activity: c.activityOverlap[0] ?? ("HANGOUT" as ActivityType),
    participants: c.participants.map((p) => p.id),
    start: c.sharedWindow.startTime.toISOString(),
    duration_minutes: 60,
    location: "",
    reason: `${c.participants.map((p) => p.name ?? "Friend").join(" and ")} are both free and ${c.proximityLabel === "unknown" ? "could meet up" : `are ${c.proximityLabel}`}.`,
    confidence: 0.4,
  }));
}

export async function generateSuggestions(
  clusters: CandidateCluster[],
  forUserId: string
): Promise<SuggestionObject[]> {
  if (clusters.length === 0) return [];

  const currentDate = new Date().toISOString();

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserMessage(clusters, currentDate),
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected content type from Claude");
    }

    const suggestions = parseClaudeResponse(content.text);

    // Filter: only include suggestions for the requesting user
    return suggestions.filter((s) => s.participants.includes(forUserId));
  } catch (err) {
    console.error("Claude API error, using fallback:", err);
    return fallbackSuggestions(clusters);
  }
}

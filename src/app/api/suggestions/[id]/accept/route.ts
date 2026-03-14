import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/google-calendar";
import { ActivityType } from "@prisma/client";

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  GYM: "Gym",
  EAT: "Eat",
  STUDY: "Study",
  HANGOUT: "Hang out",
  COFFEE: "Coffee",
};

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const suggestion = await prisma.suggestion.findUnique({
    where: { id },
    include: { meetup: true },
  });

  if (!suggestion || suggestion.forUserId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (suggestion.status === "CONFIRMED") {
    return NextResponse.json({ error: "Already confirmed" }, { status: 409 });
  }

  // Fetch participant names for the title
  const participants = await prisma.user.findMany({
    where: { id: { in: suggestion.participantIds } },
    select: { id: true, name: true, email: true },
  });

  const otherNames = participants
    .filter((p) => p.id !== session.user.id)
    .map((p) => p.name ?? p.email ?? "Friend");

  const title = `${ACTIVITY_LABELS[suggestion.activity]} with ${otherNames.join(", ")}`;

  // Confirm suggestion + create Meetup in a transaction
  const [updatedSuggestion, meetup] = await prisma.$transaction(async (tx) => {
    const updated = await tx.suggestion.update({
      where: { id },
      data: { status: "CONFIRMED" },
    });

    const created = await tx.meetup.create({
      data: {
        suggestionId: id,
        title,
        activity: suggestion.activity,
        startTime: suggestion.startTime,
        durationMinutes: suggestion.durationMinutes,
        location: suggestion.location,
        participants: {
          create: suggestion.participantIds.map((userId) => ({ userId })),
        },
      },
    });

    return [updated, created];
  });

  // Create Google Calendar event (best-effort — don't fail the accept if this errors)
  let calendarEventId: string | null = null;
  try {
    const calEvent = await createCalendarEvent(session.user.id, {
      title,
      startTime: suggestion.startTime,
      durationMinutes: suggestion.durationMinutes,
      location: suggestion.location,
    });
    calendarEventId = calEvent.id ?? null;
  } catch (err) {
    console.error("Failed to create calendar event:", err);
  }

  return NextResponse.json({ suggestion: updatedSuggestion, meetup, calendarEventId });
}

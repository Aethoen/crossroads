import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/google-calendar";

const ACTIVITY_LABELS: Record<string, string> = {
  GYM: "Gym session",
  EAT: "Meal out",
  STUDY: "Study session",
  HANGOUT: "Hangout",
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
  const suggestion = await prisma.suggestion.findUnique({ where: { id } });

  if (!suggestion || suggestion.forUserId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (suggestion.status !== "PENDING") {
    return NextResponse.json({ error: "Already processed" }, { status: 409 });
  }

  const title = ACTIVITY_LABELS[suggestion.activity] ?? suggestion.activity;
  const userId = session.user.id;

  const meetup = await prisma.$transaction(async (tx) => {
    await tx.suggestion.update({ where: { id }, data: { status: "CONFIRMED" } });

    return tx.meetup.create({
      data: {
        suggestionId: id,
        title,
        activity: suggestion.activity,
        startTime: suggestion.startTime,
        durationMinutes: suggestion.durationMinutes,
        location: suggestion.location,
        status: "PENDING",
        participants: {
          create: suggestion.participantIds.map((uid) => ({
            userId: uid,
            status: uid === userId ? "ACCEPTED" : "PENDING",
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true, calendarConnected: true, locationSharingEnabled: true } },
          },
        },
      },
    });
  });

  // If initiator is the only participant, auto-confirm
  if (suggestion.participantIds.length === 1) {
    await prisma.meetup.update({ where: { id: meetup.id }, data: { status: "CONFIRMED" } });
  }

  // Create calendar event for the initiator
  let calendarEventId: string | null = null;
  let calendarError: string | null = null;
  try {
    const calEvent = await createCalendarEvent(userId, {
      title,
      startTime: suggestion.startTime,
      durationMinutes: suggestion.durationMinutes,
      location: suggestion.location,
    });
    calendarEventId = calEvent.id ?? null;
  } catch (err) {
    calendarError = err instanceof Error ? err.message : String(err);
    console.error("Failed to create calendar event:", err);
  }

  if (calendarEventId) {
    await prisma.meetupParticipant.updateMany({
      where: { meetupId: meetup.id, userId },
      data: { googleCalendarEventId: calendarEventId },
    });
  }

  return NextResponse.json({ ...meetup, calendarEventId, calendarError }, { status: 201 });
}

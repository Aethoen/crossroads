import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteCalendarEvent } from "@/lib/google-calendar";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const participant = await prisma.meetupParticipant.findUnique({
    where: { meetupId_userId: { meetupId: id, userId: session.user.id } },
    select: { id: true, googleCalendarEventId: true },
  });

  if (!participant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.meetupParticipant.delete({ where: { id: participant.id } });

  const remaining = await prisma.meetupParticipant.count({ where: { meetupId: id } });

  if (remaining === 0) {
    // Reset suggestion so it can be re-evaluated, then delete meetup via cascade
    const meetup = await prisma.meetup.findUnique({
      where: { id },
      select: { suggestionId: true },
    });
    if (meetup) {
      await prisma.suggestion.update({
        where: { id: meetup.suggestionId },
        data: { status: "PENDING" },
      });
    }
    await prisma.meetup.delete({ where: { id } });
  }

  // Delete calendar event best-effort
  if (participant.googleCalendarEventId) {
    try {
      await deleteCalendarEvent(session.user.id, participant.googleCalendarEventId);
    } catch (err) {
      console.error("Failed to delete calendar event:", err);
    }
  }

  return NextResponse.json({ success: true });
}

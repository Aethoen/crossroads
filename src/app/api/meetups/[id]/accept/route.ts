import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/google-calendar";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  const participant = await prisma.meetupParticipant.findUnique({
    where: { meetupId_userId: { meetupId: id, userId } },
  });

  if (!participant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (participant.status !== "PENDING") {
    return NextResponse.json({ error: "Already responded" }, { status: 409 });
  }

  await prisma.meetupParticipant.update({
    where: { id: participant.id },
    data: { status: "ACCEPTED" },
  });

  // Check if all participants have accepted → confirm meetup
  const pending = await prisma.meetupParticipant.count({
    where: { meetupId: id, status: "PENDING" },
  });

  if (pending === 0) {
    await prisma.meetup.update({ where: { id }, data: { status: "CONFIRMED" } });
  }

  // Create calendar event for this participant
  const meetup = await prisma.meetup.findUnique({ where: { id } });
  if (meetup) {
    try {
      const calEvent = await createCalendarEvent(userId, {
        title: meetup.title,
        startTime: meetup.startTime,
        durationMinutes: meetup.durationMinutes,
        location: meetup.location,
      });
      if (calEvent.id) {
        await prisma.meetupParticipant.update({
          where: { id: participant.id },
          data: { googleCalendarEventId: calEvent.id },
        });
      }
    } catch (err) {
      console.error("Failed to create calendar event:", err);
    }
  }

  return NextResponse.json({ success: true });
}

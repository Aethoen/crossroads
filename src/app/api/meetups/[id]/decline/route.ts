import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteCalendarEvent } from "@/lib/google-calendar";

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

  await prisma.meetupParticipant.update({
    where: { id: participant.id },
    data: { status: "DECLINED" },
  });

  // Check active participants (PENDING or ACCEPTED)
  const active = await prisma.meetupParticipant.count({
    where: { meetupId: id, status: { in: ["PENDING", "ACCEPTED"] } },
  });

  if (active < 2) {
    // Cancel meetup — clean up calendar events for accepted participants
    const accepted = await prisma.meetupParticipant.findMany({
      where: { meetupId: id, status: "ACCEPTED" },
      select: { userId: true, googleCalendarEventId: true },
    });

    await prisma.meetup.update({ where: { id }, data: { status: "CANCELLED" } });

    // Best-effort calendar cleanup
    for (const p of accepted) {
      if (p.googleCalendarEventId) {
        try {
          await deleteCalendarEvent(p.userId, p.googleCalendarEventId);
        } catch (err) {
          console.error("Failed to delete calendar event:", err);
        }
      }
    }
  }

  return NextResponse.json({ success: true });
}

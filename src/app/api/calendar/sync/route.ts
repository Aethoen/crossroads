import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchCalendarEvents } from "@/lib/google-calendar";
import { computeAndStoreAvailability } from "@/lib/availability";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const events = await fetchCalendarEvents(userId);

    // Upsert calendar events
    for (const event of events) {
      if (!event.id || !event.start || !event.end) continue;

      const startTime = event.start.dateTime
        ? new Date(event.start.dateTime)
        : new Date(event.start.date + "T00:00:00");
      const endTime = event.end.dateTime
        ? new Date(event.end.dateTime)
        : new Date(event.end.date + "T23:59:59");

      await prisma.calendarEvent.upsert({
        where: { userId_googleId: { userId, googleId: event.id } },
        update: {
          title: event.summary ?? "Busy",
          startTime,
          endTime,
        },
        create: {
          userId,
          googleId: event.id,
          title: event.summary ?? "Busy",
          startTime,
          endTime,
        },
      });
    }

    // Compute and store availability blocks
    const freeBlocks = await computeAndStoreAvailability(userId);

    // Mark calendar as connected
    await prisma.user.update({
      where: { id: userId },
      data: { calendarConnected: true },
    });

    return NextResponse.json({
      eventsImported: events.length,
      freeBlocks: freeBlocks.length,
    });
  } catch (error) {
    console.error("Calendar sync error:", error);
    return NextResponse.json({ error: "Calendar sync failed" }, { status: 500 });
  }
}

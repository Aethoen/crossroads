import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const meetups = await prisma.meetup.findMany({
    where: {
      status: { not: "CANCELLED" },
      participants: { some: { userId, status: { not: "DECLINED" } } },
    },
    include: {
      participants: {
        where: { status: { not: "DECLINED" } },
        include: {
          user: { select: { id: true, name: true, email: true, image: true, calendarConnected: true, locationSharingEnabled: true } },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  const shaped = meetups.map((m) => {
    const myParticipant = m.participants.find((p) => p.userId === userId);
    return {
      id: m.id,
      title: m.title,
      activity: m.activity,
      startTime: m.startTime,
      durationMinutes: m.durationMinutes,
      location: m.location,
      status: m.status,
      myStatus: myParticipant?.status ?? "PENDING",
      participants: m.participants.map((p) => p.user),
    };
  });

  return NextResponse.json(shaped);
}

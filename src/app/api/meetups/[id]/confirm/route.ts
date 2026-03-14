import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  });

  if (!suggestion || suggestion.forUserId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (suggestion.status !== "PENDING") {
    return NextResponse.json({ error: "Already processed" }, { status: 409 });
  }

  const activityLabels: Record<string, string> = {
    GYM: "Gym session",
    EAT: "Meal out",
    STUDY: "Study session",
    HANGOUT: "Hangout",
    COFFEE: "Coffee",
  };

  const meetup = await prisma.$transaction(async (tx) => {
    await tx.suggestion.update({
      where: { id },
      data: { status: "CONFIRMED" },
    });

    return tx.meetup.create({
      data: {
        suggestionId: id,
        title: activityLabels[suggestion.activity] ?? suggestion.activity,
        activity: suggestion.activity,
        startTime: suggestion.startTime,
        durationMinutes: suggestion.durationMinutes,
        location: suggestion.location,
        participants: {
          create: suggestion.participantIds.map((uid) => ({ userId: uid })),
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

  return NextResponse.json(meetup, { status: 201 });
}

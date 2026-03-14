import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await prisma.activityPreference.findMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json(prefs);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { activities } = await req.json() as { activities: ActivityType[] };

  const allActivities: ActivityType[] = ["GYM", "EAT", "STUDY", "HANGOUT", "COFFEE"];

  await prisma.$transaction([
    prisma.activityPreference.deleteMany({ where: { userId: session.user.id } }),
    prisma.activityPreference.createMany({
      data: allActivities
        .filter((a) => activities.includes(a))
        .map((a) => ({ userId: session.user.id, activity: a, weight: 1.0 })),
    }),
  ]);

  const prefs = await prisma.activityPreference.findMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json(prefs);
}

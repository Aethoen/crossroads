import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GroupType } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true, calendarConnected: true, locationSharingEnabled: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, type } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const group = await prisma.group.create({
    data: {
      name,
      type: (type as GroupType) ?? "SOCIAL",
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true, calendarConnected: true, locationSharingEnabled: true } },
        },
      },
    },
  });

  return NextResponse.json(group, { status: 201 });
}

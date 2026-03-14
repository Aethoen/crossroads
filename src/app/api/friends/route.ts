import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    include: {
      requester: { select: { id: true, name: true, email: true, image: true, calendarConnected: true, locationSharingEnabled: true } },
      addressee: { select: { id: true, name: true, email: true, image: true, calendarConnected: true, locationSharingEnabled: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = friendships.map((f) => ({
    id: f.id,
    status: f.status,
    requesterId: f.requesterId,
    friend: f.requesterId === userId ? f.addressee : f.requester,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const addressee = await prisma.user.findUnique({ where: { email } });
  if (!addressee) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (addressee.id === session.user.id) {
    return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: session.user.id, addresseeId: addressee.id },
        { requesterId: addressee.id, addresseeId: session.user.id },
      ],
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Friend request already exists" }, { status: 409 });
  }

  const friendship = await prisma.friendship.create({
    data: { requesterId: session.user.id, addresseeId: addressee.id },
    include: {
      addressee: { select: { id: true, name: true, email: true, image: true, calendarConnected: true, locationSharingEnabled: true } },
    },
  });

  return NextResponse.json(friendship, { status: 201 });
}

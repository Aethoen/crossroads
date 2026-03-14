import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { latitude, longitude, label } = await req.json();

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const location = await prisma.userLocation.upsert({
    where: { userId: session.user.id },
    update: { latitude, longitude, label },
    create: { userId: session.user.id, latitude, longitude, label },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { locationSharingEnabled: true },
  });

  return NextResponse.json(location);
}

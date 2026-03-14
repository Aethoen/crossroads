import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_RANGES = [1, 3, 7] as const;
type SuggestionRange = (typeof VALID_RANGES)[number];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { suggestionRangeDays: true },
  });

  return NextResponse.json({ suggestionRangeDays: user?.suggestionRangeDays ?? 1 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { suggestionRangeDays } = (await req.json()) as { suggestionRangeDays: number };

  if (!VALID_RANGES.includes(suggestionRangeDays as SuggestionRange)) {
    return NextResponse.json({ error: "Invalid range. Must be 1, 3, or 7." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { suggestionRangeDays },
  });

  return NextResponse.json({ suggestionRangeDays });
}

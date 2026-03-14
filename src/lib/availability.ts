import { prisma } from "./prisma";

const WORK_START_HOUR = 8;
const WORK_END_HOUR = 23;
const MIN_FREE_BLOCK_MINUTES = 30;

interface TimeInterval {
  start: Date;
  end: Date;
}

function subtractIntervals(
  base: TimeInterval[],
  busy: TimeInterval[]
): TimeInterval[] {
  let result = [...base];

  for (const b of busy) {
    const next: TimeInterval[] = [];
    for (const r of result) {
      if (b.end <= r.start || b.start >= r.end) {
        next.push(r);
      } else {
        if (b.start > r.start) next.push({ start: r.start, end: b.start });
        if (b.end < r.end) next.push({ start: b.end, end: r.end });
      }
    }
    result = next;
  }

  return result;
}

function getDaySlots(date: Date): TimeInterval[] {
  const start = new Date(date);
  start.setHours(WORK_START_HOUR, 0, 0, 0);
  const end = new Date(date);
  end.setHours(WORK_END_HOUR, 0, 0, 0);
  return [{ start, end }];
}

export async function computeAndStoreAvailability(userId: string) {
  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const events = await prisma.calendarEvent.findMany({
    where: {
      userId,
      startTime: { gte: now },
      endTime: { lte: in14Days },
    },
    orderBy: { startTime: "asc" },
  });

  // Group busy intervals by day
  const busyByDay = new Map<string, TimeInterval[]>();
  for (const e of events) {
    const dayKey = e.startTime.toISOString().slice(0, 10);
    if (!busyByDay.has(dayKey)) busyByDay.set(dayKey, []);
    busyByDay.get(dayKey)!.push({ start: e.startTime, end: e.endTime });
  }

  const freeBlocks: { startTime: Date; endTime: Date }[] = [];

  // Iterate over next 14 days
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dayKey = d.toISOString().slice(0, 10);

    const daySlots = getDaySlots(d);
    const busy = busyByDay.get(dayKey) ?? [];
    const free = subtractIntervals(daySlots, busy);

    for (const f of free) {
      const durationMs = f.end.getTime() - f.start.getTime();
      if (durationMs >= MIN_FREE_BLOCK_MINUTES * 60 * 1000) {
        freeBlocks.push({ startTime: f.start, endTime: f.end });
      }
    }
  }

  // Replace existing blocks for this user
  await prisma.$transaction([
    prisma.availabilityBlock.deleteMany({ where: { userId } }),
    prisma.availabilityBlock.createMany({
      data: freeBlocks.map((b) => ({ userId, ...b })),
    }),
  ]);

  return freeBlocks;
}

export function intersectIntervals(
  a: { startTime: Date; endTime: Date }[],
  b: { startTime: Date; endTime: Date }[]
): { startTime: Date; endTime: Date; durationMinutes: number }[] {
  const overlaps: { startTime: Date; endTime: Date; durationMinutes: number }[] = [];

  for (const ia of a) {
    for (const ib of b) {
      const start = ia.startTime > ib.startTime ? ia.startTime : ib.startTime;
      const end = ia.endTime < ib.endTime ? ia.endTime : ib.endTime;
      const durationMs = end.getTime() - start.getTime();
      const durationMinutes = Math.floor(durationMs / 60000);
      if (durationMinutes >= MIN_FREE_BLOCK_MINUTES) {
        overlaps.push({ startTime: start, endTime: end, durationMinutes });
      }
    }
  }

  return overlaps;
}

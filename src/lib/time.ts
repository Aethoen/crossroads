import { formatISO, isAfter, max, min } from "date-fns";

export interface TimeRange {
  start: Date;
  end: Date;
}

export function formatUtc(date: Date): string {
  return formatISO(date);
}

export function overlapMinutes(a: TimeRange, b: TimeRange): number {
  const start = max([a.start, b.start]);
  const end = min([a.end, b.end]);
  if (!isAfter(end, start)) {
    return 0;
  }
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

export function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0).toString(16);
}

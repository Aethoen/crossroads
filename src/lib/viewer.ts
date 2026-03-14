import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { users, userLocations, calendarEvents } from "@/db/schema";
import { DEMO_MODE_COOKIE, DEMO_USER_ID } from "@/lib/constants";
import { getAuthSession } from "@/lib/auth";
import { getDemoState, runWithScopedDemoState } from "@/lib/demo-store";
import { runtimeFlags } from "@/lib/env";
import type { CalendarEvent, UserLocation, UserProfile } from "@/lib/types";

export type ViewerContext =
  | { mode: "demo"; userId: string }
  | {
      mode: "auth";
      userId: string;
      user: {
        id: string;
        name: string;
        email: string;
        image?: string | null;
      };
    };

function mapDbCalendarEvent(event: typeof calendarEvents.$inferSelect): CalendarEvent {
  return {
    id: event.id,
    userId: event.userId,
    title: event.title,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    isBusy: event.isBusy,
    isRecurring: event.isRecurring,
    inferredActivity: event.inferredActivity ?? undefined,
  };
}

function mapDbLocation(location: typeof userLocations.$inferSelect): UserLocation {
  return {
    id: location.id,
    userId: location.userId,
    label: location.label,
    latitude: location.latitude,
    longitude: location.longitude,
    source: location.source as "live" | "manual",
    capturedAt: location.capturedAt.toISOString(),
    expiresAt: location.expiresAt.toISOString(),
  };
}

export async function resolveViewerContext(): Promise<ViewerContext> {
  const cookieStore = await cookies();
  if (!runtimeFlags.hasBetterAuth || cookieStore.get(DEMO_MODE_COOKIE)?.value === "1") {
    return { mode: "demo", userId: DEMO_USER_ID };
  }

  const session = await getAuthSession();
  if (!session?.user) {
    return { mode: "demo", userId: DEMO_USER_ID };
  }

  return {
    mode: "auth",
    userId: session.user.id,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
  };
}

export async function syncViewerProfile(context: Extract<ViewerContext, { mode: "auth" }>) {
  const db = getDb();
  if (!db) {
    return null;
  }

  await db
    .insert(users)
    .values({
      id: context.user.id,
      email: context.user.email.toLowerCase(),
      emailVerified: true,
      name: context.user.name,
      image: context.user.image ?? null,
      avatarUrl: context.user.image ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: context.user.email.toLowerCase(),
        emailVerified: true,
        name: context.user.name,
        image: context.user.image ?? null,
        avatarUrl: context.user.image ?? null,
        updatedAt: new Date(),
      },
    });

  const [profile] = await db.select().from(users).where(eq(users.id, context.user.id)).limit(1);
  return profile ?? null;
}

export async function runForViewer<T>(callback: (viewer: ViewerContext) => Promise<T>) {
  const viewer = await resolveViewerContext();

  if (viewer.mode === "demo") {
    return callback(viewer);
  }

  const db = getDb();
  const profile = await syncViewerProfile(viewer);
  const [locations, events] = db
    ? await Promise.all([
        db.select().from(userLocations).where(eq(userLocations.userId, viewer.userId)),
        db.select().from(calendarEvents).where(eq(calendarEvents.userId, viewer.userId)),
      ])
    : [[], []];

  const scopedProfile: Partial<UserProfile> = {
    id: viewer.user.id,
    name: profile?.name ?? viewer.user.name,
    email: profile?.email ?? viewer.user.email,
    avatar: viewer.user.image ?? viewer.user.name,
    avatarUrl: profile?.avatarUrl ?? viewer.user.image ?? undefined,
    calendarConnected: Boolean(profile?.calendarConnected),
    locationMode: (profile?.locationMode as UserProfile["locationMode"]) ?? "disabled",
    locationSharingEnabled: (profile?.locationMode ?? "disabled") !== "disabled",
  };

  return runWithScopedDemoState(
    {
      userId: viewer.user.id,
      profile: scopedProfile,
      calendarEvents: events.map(mapDbCalendarEvent),
      locations: locations.map(mapDbLocation),
    },
    async () => callback(viewer),
  );
}

export function getCurrentDemoState() {
  return getDemoState();
}

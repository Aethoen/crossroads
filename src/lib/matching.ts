import { ActivityType } from "@prisma/client";
import { prisma } from "./prisma";
import { intersectIntervals } from "./availability";
import { CandidateCluster, StudyContext, UserProfile } from "@/types";

const STUDY_KEYWORDS = /\b(assignment|homework|hw|due|exam|quiz|midterm|final|lab|lecture|class|seminar|course|tutorial|recitation|project|study)\b/i;
const COURSE_CODE = /\b[A-Z]{2,5}\s?\d{3,4}\b/;

function isStudyEvent(title: string): boolean {
  return STUDY_KEYWORDS.test(title) || COURSE_CODE.test(title);
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type ProximityLabel = "same_area" | "nearby" | "far" | "unknown";

function proximityLabel(km: number): ProximityLabel {
  if (km < 1) return "same_area";
  if (km < 5) return "nearby";
  return "far";
}

function proximityWeight(label: ProximityLabel): number {
  switch (label) {
    case "same_area": return 3;
    case "nearby": return 2;
    case "far": return 1;
    case "unknown": return 1.5;
  }
}

type CalendarEventWithLocation = {
  startTime: Date;
  endTime: Date;
  location: string | null;
};

function nearestLocationToWindow(
  events: CalendarEventWithLocation[],
  windowStart: Date
): string | null {
  const withLocation = events.filter((e) => e.location);
  if (withLocation.length === 0) return null;
  return withLocation.reduce((best, curr) => {
    const bestDiff = Math.abs(best.endTime.getTime() - windowStart.getTime());
    const currDiff = Math.abs(curr.endTime.getTime() - windowStart.getTime());
    return currDiff < bestDiff ? curr : best;
  }).location;
}

export async function buildCandidateClusters(
  userId: string,
  rangeDays: number = 1
): Promise<CandidateCluster[]> {
  const now = new Date();
  const rangeMs = rangeDays * 24 * 60 * 60 * 1000;
  const in48h = new Date(now.getTime() + rangeMs);
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Load current user data
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      location: true,
      activityPreferences: true,
      availabilityBlocks: {
        where: { startTime: { gte: now }, endTime: { lte: in48h } },
        orderBy: { startTime: "asc" },
      },
      calendarEvents: {
        where: { startTime: { gte: now }, endTime: { lte: in7d } },
      },
    },
  });

  if (!currentUser) throw new Error("User not found");

  const userProfile: UserProfile = {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    image: currentUser.image,
    calendarConnected: currentUser.calendarConnected,
    locationSharingEnabled: currentUser.locationSharingEnabled,
  };

  // Load accepted friends
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    include: {
      requester: {
        include: {
          location: true,
          activityPreferences: true,
          availabilityBlocks: {
            where: { startTime: { gte: now }, endTime: { lte: in48h } },
            orderBy: { startTime: "asc" },
          },
          calendarEvents: {
            where: { startTime: { gte: now }, endTime: { lte: in7d } },
          },
        },
      },
      addressee: {
        include: {
          location: true,
          activityPreferences: true,
          availabilityBlocks: {
            where: { startTime: { gte: now }, endTime: { lte: in48h } },
            orderBy: { startTime: "asc" },
          },
          calendarEvents: {
            where: { startTime: { gte: now }, endTime: { lte: in7d } },
          },
        },
      },
    },
  });

  const friends = friendships.map((f) =>
    f.requesterId === userId ? f.addressee : f.requester
  );

  if (friends.length === 0) return [];

  // Load groups current user is in
  const userGroups = await prisma.group.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      members: { select: { userId: true } },
    },
  });

  const groupContextMap = new Map<string, string>();
  // Map from friendId -> names of shared STUDY groups
  const sharedStudyGroupsMap = new Map<string, string[]>();
  for (const g of userGroups) {
    for (const m of g.members) {
      if (m.userId !== userId) {
        groupContextMap.set(m.userId, `${g.type.toLowerCase()}_group: ${g.name}`);
        if (g.type === "STUDY") {
          const existing = sharedStudyGroupsMap.get(m.userId) ?? [];
          existing.push(g.name);
          sharedStudyGroupsMap.set(m.userId, existing);
        }
      }
    }
  }

  const userStudyEventTitles = currentUser.calendarEvents
    .filter((e) => isStudyEvent(e.title))
    .map((e) => e.title);

  const currentUserActivities = new Set(
    currentUser.activityPreferences.map((p) => p.activity)
  );

  const clusters: CandidateCluster[] = [];

  // Pairwise clusters
  for (const friend of friends) {
    // If friend has no blocks, synthesize default 8am–11pm windows across the matching range
    const friendBlocks =
      friend.availabilityBlocks.length > 0
        ? friend.availabilityBlocks
        : Array.from({ length: rangeDays + 1 }, (_, i) => {
            const d = new Date(now);
            d.setDate(d.getDate() + i);
            const start = new Date(d);
            start.setHours(8, 0, 0, 0);
            const end = new Date(d);
            end.setHours(23, 0, 0, 0);
            return { startTime: start, endTime: end };
          });

    const overlaps = intersectIntervals(currentUser.availabilityBlocks, friendBlocks);

    if (overlaps.length === 0) continue;

    // Pick best overlap window (longest)
    const bestWindow = overlaps.reduce((best, curr) =>
      curr.durationMinutes > best.durationMinutes ? curr : best
    );

    // Proximity
    let proximity: ProximityLabel = "unknown";
    if (currentUser.location && friend.location) {
      const km = haversineKm(
        currentUser.location.latitude,
        currentUser.location.longitude,
        friend.location.latitude,
        friend.location.longitude
      );
      proximity = proximityLabel(km);
    }

    // Activity overlap
    const friendActivities = new Set(
      friend.activityPreferences.map((p) => p.activity)
    );
    const activityOverlap = [...currentUserActivities].filter((a) =>
      friendActivities.has(a)
    ) as ActivityType[];

    const score =
      proximityWeight(proximity) * Math.max(activityOverlap.length, 1);

    // Calendar-based location anchors: nearest event with a location to the free window
    const calendarAnchorLocations: string[] = [];
    const userAnchor = nearestLocationToWindow(
      currentUser.calendarEvents,
      bestWindow.startTime
    );
    const friendAnchor = nearestLocationToWindow(
      friend.calendarEvents,
      bestWindow.startTime
    );
    if (userAnchor) calendarAnchorLocations.push(userAnchor);
    if (friendAnchor && friendAnchor !== userAnchor) calendarAnchorLocations.push(friendAnchor);

    // Study context: shared STUDY groups + overlapping study-relevant calendar events
    const friendStudyEventTitles = friend.calendarEvents
      .filter((e) => isStudyEvent(e.title))
      .map((e) => e.title);
    const sharedStudyTitles = userStudyEventTitles.filter((t) =>
      friendStudyEventTitles.includes(t)
    );
    const allStudyTitles = [...new Set([...userStudyEventTitles, ...friendStudyEventTitles])];
    const sharedGroups = sharedStudyGroupsMap.get(friend.id) ?? [];
    const studyContext: StudyContext | undefined =
      sharedGroups.length > 0 || allStudyTitles.length > 0
        ? { sharedGroups, upcomingStudyEvents: sharedStudyTitles.length > 0 ? sharedStudyTitles : allStudyTitles.slice(0, 3) }
        : undefined;

    const friendProfile: UserProfile = {
      id: friend.id,
      name: friend.name,
      email: friend.email,
      image: friend.image,
      calendarConnected: friend.calendarConnected,
      locationSharingEnabled: friend.locationSharingEnabled,
    };

    clusters.push({
      participants: [userProfile, friendProfile],
      sharedWindow: {
        startTime: bestWindow.startTime,
        endTime: bestWindow.endTime,
        durationMinutes: bestWindow.durationMinutes,
      },
      activityOverlap,
      proximityLabel: proximity,
      score,
      groupContext: groupContextMap.get(friend.id),
      calendarAnchorLocations: calendarAnchorLocations.length > 0 ? calendarAnchorLocations : undefined,
      studyContext,
    });
  }

  // Sort by score desc, return top 10
  return clusters.sort((a, b) => b.score - a.score).slice(0, 10);
}

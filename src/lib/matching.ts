import { ActivityType } from "@prisma/client";
import { prisma } from "./prisma";
import { intersectIntervals } from "./availability";
import { CandidateCluster, UserProfile } from "@/types";

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
  userId: string
): Promise<CandidateCluster[]> {
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

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
        where: {
          startTime: { gte: now },
          endTime: { lte: in48h },
          location: { not: null },
        },
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
            where: {
              startTime: { gte: now },
              endTime: { lte: in48h },
              location: { not: null },
            },
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
            where: {
              startTime: { gte: now },
              endTime: { lte: in48h },
              location: { not: null },
            },
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
  for (const g of userGroups) {
    for (const m of g.members) {
      if (m.userId !== userId) {
        groupContextMap.set(m.userId, `${g.type.toLowerCase()}_group: ${g.name}`);
      }
    }
  }

  const currentUserActivities = new Set(
    currentUser.activityPreferences.map((p) => p.activity)
  );

  const clusters: CandidateCluster[] = [];

  // Pairwise clusters
  for (const friend of friends) {
    const overlaps = intersectIntervals(
      currentUser.availabilityBlocks,
      friend.availabilityBlocks
    );

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
    });
  }

  // Sort by score desc, return top 10
  return clusters.sort((a, b) => b.score - a.score).slice(0, 10);
}

import {
  addHours,
  addMinutes,
  differenceInMinutes,
  isAfter,
  isBefore,
  parseISO,
  set,
  startOfHour,
} from "date-fns";

import {
  DEFAULT_MODEL,
  MATCHING_WINDOW_HOURS,
  MAX_SUGGESTIONS,
  MIN_MEETUP_MINUTES,
} from "@/lib/constants";
import { getDemoState, updateDemoState } from "@/lib/demo-store";
import { formatUtc, stableHash } from "@/lib/time";
import type {
  Activity,
  AppUser,
  CandidateCluster,
  Meetup,
  MeetupSuggestion,
  RoutineProfile,
  SuggestionRun,
  UserLocation,
  VenueOption,
} from "@/lib/types";

function getUser(userId: string): AppUser {
  const user = getDemoState().users.find((entry) => entry.id === userId);
  if (!user) {
    throw new Error(`Unknown user ${userId}`);
  }
  return user;
}

function distanceKm(a: UserLocation, b: UserLocation): number {
  const earthRadiusKm = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const haversine = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return earthRadiusKm * 2 * Math.asin(Math.sqrt(haversine));
}

function getActiveLocation(userId: string, now: Date) {
  return getDemoState()
    .locations.filter((entry) => entry.userId === userId)
    .find((entry) => !entry.expiresAt || isAfter(parseISO(entry.expiresAt), now));
}

function getBusyEvents(userId: string, windowStart: Date, windowEnd: Date) {
  return getDemoState().calendarEvents
    .filter((entry) => entry.userId === userId && entry.isBusy)
    .map((entry) => ({
      ...entry,
      start: parseISO(entry.startsAt),
      end: parseISO(entry.endsAt),
    }))
    .filter((entry) => isBefore(entry.start, windowEnd) && isAfter(entry.end, windowStart))
    .toSorted((left, right) => left.start.getTime() - right.start.getTime());
}

function clampWindow(now: Date, dayOffset: number) {
  const day = addHours(now, dayOffset * 24);
  return {
    start: set(day, { hours: 8, minutes: 0, seconds: 0, milliseconds: 0 }),
    end: set(day, { hours: 22, minutes: 0, seconds: 0, milliseconds: 0 }),
  };
}

function getFreeBlocks(userId: string, now: Date) {
  const blocks: { start: Date; end: Date }[] = [];
  for (let dayOffset = 0; dayOffset < 3; dayOffset += 1) {
    const { start, end } = clampWindow(now, dayOffset);
    const busyEvents = getBusyEvents(userId, start, end);
    let cursor = start;

    for (const busy of busyEvents) {
      if (isAfter(busy.start, cursor)) {
        blocks.push({ start: cursor, end: busy.start });
      }
      if (isAfter(busy.end, cursor)) {
        cursor = busy.end;
      }
    }

    if (isAfter(end, cursor)) {
      blocks.push({ start: cursor, end });
    }
  }

  return blocks.filter((block) => differenceInMinutes(block.end, block.start) >= MIN_MEETUP_MINUTES);
}

function intersectBlocks(userIds: string[], now: Date) {
  const perUser = userIds.map((userId) => getFreeBlocks(userId, now));
  const windows: { start: Date; end: Date }[] = [];

  for (const primary of perUser[0] ?? []) {
    let overlap = { ...primary };
    let valid = true;

    for (let index = 1; index < perUser.length; index += 1) {
      const match = perUser[index].find(
        (candidate) =>
          isBefore(candidate.start, overlap.end) && isAfter(candidate.end, overlap.start),
      );
      if (!match) {
        valid = false;
        break;
      }
      overlap = {
        start: match.start > overlap.start ? match.start : overlap.start,
        end: match.end < overlap.end ? match.end : overlap.end,
      };
    }

    if (valid && differenceInMinutes(overlap.end, overlap.start) >= MIN_MEETUP_MINUTES) {
      windows.push(overlap);
    }
  }

  return windows;
}

function averagePreference(userIds: string[], activity: Activity) {
  const values = userIds.map((userId) => getUser(userId).activityPreferences[activity] ?? 0.3);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function routineBoost(userIds: string[], activity: Activity, startAt: Date) {
  const routines = getDemoState().routines.filter((routine) => {
    if (routine.activity !== activity) {
      return false;
    }

    const ownerMatches =
      routine.ownerType === "group"
        ? userIds.every((userId) =>
            getDemoState().groupMembers.some(
              (member) => member.groupId === routine.ownerId && member.userId === userId,
            ),
          )
        : userIds.includes(routine.ownerId);

    return ownerMatches && routine.daysOfWeek.includes(startAt.getDay());
  });

  if (routines.length === 0) {
    return 0;
  }

  const hour = startAt.getHours();
  return routines.some((routine) => Math.abs(routine.localStartHour - hour) <= 1) ? 0.18 : 0.08;
}

function chooseVenues(activity: Activity, participantIds: string[], now: Date) {
  const venues = getDemoState().venues.filter((venue) => venue.activity === activity);
  const locations = participantIds
    .map((userId) => getActiveLocation(userId, now))
    .filter((entry): entry is UserLocation => Boolean(entry));

  if (locations.length === 0) {
    return venues.slice(0, 2);
  }

  const center = {
    latitude: locations.reduce((sum, entry) => sum + entry.latitude, 0) / locations.length,
    longitude: locations.reduce((sum, entry) => sum + entry.longitude, 0) / locations.length,
  };

  return venues
    .toSorted((left, right) => {
      const leftDistance = Math.hypot(left.latitude - center.latitude, left.longitude - center.longitude);
      const rightDistance = Math.hypot(right.latitude - center.latitude, right.longitude - center.longitude);
      return leftDistance - rightDistance;
    })
    .slice(0, 3);
}

function buildPrimaryVenue(venues: VenueOption[]): VenueOption {
  return venues[0] ?? {
    name: "Campus meetup spot",
    label: "Campus meetup spot",
    latitude: 40.7308,
    longitude: -73.9973,
  };
}

function getVenueOptions(candidate: CandidateCluster): VenueOption[] {
  return candidate.venueOptions ?? [candidate.location];
}

function getReasonSignals(candidate: CandidateCluster): string[] {
  return candidate.reasonSignals ?? candidate.reasons;
}

function proximityForParticipants(userIds: string[], now: Date) {
  const activeLocations = userIds
    .map((userId) => getActiveLocation(userId, now))
    .filter((entry): entry is UserLocation => Boolean(entry));

  if (activeLocations.length < 2) {
    return undefined;
  }

  const distances: number[] = [];
  for (let leftIndex = 0; leftIndex < activeLocations.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < activeLocations.length; rightIndex += 1) {
      distances.push(distanceKm(activeLocations[leftIndex], activeLocations[rightIndex]));
    }
  }

  return distances.reduce((sum, value) => sum + value, 0) / distances.length;
}

function reasonSignals(userIds: string[], activity: Activity, startAt: Date, proximityKm?: number) {
  const signals: string[] = [];
  if (averagePreference(userIds, activity) >= 0.8) {
    signals.push("strong activity preference");
  }
  if (routineBoost(userIds, activity, startAt) > 0.1) {
    signals.push("matches recurring routine");
  }
  if (typeof proximityKm === "number" && proximityKm <= 1.5) {
    signals.push("everyone is already nearby");
  }
  if (startAt.getHours() >= 18 && activity === "study") {
    signals.push("good post-class study window");
  }
  return signals;
}

function candidateScore(
  userIds: string[],
  activity: Activity,
  overlapMinutes: number,
  startAt: Date,
  proximityKm?: number,
) {
  const preference = averagePreference(userIds, activity);
  const routine = routineBoost(userIds, activity, startAt);
  const overlapScore = Math.min(overlapMinutes / 120, 1);
  const proximityScore = typeof proximityKm === "number" ? Math.max(0, 1 - proximityKm / 4) : 0.35;
  return Number((preference * 0.45 + overlapScore * 0.3 + proximityScore * 0.15 + routine).toFixed(3));
}

function buildGroupCandidates(userId: string) {
  const memberships = getDemoState().groupMembers.filter((member) => member.userId === userId);
  return memberships
    .map((membership) => {
      const group = getDemoState().groups.find((entry) => entry.id === membership.groupId);
      if (!group) {
        return undefined;
      }

      return {
        groupId: group.id,
        participantIds: getDemoState()
          .groupMembers.filter((entry) => entry.groupId === group.id)
          .map((entry) => entry.userId),
        activity: group.defaultActivity,
      };
    })
    .filter(
      (entry): entry is { groupId: string; participantIds: string[]; activity: Activity } =>
        Boolean(entry),
    );
}

function buildFriendCandidates(userId: string) {
  const friendIds = getDemoState().friendships
    .filter(
      (entry) =>
        entry.status === "accepted" &&
        (entry.requesterId === userId || entry.addresseeId === userId),
    )
    .map((entry) => (entry.requesterId === userId ? entry.addresseeId : entry.requesterId));

  return friendIds.map((friendId) => ({
    participantIds: [userId, friendId],
  }));
}

export function buildCandidateClusters(userId: string, now = new Date()): CandidateCluster[] {
  const clusters: CandidateCluster[] = [];

  for (const candidate of buildFriendCandidates(userId)) {
    const overlaps = intersectBlocks(candidate.participantIds, now);
    for (const overlap of overlaps.slice(0, 2)) {
      const startAt = startOfHour(addMinutes(overlap.start, 30));
      if (isBefore(startAt, now) || differenceInMinutes(overlap.end, startAt) < MIN_MEETUP_MINUTES) {
        continue;
      }

      const preferredActivities = (["gym", "coffee", "eat", "hangout", "study"] as Activity[]).sort(
        (left, right) =>
          averagePreference(candidate.participantIds, right) - averagePreference(candidate.participantIds, left),
      );

      for (const activity of preferredActivities.slice(0, 2)) {
        const proximityKm = proximityForParticipants(candidate.participantIds, now);
        clusters.push({
          id: `cand-${stableHash(`${candidate.participantIds.join("-")}:${activity}:${startAt.toISOString()}`)}`,
          activity,
          participantIds: candidate.participantIds,
          start: formatUtc(startAt),
          end: formatUtc(overlap.end),
          startAt: formatUtc(startAt),
          durationMinutes: Math.min(90, differenceInMinutes(overlap.end, startAt)),
          overlapLabel: `${differenceInMinutes(overlap.end, overlap.start)} min overlap`,
          overlapMinutes: differenceInMinutes(overlap.end, overlap.start),
          proximityKm,
          location: buildPrimaryVenue(chooseVenues(activity, candidate.participantIds, now)),
          venueOptions: chooseVenues(activity, candidate.participantIds, now),
          score: candidateScore(candidate.participantIds, activity, differenceInMinutes(overlap.end, overlap.start), startAt, proximityKm),
          reasons: reasonSignals(candidate.participantIds, activity, startAt, proximityKm),
          reasonSignals: reasonSignals(candidate.participantIds, activity, startAt, proximityKm),
        });
      }
    }
  }

  for (const candidate of buildGroupCandidates(userId)) {
    const overlap = intersectBlocks(candidate.participantIds, now)[0];
    if (!overlap) {
      continue;
    }
    const startAt = startOfHour(addMinutes(overlap.start, 30));
    if (isBefore(startAt, now)) {
      continue;
    }
    const proximityKm = proximityForParticipants(candidate.participantIds, now);
    clusters.push({
      id: `cand-${stableHash(`${candidate.groupId}:${candidate.activity}:${startAt.toISOString()}`)}`,
      activity: candidate.activity,
      participantIds: candidate.participantIds,
      groupId: candidate.groupId,
      start: formatUtc(startAt),
      end: formatUtc(overlap.end),
      startAt: formatUtc(startAt),
      durationMinutes: Math.min(90, differenceInMinutes(overlap.end, startAt)),
      overlapLabel: `${differenceInMinutes(overlap.end, overlap.start)} min overlap`,
      overlapMinutes: differenceInMinutes(overlap.end, overlap.start),
      proximityKm,
      location: buildPrimaryVenue(chooseVenues(candidate.activity, candidate.participantIds, now)),
      venueOptions: chooseVenues(candidate.activity, candidate.participantIds, now),
      score:
        candidateScore(candidate.participantIds, candidate.activity, differenceInMinutes(overlap.end, overlap.start), startAt, proximityKm) +
        0.08,
      reasons: reasonSignals(candidate.participantIds, candidate.activity, startAt, proximityKm),
      reasonSignals: reasonSignals(candidate.participantIds, candidate.activity, startAt, proximityKm),
    });
  }

  return clusters
    .filter((cluster) => isBefore(parseISO(cluster.startAt ?? cluster.start), addHours(now, MATCHING_WINDOW_HOURS)))
    .toSorted((left, right) => right.score - left.score)
    .slice(0, 8);
}

function fallbackSuggestions(userId: string, candidates: CandidateCluster[]): MeetupSuggestion[] {
  return candidates.slice(0, MAX_SUGGESTIONS).map((candidate) => {
    const venue = getVenueOptions(candidate)[0];
    return {
      id: `sug-${stableHash(`${candidate.id}:${userId}`)}`,
      userId,
      participantIds: candidate.participantIds,
      groupId: candidate.groupId,
      activity: candidate.activity,
      start: candidate.start,
      startAt: candidate.startAt,
      durationMinutes: candidate.durationMinutes,
      location: venue ?? buildPrimaryVenue([]),
      locationName: venue?.name ?? "Campus meetup spot",
      locationLat: venue?.latitude,
      locationLng: venue?.longitude,
      reason: getReasonSignals(candidate)[0] ?? "Strong overlap, short travel, and a likely match for everyone involved.",
      confidence: Number(Math.min(0.94, 0.55 + candidate.score * 0.35).toFixed(2)),
      score: candidate.score,
      status: "active",
      source: "fallback",
      generatedBy: "fallback",
    };
  });
}

async function buildClaudeSuggestions(userId: string, candidates: CandidateCluster[]) {
  const { generateStructuredSuggestions } = await import("@/lib/claude");
  return generateStructuredSuggestions({
    userId,
    candidates,
    memoryCards: getDemoState().memoryCards,
    users: getDemoState().users,
  });
}

export async function generateMeetupSuggestions(userId: string, now = new Date()) {
  const candidates = buildCandidateClusters(userId, now);
  const inputHash = stableHash(JSON.stringify(candidates));

  let suggestions: MeetupSuggestion[];
  let usedFallback = false;

  try {
    suggestions = await buildClaudeSuggestions(userId, candidates);
  } catch {
    suggestions = fallbackSuggestions(userId, candidates);
    usedFallback = true;
  }

  const run: SuggestionRun = {
    id: `run-${stableHash(`${userId}:${inputHash}:${now.toISOString()}`)}`,
    userId,
    model: DEFAULT_MODEL,
    inputHash,
    createdAt: formatUtc(now),
    usedFallback,
  };

  updateDemoState((state) => {
    state.suggestionRuns.unshift(run);
    const newIds = new Set(suggestions.map((entry) => entry.id));
    state.suggestions = [
      ...suggestions,
      ...state.suggestions.filter((entry) => entry.userId !== userId || !newIds.has(entry.id)),
    ].slice(0, 12);
  });

  return suggestions;
}

export async function getSuggestionsForUser(userId: string) {
  const existing = getDemoState()
    .suggestions.filter((entry) => entry.userId === userId && entry.status === "active")
    .slice(0, MAX_SUGGESTIONS);
  if (existing.length > 0) {
    return existing;
  }
  return generateMeetupSuggestions(userId);
}

export function confirmSuggestion(userId: string, suggestionId: string): Meetup {
  let createdMeetup: Meetup | undefined;

  updateDemoState((state) => {
    const suggestion = state.suggestions.find(
      (entry) => entry.id === suggestionId && entry.userId === userId,
    );
    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    suggestion.status = "confirmed";
    createdMeetup = {
      id: `meet-${stableHash(`${suggestion.id}:confirmed`)}`,
      suggestionId: suggestion.id,
      creatorUserId: userId,
      participantIds: suggestion.participantIds,
      activity: suggestion.activity,
      start: suggestion.start,
      durationMinutes: suggestion.durationMinutes,
      location: suggestion.location,
      status: "confirmed",
    };
    state.meetups.unshift(createdMeetup);
  });

  if (!createdMeetup) {
    throw new Error("Unable to create meetup");
  }
  return createdMeetup;
}

export function skipSuggestion(userId: string, suggestionId: string) {
  updateDemoState((state) => {
    const suggestion = state.suggestions.find(
      (entry) => entry.id === suggestionId && entry.userId === userId,
    );
    if (!suggestion) {
      throw new Error("Suggestion not found");
    }
    suggestion.status = "skipped";
  });
}

export function listRecentMeetups(userId: string) {
  return getDemoState().meetups.filter((meetup) => meetup.creatorUserId === userId);
}

export function listRoutinesForUser(userId: string): RoutineProfile[] {
  const membershipIds = new Set(
    getDemoState()
      .groupMembers.filter((entry) => entry.userId === userId)
      .map((entry) => entry.groupId),
  );
  return getDemoState().routines.filter(
    (routine) =>
      (routine.ownerType === "user" && routine.ownerId === userId) ||
      (routine.ownerType === "group" && membershipIds.has(routine.ownerId)),
  );
}

export function listFriends(userId: string) {
  return getDemoState().users.filter((candidate) =>
    getDemoState().friendships.some(
      (friendship) =>
        friendship.status === "accepted" &&
        ((friendship.requesterId === userId && friendship.addresseeId === candidate.id) ||
          (friendship.addresseeId === userId && friendship.requesterId === candidate.id)),
    ),
  );
}

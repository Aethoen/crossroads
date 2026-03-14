import { addDays, addHours, addMinutes, set } from "date-fns";

import { DEMO_USER_ID } from "@/lib/constants";
import { formatUtc } from "@/lib/time";
import type {
  Activity,
  AppUser,
  CalendarEvent,
  DemoState,
  Friendship,
  Group,
  GroupMember,
  MemoryCard,
  RoutineProfile,
  UserLocation,
  VenueOption,
} from "@/lib/types";

function buildDate(base: Date, dayOffset: number, hour: number, minute = 0): Date {
  return set(addDays(base, dayOffset), {
    hours: hour,
    minutes: minute,
    seconds: 0,
    milliseconds: 0,
  });
}

function event(
  id: string,
  userId: string,
  title: string,
  start: Date,
  end: Date,
  inferredActivity?: Activity,
): CalendarEvent {
  return {
    id,
    userId,
    title,
    startsAt: formatUtc(start),
    endsAt: formatUtc(end),
    isBusy: true,
    isRecurring: false,
    inferredActivity,
  };
}

export function createDemoState(now = new Date()): DemoState {
  const anchor = addHours(now, 2);
  const users: AppUser[] = [
    {
      id: DEMO_USER_ID,
      name: "Maya Chen",
      email: "maya@crossroads.demo",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&w=256&h=256&q=80",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&w=256&h=256&q=80",
      timezone: "America/New_York",
      calendarConnected: true,
      locationSharingEnabled: true,
      locationMode: "live",
      activityPreferences: { gym: 0.92, coffee: 0.71, study: 0.65, eat: 0.74, hangout: 0.58 },
    },
    {
      id: "user-alex",
      name: "Alex Rivera",
      email: "alex@crossroads.demo",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&w=256&h=256&q=80",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&w=256&h=256&q=80",
      timezone: "America/New_York",
      calendarConnected: true,
      locationSharingEnabled: true,
      locationMode: "live",
      activityPreferences: { gym: 0.95, coffee: 0.4, study: 0.3, eat: 0.66, hangout: 0.6 },
    },
    {
      id: "user-rina",
      name: "Rina Patel",
      email: "rina@crossroads.demo",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=256&h=256&q=80",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=256&h=256&q=80",
      timezone: "America/New_York",
      calendarConnected: true,
      locationSharingEnabled: true,
      locationMode: "manual",
      activityPreferences: { study: 0.98, coffee: 0.82, eat: 0.57, hangout: 0.44, gym: 0.18 },
    },
    {
      id: "user-jules",
      name: "Jules Carter",
      email: "jules@crossroads.demo",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&w=256&h=256&q=80",
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&w=256&h=256&q=80",
      timezone: "America/New_York",
      calendarConnected: true,
      locationSharingEnabled: true,
      locationMode: "manual",
      activityPreferences: { eat: 0.88, hangout: 0.91, coffee: 0.62, study: 0.35, gym: 0.42 },
    },
  ];

  const friendships: Friendship[] = [
    { id: "fr-1", requesterId: DEMO_USER_ID, addresseeId: "user-alex", status: "accepted", acceptedAt: formatUtc(anchor) },
    { id: "fr-2", requesterId: "user-rina", addresseeId: DEMO_USER_ID, status: "accepted", acceptedAt: formatUtc(anchor) },
    { id: "fr-3", requesterId: DEMO_USER_ID, addresseeId: "user-jules", status: "accepted", acceptedAt: formatUtc(anchor) },
  ];

  const groups: Group[] = [
    {
      id: "group-gym",
      ownerId: DEMO_USER_ID,
      name: "6PM Gym Crew",
      description: "Weeknight lifts and cardio at the campus gym.",
      activity: "gym",
      memberIds: [DEMO_USER_ID, "user-alex"],
      energy: "steady",
      defaultActivity: "gym",
      homeAreaLabel: "Campus Gym",
    },
    {
      id: "group-study",
      ownerId: "user-rina",
      name: "Library Sprint",
      description: "Short, focused evening study sessions before deadlines.",
      activity: "study",
      memberIds: [DEMO_USER_ID, "user-rina", "user-jules"],
      energy: "focused",
      defaultActivity: "study",
      homeAreaLabel: "North Library",
    },
  ];

  const groupMembers: GroupMember[] = [
    { id: "gm-1", groupId: "group-gym", userId: DEMO_USER_ID, role: "owner" },
    { id: "gm-2", groupId: "group-gym", userId: "user-alex", role: "member" },
    { id: "gm-3", groupId: "group-study", userId: DEMO_USER_ID, role: "member" },
    { id: "gm-4", groupId: "group-study", userId: "user-rina", role: "owner" },
    { id: "gm-5", groupId: "group-study", userId: "user-jules", role: "member" },
  ];

  const calendarEvents: CalendarEvent[] = [
    event("ce-1", DEMO_USER_ID, "Product class", buildDate(anchor, 0, 13), buildDate(anchor, 0, 15)),
    event("ce-2", DEMO_USER_ID, "Dinner with cousin", buildDate(anchor, 0, 20), buildDate(anchor, 0, 21, 30), "eat"),
    event("ce-3", DEMO_USER_ID, "Team standup", buildDate(anchor, 1, 10), buildDate(anchor, 1, 11)),
    event("ce-4", DEMO_USER_ID, "Research block", buildDate(anchor, 1, 14), buildDate(anchor, 1, 16), "study"),
    event("ce-5", "user-alex", "Lab shift", buildDate(anchor, 0, 12), buildDate(anchor, 0, 17)),
    event("ce-6", "user-alex", "Rec soccer", buildDate(anchor, 0, 20), buildDate(anchor, 0, 22), "hangout"),
    event("ce-7", "user-alex", "Morning training", buildDate(anchor, 1, 9), buildDate(anchor, 1, 10), "gym"),
    event("ce-8", "user-rina", "TA office hours", buildDate(anchor, 0, 14), buildDate(anchor, 0, 17)),
    event("ce-9", "user-rina", "Chem review", buildDate(anchor, 1, 18), buildDate(anchor, 1, 19, 30), "study"),
    event("ce-10", "user-jules", "Design critique", buildDate(anchor, 0, 11), buildDate(anchor, 0, 13)),
    event("ce-11", "user-jules", "Family call", buildDate(anchor, 0, 18), buildDate(anchor, 0, 19)),
    event("ce-12", "user-jules", "Studio session", buildDate(anchor, 1, 14), buildDate(anchor, 1, 17)),
  ];

  const routines: RoutineProfile[] = [
    {
      id: "rt-1",
      ownerType: "user",
      ownerId: DEMO_USER_ID,
      activity: "gym",
      daysOfWeek: [1, 2, 3, 4, 5],
      localStartHour: 18,
      durationMinutes: 75,
      locationLabel: "Campus Gym",
      summary: "Maya tends to work out on weekday evenings.",
    },
    {
      id: "rt-2",
      ownerType: "user",
      ownerId: "user-rina",
      activity: "study",
      daysOfWeek: [0, 2, 4],
      localStartHour: 19,
      durationMinutes: 90,
      locationLabel: "North Library",
      summary: "Rina often blocks focused study sessions after dinner.",
    },
    {
      id: "rt-3",
      ownerType: "group",
      ownerId: "group-study",
      activity: "study",
      daysOfWeek: [0, 2, 4],
      localStartHour: 19,
      durationMinutes: 90,
      locationLabel: "North Library",
      summary: "This group usually meets for evening study sprints.",
    },
  ];

  const locations: UserLocation[] = [
    {
      id: "loc-1",
      userId: DEMO_USER_ID,
      latitude: 40.7308,
      longitude: -73.9973,
      source: "live",
      capturedAt: formatUtc(addMinutes(anchor, -5)),
      expiresAt: formatUtc(addMinutes(anchor, 10)),
      label: "Campus Center",
    },
    {
      id: "loc-2",
      userId: "user-alex",
      latitude: 40.7321,
      longitude: -73.9954,
      source: "live",
      capturedAt: formatUtc(addMinutes(anchor, -3)),
      expiresAt: formatUtc(addMinutes(anchor, 12)),
      label: "Rec Quad",
    },
    {
      id: "loc-3",
      userId: "user-rina",
      latitude: 40.7291,
      longitude: -73.9992,
      source: "manual",
      capturedAt: formatUtc(addMinutes(anchor, -8)),
      expiresAt: formatUtc(addHours(anchor, 6)),
      label: "North Library",
    },
    {
      id: "loc-4",
      userId: "user-jules",
      latitude: 40.7314,
      longitude: -74.0012,
      source: "manual",
      capturedAt: formatUtc(addMinutes(anchor, -20)),
      expiresAt: formatUtc(addHours(anchor, 8)),
      label: "Art Building",
    },
  ];

  const venues: VenueOption[] = [
    { id: "venue-1", name: "Campus Gym", label: "Campus Gym", activity: "gym", latitude: 40.7315, longitude: -73.9964, area: "Campus" },
    { id: "venue-2", name: "Fuel Bar Coffee", label: "Fuel Bar Coffee", activity: "coffee", latitude: 40.7301, longitude: -73.9982, area: "Campus" },
    { id: "venue-3", name: "North Library", label: "North Library", activity: "study", latitude: 40.7291, longitude: -73.9994, area: "Campus" },
    { id: "venue-4", name: "Commons Kitchen", label: "Commons Kitchen", activity: "eat", latitude: 40.7307, longitude: -73.9969, area: "Campus" },
    { id: "venue-5", name: "Riverside Lawn", label: "Riverside Lawn", activity: "hangout", latitude: 40.7328, longitude: -74.0001, area: "Campus" },
  ];

  const memoryCards: MemoryCard[] = [
    {
      id: "mem-1",
      ownerType: "user",
      ownerId: DEMO_USER_ID,
      kind: "routine",
      activity: "gym",
      participantIds: [DEMO_USER_ID, "user-alex"],
      freshnessScore: 0.92,
      text: "Maya and Alex both keep weekday evening gym routines near campus.",
    },
    {
      id: "mem-2",
      ownerType: "group",
      ownerId: "group-study",
      kind: "success",
      activity: "study",
      participantIds: [DEMO_USER_ID, "user-rina", "user-jules"],
      freshnessScore: 0.84,
      text: "Library Sprint usually confirms when everyone has a 90-minute overlap after 7pm.",
    },
    {
      id: "mem-3",
      ownerType: "user",
      ownerId: "user-jules",
      kind: "preference",
      activity: "eat",
      participantIds: [DEMO_USER_ID, "user-jules"],
      freshnessScore: 0.73,
      text: "Jules tends to accept casual dinner plans close to campus after classes wrap.",
    },
  ];

  return {
    users,
    friendships,
    groups,
    groupMembers,
    calendarEvents,
    availabilityBlocks: [],
    routines,
    locations,
    venues,
    memoryCards,
    suggestionRuns: [],
    suggestions: [],
    meetups: [],
  };
}

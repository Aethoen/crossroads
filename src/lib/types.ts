export type Activity = "gym" | "eat" | "study" | "hangout" | "coffee";

export type LocationMode = "disabled" | "manual" | "live";

export type FriendStatus = "pending" | "accepted" | "declined";

export type SuggestionStatus = "active" | "confirmed" | "skipped" | "expired";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  avatarUrl?: string;
  timezone: string;
  calendarConnected: boolean;
  locationSharingEnabled: boolean;
  locationMode: LocationMode;
  activityPreferences: Record<Activity, number>;
}

export type AppUser = UserProfile;

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendStatus;
  acceptedAt?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  activity?: Activity;
  memberIds?: string[];
  energy?: "steady" | "focused" | "social";
  ownerId?: string;
  defaultActivity?: Activity;
  homeAreaLabel?: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: "owner" | "member";
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  isBusy: boolean;
  isRecurring: boolean;
  inferredActivity?: Activity;
}

export interface AvailabilityBlock {
  id: string;
  userId: string;
  start: string;
  end: string;
  source: "calendar_gap" | "routine";
  confidence: number;
}

export interface UserLocation {
  id?: string;
  userId: string;
  label: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  source: "live" | "manual";
  capturedAt: string;
  expiresAt?: string;
}

export interface VenueOption {
  id?: string;
  name: string;
  label: string;
  latitude: number;
  longitude: number;
  activity?: Activity;
  area?: string;
}

export interface MemoryCard {
  id: string;
  ownerType: "user" | "group";
  ownerId: string;
  kind: "routine" | "preference" | "success" | "skip";
  activity: Activity;
  text: string;
  freshnessScore: number;
  participantIds?: string[];
}

export interface CandidateCluster {
  id: string;
  activity: Activity;
  participantIds: string[];
  start: string;
  end: string;
  durationMinutes: number;
  overlapLabel: string;
  location: VenueOption;
  score: number;
  groupId?: string;
  reasons: string[];
  startAt?: string;
  overlapMinutes?: number;
  venueOptions?: VenueOption[];
  reasonSignals?: string[];
  proximityKm?: number;
}

export interface MeetupSuggestion {
  id: string;
  userId?: string;
  activity: Activity;
  participantIds: string[];
  start: string;
  durationMinutes: number;
  location: VenueOption;
  reason: string;
  confidence: number;
  score: number;
  groupId?: string;
  status: SuggestionStatus;
  source: "claude" | "fallback";
  startAt?: string;
  locationName?: string;
  locationLat?: number;
  locationLng?: number;
  generatedBy?: "claude" | "fallback";
}

export interface MeetupRecord {
  id: string;
  suggestionId?: string;
  creatorUserId?: string;
  activity: Activity;
  participantIds: string[];
  start: string;
  durationMinutes: number;
  location: VenueOption;
  status: "confirmed";
}

export type Meetup = MeetupRecord;

export interface RoutineProfile {
  id: string;
  ownerType: "user" | "group";
  ownerId: string;
  activity: Activity;
  daysOfWeek: number[];
  localStartHour: number;
  durationMinutes: number;
  locationLabel: string;
  summary: string;
}

export interface SuggestionRun {
  id: string;
  userId: string;
  model: string;
  inputHash: string;
  createdAt: string;
  usedFallback: boolean;
}

export interface DemoState {
  users: UserProfile[];
  friendships: Friendship[];
  groups: Group[];
  groupMembers: GroupMember[];
  calendarEvents: CalendarEvent[];
  availabilityBlocks: AvailabilityBlock[];
  routines: RoutineProfile[];
  locations: UserLocation[];
  venues: VenueOption[];
  memoryCards: MemoryCard[];
  suggestionRuns: SuggestionRun[];
  suggestions: MeetupSuggestion[];
  meetups: MeetupRecord[];
}

export interface DashboardSnapshot {
  currentUser: UserProfile;
  users: UserProfile[];
  groups: Group[];
  friendships: Friendship[];
  groupMembers: GroupMember[];
  locations: UserLocation[];
  routines: RoutineProfile[];
  memoryCards: MemoryCard[];
  suggestions: MeetupSuggestion[];
  meetups: MeetupRecord[];
}

export interface GoogleCalendarConnection {
  id: string;
  userId: string;
  googleAccountId?: string | null;
  primaryCalendarId?: string | null;
  scope?: string | null;
  tokenType?: string | null;
  connectedAt: string;
  lastSyncedAt?: string | null;
}

export interface OnboardingState {
  hasActivityPreferences: boolean;
  hasCalendarConnection: boolean;
  hasCompletedLocationChoice: boolean;
  isComplete: boolean;
}

export interface ViewerContext {
  mode: "auth" | "demo";
  profile: UserProfile;
  sessionUserId?: string;
  onboarding?: OnboardingState;
}

import { ActivityType, FriendshipStatus, GroupType, MeetupStatus, ParticipantStatus, SuggestionStatus } from "@prisma/client";

export type { ActivityType, FriendshipStatus, GroupType, MeetupStatus, ParticipantStatus, SuggestionStatus };

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  calendarConnected: boolean;
  locationSharingEnabled: boolean;
}

export interface FriendWithProfile {
  id: string;
  status: FriendshipStatus;
  friend: UserProfile;
  requesterId: string;
}

export interface GroupWithMembers {
  id: string;
  name: string;
  type: GroupType;
  members: {
    id: string;
    role: string;
    user: UserProfile;
  }[];
}

export interface AvailabilityWindow {
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
}

export interface StudyContext {
  sharedGroups: string[];
  upcomingStudyEvents: string[];
}

export interface CandidateCluster {
  participants: UserProfile[];
  sharedWindow: AvailabilityWindow;
  activityOverlap: ActivityType[];
  proximityLabel: "same_area" | "nearby" | "far" | "unknown";
  score: number;
  groupContext?: string;
  calendarAnchorLocations?: string[];
  studyContext?: StudyContext;
}

export interface SuggestionObject {
  activity: ActivityType;
  participants: string[]; // userIds
  start: string; // ISO
  duration_minutes: number;
  location: string;
  reason: string;
  confidence: number;
}

export interface SuggestionWithParticipants {
  id: string;
  activity: ActivityType;
  participantIds: string[];
  startTime: Date;
  durationMinutes: number;
  location: string | null;
  reason: string;
  confidence: number;
  status: SuggestionStatus;
  participantProfiles?: UserProfile[];
}

export interface MeetupWithParticipants {
  id: string;
  title: string;
  activity: ActivityType;
  startTime: Date;
  durationMinutes: number;
  location: string | null;
  status: MeetupStatus;
  myStatus: ParticipantStatus;
  participants: UserProfile[];
}

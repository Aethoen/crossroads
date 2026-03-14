import type { Activity } from "@/lib/types";

export const DEMO_USER_ID = "user-maya";
export const MATCHING_WINDOW_HOURS = 72;
export const MIN_MEETUP_MINUTES = 30;
export const MAX_SUGGESTIONS = 5;
export const LOCATION_TTL_MINUTES = 15;
export const LOCATION_HEARTBEAT_SECONDS = 45;
export const DEFAULT_MODEL = "claude-sonnet-4-20250514";
export const DEMO_MODE_COOKIE = "crossroads-demo";
export const CALENDAR_SYNC_LOOKBACK_DAYS = 30;
export const CALENDAR_SYNC_LOOKAHEAD_DAYS = 14;

export const activityLabels: Record<Activity, string> = {
  gym: "Gym",
  eat: "Dinner",
  study: "Study",
  hangout: "Hangout",
  coffee: "Coffee",
};

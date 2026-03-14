import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const locationModeEnum = pgEnum("location_mode", ["disabled", "manual", "live"]);
export const friendshipStatusEnum = pgEnum("friendship_status", ["pending", "accepted", "declined"]);
export const activityEnum = pgEnum("activity", ["gym", "eat", "study", "hangout", "coffee"]);
export const suggestionStatusEnum = pgEnum("suggestion_status", ["active", "confirmed", "skipped", "expired"]);

// Better Auth uses text ids by default; the app schema follows that to avoid adapter friction.
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: varchar("name", { length: 120 }).notNull(),
  image: text("image"),
  avatarUrl: text("avatar_url"),
  timezone: varchar("timezone", { length: 60 }).notNull().default("America/New_York"),
  calendarConnected: boolean("calendar_connected").notNull().default(false),
  locationMode: locationModeEnum("location_mode").notNull().default("disabled"),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenIdx: uniqueIndex("sessions_token_idx").on(table.token),
  }),
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    providerAccountIdx: uniqueIndex("accounts_provider_account_idx").on(
      table.providerId,
      table.accountId,
    ),
  }),
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    verificationLookupIdx: uniqueIndex("verifications_lookup_idx").on(
      table.identifier,
      table.value,
    ),
  }),
);

export const googleCalendarConnections = pgTable(
  "google_calendar_connections",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    googleAccountId: text("google_account_id").notNull(),
    primaryCalendarId: text("primary_calendar_id").notNull(),
    accessTokenEncrypted: text("access_token_encrypted").notNull(),
    refreshTokenEncrypted: text("refresh_token_encrypted"),
    tokenType: text("token_type"),
    scope: text("scope"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    connectionUserIdx: uniqueIndex("google_calendar_connections_user_idx").on(table.userId),
  }),
);

export const friendships = pgTable(
  "friendships",
  {
    id: text("id").primaryKey(),
    requesterId: text("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    addresseeId: text("addressee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    status: friendshipStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  },
  (table) => ({
    pairIdx: uniqueIndex("friendships_pair_idx").on(table.requesterId, table.addresseeId),
  }),
);

export const groups = pgTable("groups", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description").notNull(),
  defaultActivity: activityEnum("default_activity").notNull(),
  homeAreaLabel: varchar("home_area_label", { length: 120 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const groupMembers = pgTable(
  "group_members",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 24 }).notNull().default("member"),
  },
  (table) => ({
    membershipIdx: uniqueIndex("group_membership_idx").on(table.groupId, table.userId),
  }),
);

export const activityPreferences = pgTable(
  "activity_preferences",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    activity: activityEnum("activity").notNull(),
    weight: integer("weight").notNull().default(50),
    source: varchar("source", { length: 24 }).notNull().default("manual"),
  },
  (table) => ({
    preferenceIdx: uniqueIndex("activity_preferences_user_activity_idx").on(
      table.userId,
      table.activity,
    ),
  }),
);

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    googleEventId: varchar("google_event_id", { length: 255 }).notNull(),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    isBusy: boolean("is_busy").notNull().default(true),
    isRecurring: boolean("is_recurring").notNull().default(false),
    recurrenceJson: jsonb("recurrence_json"),
    inferredActivity: activityEnum("inferred_activity"),
    syncUpdatedAt: timestamp("sync_updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    calendarEventIdx: uniqueIndex("calendar_events_user_google_event_idx").on(
      table.userId,
      table.googleEventId,
    ),
  }),
);

export const availabilityBlocks = pgTable("availability_blocks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  source: varchar("source", { length: 24 }).notNull(),
  confidence: integer("confidence").notNull().default(100),
});

export const userLocations = pgTable("user_locations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 120 }).notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  accuracyMeters: doublePrecision("accuracy_meters"),
  source: varchar("source", { length: 24 }).notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const routineProfiles = pgTable("routine_profiles", {
  id: text("id").primaryKey(),
  ownerType: varchar("owner_type", { length: 24 }).notNull(),
  ownerId: text("owner_id").notNull(),
  activity: activityEnum("activity").notNull(),
  daysOfWeek: jsonb("days_of_week").notNull(),
  localStartTime: varchar("local_start_time", { length: 16 }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  locationLabel: varchar("location_label", { length: 120 }),
  sourceSummary: text("source_summary").notNull(),
});

export const memoryCards = pgTable("memory_cards", {
  id: text("id").primaryKey(),
  ownerType: varchar("owner_type", { length: 24 }).notNull(),
  ownerId: text("owner_id").notNull(),
  kind: varchar("kind", { length: 24 }).notNull(),
  activity: activityEnum("activity").notNull(),
  text: text("text").notNull(),
  participantIds: jsonb("participant_ids"),
  freshnessScore: integer("freshness_score").notNull().default(50),
});

export const suggestionRuns = pgTable("suggestion_runs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  model: varchar("model", { length: 120 }).notNull(),
  inputHash: varchar("input_hash", { length: 255 }).notNull(),
  rawContextJson: jsonb("raw_context_json").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const meetupSuggestions = pgTable("meetup_suggestions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  participantIds: jsonb("participant_ids").notNull(),
  groupId: text("group_id"),
  activity: activityEnum("activity").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  locationName: varchar("location_name", { length: 120 }).notNull(),
  locationLat: doublePrecision("location_lat"),
  locationLng: doublePrecision("location_lng"),
  reason: text("reason").notNull(),
  confidence: integer("confidence").notNull().default(50),
  status: suggestionStatusEnum("status").notNull().default("active"),
  runId: text("run_id").references(() => suggestionRuns.id, { onDelete: "set null" }),
});

export const meetups = pgTable("meetups", {
  id: text("id").primaryKey(),
  suggestionId: text("suggestion_id").references(() => meetupSuggestions.id, { onDelete: "set null" }),
  creatorUserId: text("creator_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  participantIds: jsonb("participant_ids").notNull(),
  activity: activityEnum("activity").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  locationName: varchar("location_name", { length: 120 }).notNull(),
  locationLat: doublePrecision("location_lat"),
  locationLng: doublePrecision("location_lng"),
  status: varchar("status", { length: 24 }).notNull().default("confirmed"),
});

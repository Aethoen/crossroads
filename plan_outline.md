# Task
Design a hackathon MVP for an AI-powered social coordination app that helps friends coordinate meetups (gym, food, studying, hanging out, coffee) using calendar availability + live location + activity preferences.

Goal: automatically suggest meetups and allow users to confirm them.

The project must meaningfully use AI (Claude API). Don't make it a "chat wrapper". It should use RAG/semantic search/some other complex usage of AI (maybe agents).

Optimize for:
- fast MVP
- strong demo
- clear real-world usefulness

---

# Stack

- Next.js (App Router)
- React + TypeScript + Shadcn/ui + Tailwind CSS
- Full stack inside Next.js (serverless)
- Deployment: Vercel (think about what auth and db would work best with integrated with Vercel built-in)
- Google APIs allowed
- Claude API for AI reasoning

---

# Core Idea

Users connect:
- Google Calendar
- optional live location

The system analyzes:
- overlapping free time
- proximity
- activity compatibility
- friend/group relationships

Then AI generates meetup suggestions.

Examples:

- “You and Alex are free near the gym at 6pm”
- “3 friends are free for dinner near campus”
- “Your study group overlaps tonight”

Users can:
- confirm
- invite others
- skip

No chat needed for MVP.

---

# Users

Users already know each other.

Support:
- sign up/login
- friend requests
- groups (gym buddies, study groups, roommates)

Users connect:
- Google Calendar
- optional location sharing

User fields:

id
name
email
avatar
calendarConnected
locationSharingEnabled

---

# Calendar

Import Google Calendar events.

Compute free time blocks.

Allow recurring routines like:
- gym weekdays at 7
- weekly study group

Availability stored as time blocks.

---

# Location

Users can share live location (opt-in).

Used for proximity matching.

Location can be:
- live
- manual check-in
- disabled

Exact coordinates are acceptable for MVP.

---

# Activities

Supported activities:

- gym
- eat
- study
- hangout
- coffee

Users may set preferences.

---

# AI Role (Claude)

Claude generates meetup suggestions using:

- friend graph
- group memberships
- availability overlaps
- location proximity
- activity compatibility
- recurring routines

Claude outputs structured JSON suggestions.

Example output:

[
  {
    activity: "gym",
    participants: ["userA","userB"],
    start: "2026-03-15T18:00",
    duration_minutes: 60,
    location: "Campus Gym",
    reason: "Both are nearby and free"
  }
]

---

# Matching Strategy

Server logic should:

1. find overlapping free time
2. detect nearby users
3. build candidate clusters

Claude then reasons over candidates and returns suggestions.

Prioritize:
- small groups (2–4 people)
- realistic plans
- nearby locations

Avoid calendar conflicts.

---

# Meetup Flow

User opens dashboard.

Main section:
Suggested Meetups

Examples:
- Gym with Alex at 6pm
- Study group tonight
- Lunch near campus

User actions:
- Confirm
- Invite
- Skip

Confirming creates a meetup record.

---

# Key Entities

Conceptual data models:

Users
Friendships
Groups
GroupMembers
CalendarEvents
AvailabilityBlocks
UserLocations
Meetups

---

# Pages

Dashboard
Friends
Groups
Settings

Dashboard shows AI meetup suggestions.

---

# Demo Scenario

1. users connect calendars
2. users enable location sharing
3. friends exist in system
4. AI generates meetup suggestions
5. user confirms one
6. meetup created

---

# Deliverable

Produce a clear MVP plan including:

- architecture
- data model
- AI prompt design
- matching pipeline
- user flows
- major components

Focus on hackathon speed and demo quality, not full production features.
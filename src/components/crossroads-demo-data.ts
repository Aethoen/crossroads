export type Suggestion = {
  id: string;
  title: string;
  activity: string;
  reason: string;
  time: string;
  duration: string;
  location: string;
  participants: {
    name: string;
    initials: string;
    accent: "warm" | "cool" | "gold";
  }[];
  compatibility: string;
  distance: string;
};

export const navItems = [
  { href: "/dashboard", label: "Dashboard", kicker: "Live picks" },
  { href: "/friends", label: "Friends", kicker: "Coordination graph" },
  { href: "/groups", label: "Groups", kicker: "Shared rituals" },
  { href: "/settings", label: "Settings", kicker: "Signals + privacy" },
];

export const statCards = [
  { label: "AI shortlist", value: "05", detail: "nearby windows ranked for tonight" },
  { label: "Calendar overlap", value: "18h", detail: "usable free time across your circles" },
  { label: "Live location pulse", value: "04", detail: "friends broadcasting current area" },
];

export const suggestions: Suggestion[] = [
  {
    id: "gym-alex",
    title: "Gym sprint with Alex",
    activity: "Gym",
    reason: "Claude found a low-friction slot because both of you leave campus by 5:40 and tend to train on weekdays.",
    time: "Today · 6:00 PM",
    duration: "60 min",
    location: "Campus Rec Center",
    participants: [
      { name: "You", initials: "YO", accent: "warm" },
      { name: "Alex", initials: "AL", accent: "cool" },
    ],
    compatibility: "Routine match 92%",
    distance: "0.4 mi apart",
  },
  {
    id: "study-trio",
    title: "Linear algebra cram block",
    activity: "Study",
    reason: "Three calendars open after lab, plus the library is within walking distance for all participants.",
    time: "Tonight · 7:30 PM",
    duration: "90 min",
    location: "North Library Booth 12",
    participants: [
      { name: "You", initials: "YO", accent: "warm" },
      { name: "Maya", initials: "MY", accent: "gold" },
      { name: "Noah", initials: "NH", accent: "cool" },
    ],
    compatibility: "Group fit 88%",
    distance: "Campus core",
  },
  {
    id: "coffee-aria",
    title: "Coffee reset with Aria",
    activity: "Coffee",
    reason: "You both have a 45 minute gap before evening plans and usually accept short weekday meetups.",
    time: "Tomorrow · 3:15 PM",
    duration: "45 min",
    location: "Daybreak Cafe",
    participants: [
      { name: "You", initials: "YO", accent: "warm" },
      { name: "Aria", initials: "AR", accent: "gold" },
    ],
    compatibility: "Short-form habit 81%",
    distance: "0.2 mi apart",
  },
];

export const friendRows = [
  {
    name: "Alex Rivera",
    status: "Live nearby",
    note: "Usually free after weights class. Prefers gym and coffee.",
    overlap: "4 shared windows",
    mode: "Warm lead",
  },
  {
    name: "Maya Chen",
    status: "Study group anchor",
    note: "Heavy lab schedule, but open after 7 PM on Tuesdays and Thursdays.",
    overlap: "3 shared windows",
    mode: "Reliable night slot",
  },
  {
    name: "Jordan Ellis",
    status: "Pending request",
    note: "Roommate-adjacent social graph. Good candidate for lunch and hangouts.",
    overlap: "Request pending",
    mode: "Needs approval",
  },
];

export const groups = [
  {
    name: "Night Shift Gym",
    members: "4 members",
    pattern: "Weekdays around 6 PM",
    detail: "Weighted toward quick gym meetups within 15 minutes of campus.",
  },
  {
    name: "Signals Study Pod",
    members: "3 members",
    pattern: "Tue/Thu 7:30 PM",
    detail: "Claude boosts suggestions when two or more members are already near the library.",
  },
  {
    name: "Sunday Loose Brunch",
    members: "5 members",
    pattern: "Flexible weekend mornings",
    detail: "Great for food and hangout suggestions with low location strictness.",
  },
];

export const settingsPanels = [
  {
    title: "Calendar Sync",
    body: "Google Calendar is connected. Crossroads is reading the next 14 days and the last month for recurring patterns.",
    value: "Healthy",
  },
  {
    title: "Location Pulse",
    body: "Live location updates every few minutes while the app is open. Manual check-in remains available anytime.",
    value: "Opted in",
  },
  {
    title: "Suggestion Engine",
    body: "Claude ranks the final shortlist after deterministic filtering on overlap, proximity, and group fit.",
    value: "Structured JSON",
  },
];

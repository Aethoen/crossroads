import { AsyncLocalStorage } from "node:async_hooks";
import { DEMO_USER_ID } from "@/lib/constants";
import { createDemoState } from "@/lib/demo-data";
import type { CalendarEvent, DemoState, UserLocation, UserProfile } from "@/lib/types";

const stateScope = new AsyncLocalStorage<string | undefined>();

type ScopedOverrides = {
  userId: string;
  profile?: Partial<UserProfile>;
  calendarEvents?: CalendarEvent[];
  locations?: UserLocation[];
};

declare global {
  var __crossroadsDemoState: DemoState | undefined;
  var __crossroadsScopedDemoStates: Map<string, DemoState> | undefined;
}

function deepReplaceIds<T>(value: T, from: string, to: string): T {
  if (typeof value === "string") {
    return (value === from ? to : value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => deepReplaceIds(entry, from, to)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, deepReplaceIds(entry, from, to)]),
    ) as T;
  }

  return value;
}

function getScopedStateMap() {
  if (!globalThis.__crossroadsScopedDemoStates) {
    globalThis.__crossroadsScopedDemoStates = new Map();
  }
  return globalThis.__crossroadsScopedDemoStates;
}

export function getDemoState(): DemoState {
  const scopedUserId = stateScope.getStore();
  if (scopedUserId) {
    const scoped = getScopedStateMap().get(scopedUserId);
    if (scoped) {
      return scoped;
    }
  }

  if (!globalThis.__crossroadsDemoState) {
    globalThis.__crossroadsDemoState = createDemoState();
  }
  return globalThis.__crossroadsDemoState;
}

export function updateDemoState(mutator: (state: DemoState) => void): DemoState {
  const state = getDemoState();
  mutator(state);
  return state;
}

function ensureScopedDemoState({ userId, profile, calendarEvents, locations }: ScopedOverrides) {
  const stateMap = getScopedStateMap();
  let state = stateMap.get(userId);

  if (!state) {
    state = deepReplaceIds(createDemoState(), DEMO_USER_ID, userId);
    stateMap.set(userId, state);
  }

  const currentUser = state.users.find((user) => user.id === userId);
  if (currentUser && profile) {
    Object.assign(currentUser, profile, {
      avatarUrl: profile.avatarUrl ?? currentUser.avatarUrl ?? profile.avatar,
      avatar: profile.avatar ?? currentUser.avatar,
    });
  }

  if (calendarEvents) {
    state.calendarEvents = [
      ...calendarEvents,
      ...state.calendarEvents.filter((event) => event.userId !== userId),
    ];
    if (currentUser) {
      currentUser.calendarConnected = calendarEvents.length > 0;
    }
  }

  if (locations) {
    state.locations = [
      ...locations,
      ...state.locations.filter((location) => location.userId !== userId),
    ];
  }
}

export async function runWithScopedDemoState<T>(
  overrides: ScopedOverrides,
  callback: () => Promise<T>,
) {
  ensureScopedDemoState(overrides);
  return stateScope.run(overrides.userId, callback);
}

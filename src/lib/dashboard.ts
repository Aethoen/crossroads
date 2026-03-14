import { DEMO_USER_ID } from "@/lib/constants";
import {
  generateMeetupSuggestions,
  getSuggestionsForUser,
  listFriends,
  listRecentMeetups,
  listRoutinesForUser,
} from "@/lib/matching";
import type { DashboardSnapshot } from "@/lib/types";
import { getCurrentDemoState, runForViewer } from "@/lib/viewer";

export async function getDashboardSnapshot(userId = DEMO_USER_ID): Promise<DashboardSnapshot> {
  return runForViewer(async (viewer) => {
    const resolvedUserId = viewer.mode === "auth" ? viewer.userId : userId;
    const state = getCurrentDemoState();
    const currentUser = state.users.find((user) => user.id === resolvedUserId);

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    const [suggestions] = await Promise.all([getSuggestionsForUser(resolvedUserId)]);
    const friends = listFriends(resolvedUserId);
    const groupIds = new Set(
      state.groupMembers
        .filter((member) => member.userId === resolvedUserId)
        .map((member) => member.groupId),
    );

    return {
      currentUser,
      users: [currentUser, ...friends],
      friendships: state.friendships,
      groups: state.groups.filter((group) => groupIds.has(group.id)),
      groupMembers: state.groupMembers.filter((member) => groupIds.has(member.groupId)),
      locations: state.locations,
      routines: listRoutinesForUser(resolvedUserId),
      memoryCards: state.memoryCards.filter(
        (card) => card.ownerId === resolvedUserId || (card.participantIds ?? []).includes(resolvedUserId),
      ),
      suggestions,
      meetups: listRecentMeetups(resolvedUserId),
    };
  });
}

export async function refreshDashboardSuggestions(userId = DEMO_USER_ID) {
  return runForViewer(async (viewer) => {
    const resolvedUserId = viewer.mode === "auth" ? viewer.userId : userId;
    return generateMeetupSuggestions(resolvedUserId);
  });
}

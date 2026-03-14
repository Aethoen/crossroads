import { FriendsView } from "@/components/friends/friends-view";
import { getDashboardSnapshot } from "@/lib/dashboard";

export default async function FriendsPage() {
  const snapshot = await getDashboardSnapshot();

  return <FriendsView snapshot={snapshot} />;
}

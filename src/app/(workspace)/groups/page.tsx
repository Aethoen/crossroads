import { GroupsView } from "@/components/groups/groups-view";
import { getDashboardSnapshot } from "@/lib/dashboard";

export default async function GroupsPage() {
  const snapshot = await getDashboardSnapshot();

  return <GroupsView snapshot={snapshot} />;
}

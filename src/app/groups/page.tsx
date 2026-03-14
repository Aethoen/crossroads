"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { GroupList } from "@/components/groups/GroupList";
import { CreateGroupDialog } from "@/components/groups/CreateGroupDialog";
import { GroupWithMembers } from "@/types";
import { useSession } from "next-auth/react";

export default function GroupsPage() {
  const { data: session } = useSession();
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = useCallback(async () => {
    const res = await fetch("/api/groups");
    if (res.ok) setGroups(await res.json());
  }, []);

  useEffect(() => {
    loadGroups().finally(() => setLoading(false));
  }, [loadGroups]);

  async function handleCreate(name: string, type: string) {
    await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type }),
    });
    await loadGroups();
  }

  async function handleAddMember(groupId: string, email: string) {
    await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    await loadGroups();
  }

  async function handleRemoveMember(groupId: string, userId: string) {
    await fetch(`/api/groups/${groupId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await loadGroups();
  }

  async function handleDeleteGroup(groupId: string) {
    await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    await loadGroups();
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Groups</h1>
            <p className="text-muted-foreground mt-1">
              Coordinate with multiple friends at once.
            </p>
          </div>
          <CreateGroupDialog onCreate={handleCreate} />
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <GroupList
            groups={groups}
            currentUserId={session?.user?.id ?? ""}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onDeleteGroup={handleDeleteGroup}
          />
        )}
      </div>
    </AppShell>
  );
}

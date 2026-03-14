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
    if (res.ok) {
      return (await res.json()) as GroupWithMembers[];
    }
    return null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const data = await loadGroups();
      if (!cancelled && data) {
        setGroups(data);
      }
      if (!cancelled) {
        setLoading(false);
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [loadGroups]);

  async function refreshGroups() {
    setLoading(true);
    const data = await loadGroups();
    if (data) {
      setGroups(data);
    }
    setLoading(false);
  }

  async function handleCreate(name: string, type: string) {
    await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type }),
    });
    await refreshGroups();
  }

  async function handleAddMember(groupId: string, email: string) {
    await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    await refreshGroups();
  }

  async function handleRemoveMember(groupId: string, userId: string) {
    await fetch(`/api/groups/${groupId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await refreshGroups();
  }

  async function handleDeleteGroup(groupId: string) {
    await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    await refreshGroups();
  }

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="paper-note inline-flex w-fit px-4 py-2 text-lg">Crew board</p>
            <h1 className="mt-4 text-4xl font-bold">Groups</h1>
            <p className="mt-2 text-xl text-muted-foreground">
              Coordinate with multiple friends at once.
            </p>
          </div>
          <CreateGroupDialog onCreate={handleCreate} />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="paper-panel-soft h-24 animate-pulse" />
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

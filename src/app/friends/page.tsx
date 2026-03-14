"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { FriendList } from "@/components/friends/FriendList";
import { AddFriendDialog } from "@/components/friends/AddFriendDialog";
import { FriendWithProfile } from "@/types";
import { useSession } from "next-auth/react";

export default function FriendsPage() {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFriends = useCallback(async () => {
    const res = await fetch("/api/friends");
    if (res.ok) {
      return (await res.json()) as FriendWithProfile[];
    }
    return null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const data = await loadFriends();
      if (!cancelled && data) {
        setFriends(data);
      }
      if (!cancelled) {
        setLoading(false);
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [loadFriends]);

  async function refreshFriends() {
    setLoading(true);
    const data = await loadFriends();
    if (data) {
      setFriends(data);
    }
    setLoading(false);
  }

  async function handleAdd(email: string) {
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to send request");
    }
    await refreshFriends();
  }

  async function handleAccept(id: string) {
    await fetch(`/api/friends/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACCEPTED" }),
    });
    await refreshFriends();
  }

  async function handleDecline(id: string) {
    await fetch(`/api/friends/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DECLINED" }),
    });
    await refreshFriends();
  }

  async function handleRemove(id: string) {
    await fetch(`/api/friends/${id}`, { method: "DELETE" });
    await refreshFriends();
  }

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="paper-note inline-flex w-fit px-4 py-2 text-lg">People board</p>
            <h1 className="mt-4 text-4xl font-bold">Friends</h1>
            <p className="mt-2 text-xl text-muted-foreground">
              Connect with friends to start coordinating.
            </p>
          </div>
          <AddFriendDialog onAdd={handleAdd} />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="paper-panel-soft h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <FriendList
            friends={friends}
            currentUserId={session?.user?.id ?? ""}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onRemove={handleRemove}
          />
        )}
      </div>
    </AppShell>
  );
}

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
    if (res.ok) setFriends(await res.json());
  }, []);

  useEffect(() => {
    loadFriends().finally(() => setLoading(false));
  }, [loadFriends]);

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
    await loadFriends();
  }

  async function handleAccept(id: string) {
    await fetch(`/api/friends/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACCEPTED" }),
    });
    await loadFriends();
  }

  async function handleDecline(id: string) {
    await fetch(`/api/friends/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DECLINED" }),
    });
    await loadFriends();
  }

  async function handleRemove(id: string) {
    await fetch(`/api/friends/${id}`, { method: "DELETE" });
    await loadFriends();
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Friends</h1>
            <p className="text-muted-foreground mt-1">
              Connect with friends to start coordinating.
            </p>
          </div>
          <AddFriendDialog onAdd={handleAdd} />
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
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

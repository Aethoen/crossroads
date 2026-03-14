"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { FriendWithProfile } from "@/types";

interface FriendListProps {
  friends: FriendWithProfile[];
  currentUserId: string;
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export function FriendList({
  friends,
  currentUserId,
  onAccept,
  onDecline,
  onRemove,
}: FriendListProps) {
  const accepted = friends.filter((f) => f.status === "ACCEPTED");
  const pending = friends.filter(
    (f) => f.status === "PENDING" && f.requesterId !== currentUserId
  );
  const sent = friends.filter(
    (f) => f.status === "PENDING" && f.requesterId === currentUserId
  );

  function FriendItem({ f, actions }: { f: FriendWithProfile; actions?: React.ReactNode }) {
    return (
      <Card className="transition-transform duration-100 hover:rotate-[0.5deg]">
        <CardContent className="flex flex-col justify-between gap-4 px-4 py-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11">
              <AvatarImage src={f.friend.image ?? ""} />
              <AvatarFallback>
                {f.friend.name?.slice(0, 2).toUpperCase() ?? "??"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="section-title text-2xl">{f.friend.name ?? f.friend.email}</p>
              <p className="text-base text-muted-foreground">{f.friend.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto">{actions}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="space-y-2">
          <h3 className="section-title text-2xl text-muted-foreground">
            Pending Requests
          </h3>
          {pending.map((f) => (
            <FriendItem
              key={f.id}
              f={f}
              actions={
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAccept(f.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDecline(f.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              }
            />
          ))}
        </div>
      )}

      {sent.length > 0 && (
        <div className="space-y-2">
          <h3 className="section-title text-2xl text-muted-foreground">
            Sent
          </h3>
          {sent.map((f) => (
            <FriendItem
              key={f.id}
              f={f}
              actions={
                <Badge variant="secondary">Pending</Badge>
              }
            />
          ))}
        </div>
      )}

      {accepted.length > 0 && (
        <div className="space-y-2">
          <h3 className="section-title text-2xl text-muted-foreground">
            Friends
          </h3>
          {accepted.map((f) => (
            <FriendItem
              key={f.id}
              f={f}
              actions={
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onRemove(f.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              }
            />
          ))}
        </div>
      )}

      {friends.length === 0 && (
        <p className="paper-panel-soft px-4 py-8 text-center text-lg text-muted-foreground">
          No friends yet. Add some to get started!
        </p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, UserPlus, Trash2 } from "lucide-react";
import { GroupWithMembers } from "@/types";
import { Label } from "@/components/ui/label";

interface GroupListProps {
  groups: GroupWithMembers[];
  currentUserId: string;
  onAddMember: (groupId: string, email: string) => Promise<void>;
  onRemoveMember: (groupId: string, userId: string) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
}

export function GroupList({
  groups,
  currentUserId,
  onAddMember,
  onRemoveMember,
  onDeleteGroup,
}: GroupListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [addEmail, setAddEmail] = useState<Record<string, string>>({});

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (groups.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No groups yet. Create one to coordinate with multiple friends!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const isOwner = g.members.some(
          (m) => m.user.id === currentUserId && m.role === "OWNER"
        );
        const isExpanded = expanded.has(g.id);

        return (
          <Card key={g.id}>
            <CardHeader
              className="cursor-pointer py-3"
              onClick={() => toggleExpand(g.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{g.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {g.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {g.members.length} member{g.members.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0 space-y-3">
                <div className="space-y-2">
                  {g.members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={m.user.image ?? ""} />
                          <AvatarFallback className="text-xs">
                            {m.user.name?.slice(0, 2).toUpperCase() ?? "??"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {m.user.name ?? m.user.email}
                        </span>
                        {m.role === "OWNER" && (
                          <Badge variant="outline" className="text-xs">
                            Owner
                          </Badge>
                        )}
                      </div>
                      {isOwner && m.user.id !== currentUserId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onRemoveMember(g.id, m.user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {isOwner && (
                  <div className="flex gap-2 pt-2 border-t">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Add member by email</Label>
                      <input
                        value={addEmail[g.id] ?? ""}
                        onChange={(e) =>
                          setAddEmail((prev) => ({
                            ...prev,
                            [g.id]: e.target.value,
                          }))
                        }
                        placeholder="friend@example.com"
                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="flex items-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (addEmail[g.id]) {
                            onAddMember(g.id, addEmail[g.id]).then(() =>
                              setAddEmail((prev) => ({ ...prev, [g.id]: "" }))
                            );
                          }
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDeleteGroup(g.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (groups.length === 0) {
    return (
      <p className="paper-panel-soft px-4 py-8 text-center text-lg text-muted-foreground">
        No groups yet. Create one to coordinate with multiple friends!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => {
        const isOwner = g.members.some(
          (m) => m.user.id === currentUserId && m.role === "OWNER"
        );
        const isExpanded = expanded.has(g.id);

        return (
          <Card key={g.id} className={isExpanded ? "rotate-[0.4deg]" : "-rotate-[0.3deg]"}>
            <CardHeader
              className="cursor-pointer py-4"
              onClick={() => toggleExpand(g.id)}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-2xl">{g.name}</CardTitle>
                  <Badge variant="secondary">
                    {g.type}
                  </Badge>
                  <span className="text-base text-muted-foreground">
                    {g.members.length} member{g.members.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="space-y-4 pt-0">
                <div className="space-y-2">
                  {g.members.map((m) => (
                    <div
                      key={m.id}
                      className="paper-panel-soft flex flex-col gap-3 px-3 py-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={m.user.image ?? ""} />
                          <AvatarFallback className="text-sm">
                            {m.user.name?.slice(0, 2).toUpperCase() ?? "??"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-lg">
                          {m.user.name ?? m.user.email}
                        </span>
                        {m.role === "OWNER" && (
                          <Badge variant="outline">
                            Owner
                          </Badge>
                        )}
                      </div>
                      {isOwner && m.user.id !== currentUserId && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onRemoveMember(g.id, m.user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {isOwner && (
                  <div className="sketch-divider flex flex-col gap-3 pt-4 md:flex-row">
                    <div className="flex-1 space-y-1">
                      <Label>Add member by email</Label>
                      <Input
                        value={addEmail[g.id] ?? ""}
                        onChange={(e) =>
                          setAddEmail((prev) => ({
                            ...prev,
                            [g.id]: e.target.value,
                          }))
                        }
                        placeholder="friend@example.com"
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
                        <UserPlus className="h-4 w-4" strokeWidth={2.5} />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
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

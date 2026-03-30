"use client";

import { useState, useTransition } from "react";
import { Role }                    from "@prisma/client";
import { toast }                   from "sonner";
import { Button } from "@/components/ui/button";
import { Badge }  from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  addUserToSecret, removeUserFromSecret,
  addUserToNote,   removeUserFromNote,
} from "@/app/actions/sharing";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AccessUser = { id: string; name: string | null; email: string | null };

type AllUser = AccessUser & { role: Role };

interface Props {
  type:          "secret" | "note";
  resourceId:    string;
  resourceName:  string;
  currentAccess: AccessUser[];
  allUsers:      AllUser[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ManageAccessDialog({
  type,
  resourceId,
  resourceName,
  currentAccess,
  allUsers,
}: Props) {
  const [open,   setOpen]   = useState(false);
  const [access, setAccess] = useState<AccessUser[]>(currentAccess);
  const [isPending, startTransition] = useTransition();

  const available = allUsers.filter((u) => !access.some((a) => a.id === u.id));

  const handleAdd = (userId: string | null) => {
    if (userId == null) return;
    const user = allUsers.find((u) => u.id === userId);
    if (!user) return;

    // Optimistic
    setAccess((prev) => [...prev, user]);

    startTransition(async () => {
      const result = type === "secret"
        ? await addUserToSecret(resourceId, userId)
        : await addUserToNote(resourceId, userId);

      if (!result.success) {
        setAccess((prev) => prev.filter((u) => u.id !== userId));
        toast.error(result.error);
      } else {
        toast.success(`Access granted to ${user.name ?? user.email}.`);
      }
    });
  };

  const handleRemove = (userId: string) => {
    const user = access.find((u) => u.id === userId);

    // Optimistic
    setAccess((prev) => prev.filter((u) => u.id !== userId));

    startTransition(async () => {
      const result = type === "secret"
        ? await removeUserFromSecret(resourceId, userId)
        : await removeUserFromNote(resourceId, userId);

      if (!result.success) {
        if (user) setAccess((prev) => [...prev, user]);
        toast.error(result.error);
      } else {
        toast.success(`Access removed.`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label="Manage access"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
              <circle cx="6" cy="5"  r="2.5" stroke="currentColor" strokeWidth="1.25" />
              <path d="M1 13c0-2.761 2.239-4 5-4s5 1.239 5 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
              <path d="M11.5 8v4M9.5 10h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
            </svg>
          </Button>
        }
      />

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="truncate">Access — {resourceName}</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {/* Current access list */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Shared with ({access.length})
            </p>
            {access.length === 0 ? (
              <p className="text-sm text-muted-foreground">No individual users added yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {access.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{u.name ?? "Unnamed"}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(u.id)}
                      disabled={isPending}
                    >
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                        <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add user */}
          {available.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Add user
              </p>
              <Select onValueChange={handleAdd} disabled={isPending}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a user…" />
                </SelectTrigger>
                <SelectContent>
                  {available.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <span className="flex items-center gap-2">
                        <span>{u.name ?? u.email}</span>
                        <Badge variant="outline" className="text-[10px] py-0">
                          {u.role}
                        </Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Note: Moderators and above already have access by role.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

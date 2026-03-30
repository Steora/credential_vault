"use client";

import { useState, useTransition } from "react";
import { useRouter }               from "next/navigation";
import { Role }                    from "@prisma/client";
import { toast }                   from "sonner";
import { Badge }  from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateUserRole, deactivateUser, reactivateUser } from "@/app/actions/users";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserRow {
  id:        string;
  name:      string | null;
  email:     string | null;
  role:      Role;
  isActive:  boolean;
  createdAt: string;
}

interface Props {
  users:           UserRow[];
  currentUserId:   string;
  currentUserRole: Role;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROLE_RANK: Record<Role, number> = {
  INTERN: 0, USER: 1, MODERATOR: 2, ADMIN: 3, SUPERADMIN: 4,
};

const ROLE_BADGE: Record<Role, "default" | "secondary" | "outline" | "destructive"> = {
  SUPERADMIN: "destructive",
  ADMIN:      "default",
  MODERATOR:  "secondary",
  USER:       "outline",
  INTERN:     "outline",
};

const ALL_ROLES: Role[] = [Role.INTERN, Role.USER, Role.MODERATOR, Role.ADMIN, Role.SUPERADMIN];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Row component
// ---------------------------------------------------------------------------

function UserTableRow({
  user,
  currentUserId,
  currentUserRole,
}: {
  user:            UserRow;
  currentUserId:   string;
  currentUserRole: Role;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isSelf         = user.id === currentUserId;
  const actorRank      = ROLE_RANK[currentUserRole];
  const targetRank     = ROLE_RANK[user.role];
  const canModify      = !isSelf && actorRank > targetRank;
  const canToggleActive = canModify;

  // Roles the current actor can assign to this user
  const assignableRoles = ALL_ROLES.filter((r) => {
    if (currentUserRole === Role.SUPERADMIN) return r !== user.role; // SUPERADMIN can assign any role
    return ROLE_RANK[r] < actorRank && r !== user.role;
  });

  const handleRoleChange = (newRole: Role) => {
    startTransition(async () => {
      const result = await updateUserRole(user.id, newRole);
      if (result.success) {
        toast.success(`Role updated to ${newRole}.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDeactivate = () => {
    startTransition(async () => {
      const result = await deactivateUser(user.id);
      if (result.success) {
        toast.success(`"${user.name ?? user.email}" has been deactivated.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleReactivate = () => {
    startTransition(async () => {
      const result = await reactivateUser(user.id);
      if (result.success) {
        toast.success(`"${user.name ?? user.email}" has been reactivated.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <TableRow className={!user.isActive ? "opacity-60" : isSelf ? "bg-muted/30" : undefined}>
      <TableCell>
        <div>
          <p className="font-medium leading-tight">{user.name ?? <span className="italic text-muted-foreground">Unnamed</span>}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
        </div>
      </TableCell>

      <TableCell>
        <Badge variant={ROLE_BADGE[user.role]} className="text-xs">
          {user.role}
        </Badge>
      </TableCell>

      <TableCell>
        <Badge
          variant={user.isActive ? "outline" : "secondary"}
          className={`text-xs ${user.isActive ? "text-green-600 border-green-500" : "text-muted-foreground"}`}
        >
          {user.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>

      <TableCell className="text-sm text-muted-foreground">
        {formatDate(user.createdAt)}
      </TableCell>

      <TableCell className="text-right">
        {isSelf ? (
          <span className="text-xs text-muted-foreground">(you)</span>
        ) : (
          <div className="flex items-center justify-end gap-1">
            {/* Role selector — only shown for active users */}
            {canModify && user.isActive && assignableRoles.length > 0 && (
              <Select
                value={user.role}
                onValueChange={(v) => handleRoleChange(v as Role)}
                disabled={isPending}
              >
                <SelectTrigger className="h-7 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Deactivate */}
            {canToggleActive && user.isActive && (
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      disabled={isPending}
                      aria-label="Deactivate user"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.25" />
                        <path d="M5 8h6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                      </svg>
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deactivate {user.name ?? user.email}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      The account will be suspended immediately. Their data is preserved and the account can be reactivated at any time.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeactivate}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Deactivate
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Reactivate */}
            {canToggleActive && !user.isActive && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-green-600"
                disabled={isPending}
                onClick={handleReactivate}
              >
                Reactivate
              </Button>
            )}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function UserManagement({ users, currentUserId, currentUserRole }: Props) {
  const [search, setSearch] = useState("");

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Filter by name, email, or role…"
        className="w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => (
                <UserTableRow
                  key={u.id}
                  user={u}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        {users.filter((u) => u.isActive).length} active · {users.length} total
      </p>
    </div>
  );
}

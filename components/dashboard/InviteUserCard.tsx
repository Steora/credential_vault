"use client";

import { useActionState, useEffect, useRef } from "react";
import { Role } from "@prisma/client";
import { toast } from "sonner";

import { inviteUser, type InviteUserResult } from "@/app/actions/invitations";
import { getInviteAssignableRoles } from "@/lib/invite-roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function InviteUserCard({ currentUserRole }: { currentUserRole: Role }) {
  const assignable = getInviteAssignableRoles(currentUserRole);
  const [state, formAction, isPending] = useActionState<InviteUserResult | null, FormData>(
    inviteUser,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Invitation sent. The user will receive an email with a link to join.");
      formRef.current?.reset();
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state]);

  if (assignable.length === 0) return null;

  const defaultRole = assignable.includes(Role.USER) ? Role.USER : assignable[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Invite user</CardTitle>
        <CardDescription>
          Send an email invitation. They choose a name and password when they accept. Invites expire after 7 days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              autoComplete="off"
              placeholder="colleague@company.com"
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5 w-full sm:w-44">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              name="role"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue={defaultRole}
              disabled={isPending}
              required
            >
              {assignable.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending ? "Sending…" : "Send invitation"}
          </Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          Email is sent from <span className="font-mono text-[11px]">mitra.b.mukherjee@steorasystems.com</span>{" "}
          (configure SMTP in production).
        </p>
      </CardContent>
    </Card>
  );
}

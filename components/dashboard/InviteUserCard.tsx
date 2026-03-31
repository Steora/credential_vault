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
    <Card className="bg-white/40 backdrop-blur-md border-white/40 shadow-xl rounded-[2rem] overflow-hidden group">
      <CardHeader className="pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0c1421] text-white rounded-xl shadow-lg ring-4 ring-[#0c1421]/5">
            <UserPlus className="size-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-black text-[#0c1421] uppercase tracking-tight">Invite User</CardTitle>
            <CardDescription className="text-slate-500 font-medium tracking-tight">
              Initialize a new User profile. Invitations expire after 168h.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-8">
        <form ref={formRef} action={formAction} className="flex flex-col gap-6 lg:flex-row lg:items-end">
          <div className="space-y-2 flex-grow">
            <Label htmlFor="invite-email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Email Endpoint</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              autoComplete="off"
              placeholder="colleague@company.com"
              className="bg-white/40 border-white/20 backdrop-blur-md h-12 rounded-xl focus-visible:ring-blue-500/30 placeholder:text-slate-400 font-medium"
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2 w-full lg:w-48">
            <Label htmlFor="invite-role" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</Label>
            <select
              id="invite-role"
              name="role"
              className="flex h-12 w-full rounded-xl border border-white/20 bg-white/40 px-4 py-2 text-sm shadow-sm focus-visible:outline-none focus:ring-2 focus:ring-blue-500/20 backdrop-blur-md font-bold text-[#0c1421]"
              defaultValue={defaultRole}
              disabled={isPending}
              required
            >
              {assignable.map((r) => (
                <option key={r} value={r} className="bg-white">
                  {r}
                </option>
              ))}
            </select>
          </div>
          <Button 
            type="submit" 
            disabled={isPending} 
            className="h-12 px-8 bg-[#0c1421] hover:bg-[#1a2b45] text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
          >
            {isPending ? "Syncing..." : "Invite User"}
          </Button>
        </form>
        <div className="mt-8 flex items-center gap-2 group-hover:opacity-100 transition-opacity">
          <div className="size-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Outbound: <span className="text-[#0c1421] font-black">mitra.b.mukherjee@steorasystems.com</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
import { UserPlus } from "lucide-react";

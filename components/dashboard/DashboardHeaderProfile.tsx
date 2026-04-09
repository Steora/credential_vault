"use client";

import { Role } from "@prisma/client";

import UserAvatar from "@/components/dashboard/UserAvatar";

const ROLE_LABEL: Record<Role, string> = {
  [Role.SUPERADMIN]: "Superadmin",
  [Role.ADMIN]:      "Admin",
  [Role.MODERATOR]:  "Moderator",
  [Role.USER]:       "User",
  [Role.INTERN]:     "Intern",
};

const chromaText =
  "[text-shadow:-0.45px_0_0_rgba(248,113,113,0.75),0.45px_0_0_rgba(96,165,250,0.75)]";

export type HeaderProfileUser = {
  name:  string | null | undefined;
  email: string | null | undefined;
  role:  Role;
  image: string | null | undefined;
};

export default function DashboardHeaderProfile({ user }: { user: HeaderProfileUser }) {
  const displayName = user.name?.trim() || "User";

  return (
    <div className="flex items-center justify-end gap-4">
      <div className="hidden min-w-0 text-right sm:block">
        <p
          className={`text-sm font-bold leading-snug text-[#0c1421] tracking-tight ${chromaText}`}
        >
          {displayName}
        </p>
        <p
          className={`mt-0.5 text-xs font-medium text-[#0c1421]/55 ${chromaText}`}
        >
          {ROLE_LABEL[user.role]}
        </p>
      </div>
      <UserAvatar
        image={user.image}
        name={user.name}
        email={user.email}
        size="lg"
        className="h-11 w-11 ring-2 ring-[#0c1421]/10 shadow-md text-sm"
      />
    </div>
  );
}

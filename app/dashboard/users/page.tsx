import { redirect } from "next/navigation";
import { Role }      from "@prisma/client";
import { auth }      from "@/auth";
import { prisma }    from "@/lib/prisma";
import { vaultWhereActive } from "@/lib/vault-entity-status";
import InviteUserCard from "@/components/dashboard/InviteUserCard";
import UserManagement, { type UserRow } from "@/components/dashboard/UserManagement";

const ADMIN_ROLES = new Set<Role>([Role.ADMIN, Role.SUPERADMIN]);

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) return null;

  // Only ADMINs and SUPERADMINs can access this page
  if (!ADMIN_ROLES.has(session.user.role)) {
    redirect("/dashboard/projects");
  }

  const rawUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: [{ isActive: "desc" }, { role: "asc" }, { name: "asc" }],
  });

  const memberRows = await prisma.projectMember.findMany({
    where: { project: { is: vaultWhereActive } },
    select: {
      userId: true,
      project: {
        select: {
          id:       true,
          name:     true,
          parentId: true,
          parent:   { select: { id: true, name: true } },
        },
      },
    },
  });

  const assignedByUser = new Map<string, UserRow["assignedProjects"]>();
  for (const row of memberRows) {
    const list = assignedByUser.get(row.userId) ?? [];
    list.push(row.project);
    assignedByUser.set(row.userId, list);
  }

  const users: UserRow[] = rawUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    assignedProjects: assignedByUser.get(u.id) ?? [],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite new users by email or manage roles and access for everyone who already has an account.
        </p>
      </div>

      <InviteUserCard currentUserRole={session.user.role} />

      <UserManagement
        users={users}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
      />
    </div>
  );
}

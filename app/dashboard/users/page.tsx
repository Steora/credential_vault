import { redirect } from "next/navigation";
import { Role }      from "@prisma/client";
import { auth }      from "@/auth";
import { prisma }    from "@/lib/prisma";
import UserManagement, { type UserRow } from "@/components/dashboard/UserManagement";

const ADMIN_ROLES = new Set<Role>([Role.ADMIN, Role.SUPERADMIN]);

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) return null;

  // Only ADMINs and SUPERADMINs can access this page
  if (!ADMIN_ROLES.has(session.user.role)) {
    redirect("/dashboard");
  }

  const rawUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: [{ isActive: "desc" }, { role: "asc" }, { name: "asc" }],
  });

  const users: UserRow[] = rawUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage roles and access for all registered users.
        </p>
      </div>

      <UserManagement
        users={users}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
      />
    </div>
  );
}

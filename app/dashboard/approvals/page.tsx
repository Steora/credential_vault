import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { listPendingApprovals } from "@/app/actions/pending-approvals";
import PendingApprovalsClient from "@/components/dashboard/PendingApprovalsClient";

const APPROVERS = new Set<Role>([Role.ADMIN, Role.SUPERADMIN]);

export default async function ApprovalsPage() {
  const session = await auth();
  if (!session?.user) return null;

  if (!APPROVERS.has(session.user.role)) {
    redirect("/dashboard/projects");
  }

  const data = await listPendingApprovals();
  if ("error" in data) {
    redirect("/dashboard/projects");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review environment secret and note requests submitted by users before they appear in the vault.
        </p>
      </div>

      <PendingApprovalsClient initial={data} />
    </div>
  );
}

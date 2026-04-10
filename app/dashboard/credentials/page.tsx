import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { canUserPerformAction } from "@/lib/permissions";
import {
  listCredentialSections,
} from "@/lib/queries/credentials";
import {
  parseVaultStatusParam,
  VAULT_ENTITY_STATUS,
} from "@/lib/vault-entity-status";
import { Separator } from "@/components/ui/separator";
import AddCredentialSectionDialog from "@/components/dashboard/AddCredentialSectionDialog";
import CredentialsArchivePortalLink from "@/components/dashboard/CredentialsArchivePortalLink";
import CredentialsSectionList from "@/components/dashboard/CredentialsSectionList";

export default async function CredentialsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sp = await searchParams;
  const status = parseVaultStatusParam(sp.status);
  if (status === VAULT_ENTITY_STATUS.DELETED) {
    redirect("/dashboard/credentials");
  }

  const isArchivedPortal = status === VAULT_ENTITY_STATUS.ARCHIVED;

  const actor = {
    id:       session.user.id,
    role:     session.user.role,
    isActive: session.user.isActive,
  };

  const sections = await listCredentialSections(
    actor,
    isArchivedPortal ? VAULT_ENTITY_STATUS.ARCHIVED : VAULT_ENTITY_STATUS.ACTIVE,
  );

  const canWriteSection = session.user.role !== Role.INTERN;
  const canManageAccess = canUserPerformAction(actor, null, "secret", "update");
  const canArchiveOps   = canUserPerformAction(actor, null, "secret", "delete");

  const allUsers =
    !isArchivedPortal && canManageAccess
      ? await prisma.user.findMany({
          where:   { isActive: true, id: { not: actor.id } },
          select:  { id: true, name: true, email: true, role: true },
          orderBy: { name: "asc" },
        })
      : [];

  const pageTitle = isArchivedPortal ? "Archived credentials" : "Credentials";
  const pageDescription = isArchivedPortal
    ? "Sections marked archived. Open the main Credentials list for active work."
    : "Group and manage secure logins for your team.";

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="sticky top-0 z-20 flex flex-col gap-6 bg-transparent px-2 pt-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight text-[#0c1421] drop-shadow-sm">
            {pageTitle}
          </h1>
          <p className="text-base font-medium tracking-tight text-slate-500">{pageDescription}</p>
        </div>

        <div className="flex items-center gap-4">
          {canWriteSection && !isArchivedPortal && <AddCredentialSectionDialog />}
          <CredentialsArchivePortalLink isArchivedPortal={isArchivedPortal} />
        </div>
      </div>

      <Separator />

      <CredentialsSectionList
        sections={sections}
        isArchivedPortal={isArchivedPortal}
        canManageAccess={canManageAccess}
        canArchiveOps={canArchiveOps}
        allUsers={allUsers}
        emptyMessage={isArchivedPortal ? "No archived sections." : "No credential sections yet."}
      />

      <footer className="border-t border-white/20 pt-12">
        <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Credential Vault
        </p>
      </footer>
    </div>
  );
}

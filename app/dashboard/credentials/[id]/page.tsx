import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canUserPerformAction } from "@/lib/permissions";
import { getCredentialSectionById } from "@/lib/queries/credentials";
import { VAULT_ENTITY_STATUS } from "@/lib/vault-entity-status";
import { Separator } from "@/components/ui/separator";
import ManageAccessDialog from "@/components/dashboard/ManageAccessDialog";
import CredentialArchiveSectionButton from "@/components/dashboard/CredentialArchiveSectionButton";
import CredentialUnarchiveSectionButton from "@/components/dashboard/CredentialUnarchiveSectionButton";
import AddCredentialKeyForm from "@/components/dashboard/AddCredentialKeyForm";
import AddCredentialSectionDialog from "@/components/dashboard/AddCredentialSectionDialog";
import CredentialKeyRow from "@/components/dashboard/CredentialKeyRow";
import CredentialSubsectionCard from "@/components/dashboard/CredentialSubsectionCard";

const ROLE_RANK: Record<Role, number> = {
  [Role.INTERN]:     0,
  [Role.USER]:       1,
  [Role.MODERATOR]:  2,
  [Role.ADMIN]:      3,
  [Role.SUPERADMIN]: 4,
};

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function CredentialSectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) return null;

  const actor = {
    id:       session.user.id,
    role:     session.user.role,
    isActive: session.user.isActive,
  };

  const section = await getCredentialSectionById(id, actor);
  if (!section) notFound();

  const isArchived  = section.status === VAULT_ENTITY_STATUS.ARCHIVED;
  const isSubsection = section.parent !== null;

  const canManageAccess = canUserPerformAction(actor, null, "secret", "update");
  const canAddKeys      = !isArchived && ROLE_RANK[actor.role] >= ROLE_RANK[Role.MODERATOR];
  const canEditKeys     = !isArchived && actor.role !== Role.INTERN;
  const canDeleteKeys   = !isArchived && ROLE_RANK[actor.role] >= ROLE_RANK[Role.ADMIN];
  const canArchiveOps   = canUserPerformAction(actor, null, "secret", "delete");
  // Only root sections can have subsections (no nesting beyond one level).
  const canAddSubsection = !isSubsection && !isArchived && actor.role !== Role.INTERN;

  const allUsers =
    canManageAccess && !isArchived
      ? await prisma.user.findMany({
          where:   { isActive: true, id: { not: actor.id } },
          select:  { id: true, name: true, email: true, role: true },
          orderBy: { name: "asc" },
        })
      : [];

  // Breadcrumb: subsection links back to its parent, root section links back to the list.
  const backHref = isSubsection
    ? `/dashboard/credentials/${section.parent!.id}`
    : isArchived
      ? "/dashboard/credentials?status=ARCHIVED"
      : "/dashboard/credentials";
  const backLabel = isSubsection
    ? section.parent!.name
    : isArchived ? "Archived credentials" : "Credentials";

  const createdByLabel = section.owner.name ?? section.owner.email ?? "Unknown";
  const updatedByLabel =
    section.updatedBy?.name ??
    section.updatedBy?.email ??
    (section.owner.name ?? section.owner.email ?? "Unknown");

  const activeChildren = section.children.filter(
    (c) => c.status === VAULT_ENTITY_STATUS.ACTIVE,
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-20">
      {/* ── Breadcrumb + header ── */}
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8l4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {backLabel}
        </Link>

        {/* Subsection label */}
        {isSubsection && (
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-indigo-500">
            Subsection
          </p>
        )}

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#0c1421]">{section.name}</h1>
              {isArchived && (
                <span className="rounded-md border border-muted-foreground/30 bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Archived
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {section.keys.length} key{section.keys.length !== 1 ? "s" : ""}
              {!isSubsection && activeChildren.length > 0 && (
                <> · {activeChildren.length} subsection{activeChildren.length !== 1 ? "s" : ""}</>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Created by {createdByLabel} on {formatDate(section.createdAt)}</span>
              <span>·</span>
              <span>Last modified by {updatedByLabel} on {formatDate(section.updatedAt)}</span>
            </div>
            {section.description && (
              <p className="mt-2 max-w-2xl text-sm text-slate-600">{section.description}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {canManageAccess && !isArchived && (
              <ManageAccessDialog
                type="credential_section"
                resourceId={section.id}
                resourceName={section.name}
                currentAccess={section.sharedWith}
                allUsers={allUsers}
              />
            )}
            {canArchiveOps && !isArchived && (
              <CredentialArchiveSectionButton sectionId={section.id} sectionName={section.name} />
            )}
            {canArchiveOps && isArchived && (
              <CredentialUnarchiveSectionButton sectionId={section.id} sectionName={section.name} />
            )}
          </div>
        </div>
      </div>

      <Separator />

      {section.sharedWith.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Shared with {section.sharedWith.length} user{section.sharedWith.length !== 1 ? "s" : ""}.
        </p>
      )}

      {/* ── Keys ── */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[#0c1421]">Keys</h2>
        {section.keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">No keys yet.</p>
        ) : (
          <div className="max-h-[min(70vh,36rem)] min-w-0 overflow-auto rounded-xl border border-white/40 bg-white/60 backdrop-blur-md">
            <table className="w-max min-w-full text-sm">
              <thead className="sticky top-0 z-[1] bg-white/90 backdrop-blur-sm">
                <tr className="border-b border-white/30 text-left text-[10px] uppercase tracking-widest text-slate-400">
                  <th className="whitespace-nowrap px-4 py-2 font-medium">Added by</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">Username</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">Password</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {section.keys.map((k) => (
                  <CredentialKeyRow
                    key={k.id}
                    keyId={k.id}
                    ownerLabel={k.owner.name ?? k.owner.email ?? "—"}
                    initialLabel={k.label}
                    initialValue={k.value}
                    canEdit={canEditKeys}
                    canDelete={canDeleteKeys}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {canAddKeys && (
        <AddCredentialKeyForm sectionId={section.id} />
      )}

      {/* ── Subsections (root sections only) ── */}
      {!isSubsection && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#0c1421]">
                Subsections
                {activeChildren.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({activeChildren.length})
                  </span>
                )}
              </h2>
              {canAddSubsection && (
                <AddCredentialSectionDialog parentId={section.id} />
              )}
            </div>

            {activeChildren.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subsections yet.</p>
            ) : (
              <div className="grid gap-3">
                {activeChildren.map((child) => {
                  const childOwnerLabel =
                    child.owner.name ?? child.owner.email ?? "Unknown";
                  const childUpdatedLabel =
                    child.updatedBy?.name ??
                    child.updatedBy?.email ??
                    childOwnerLabel;
                  return (
                    <CredentialSubsectionCard
                      key={child.id}
                      id={child.id}
                      name={child.name}
                      description={child.description ?? null}
                      keyCount={child._count.keys}
                      sharedWith={child.sharedWith}
                      ownerLabel={childOwnerLabel}
                      updatedLabel={childUpdatedLabel}
                      createdAt={child.createdAt}
                      updatedAt={child.updatedAt}
                      allUsers={allUsers}
                      canManageAccess={canManageAccess && !isArchived}
                      canArchive={canArchiveOps && !isArchived}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

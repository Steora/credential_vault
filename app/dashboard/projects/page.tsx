import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth }                 from "@/auth";
import { prisma }               from "@/lib/prisma";
import { canUserPerformAction } from "@/lib/permissions";
import {
  getVaultProjectIdsForActor,
  hasUnrestrictedProjectScope,
} from "@/lib/queries/access";
import {
  parseVaultStatusParam,
  VAULT_ENTITY_STATUS,
} from "@/lib/vault-entity-status";
import CreateProjectDialog   from "@/components/dashboard/CreateProjectDialog";
import ProjectGridWithSearch from "@/components/dashboard/ProjectGridWithSearch";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const sp = await searchParams;
  const status = parseVaultStatusParam(sp.status);
  if (status === VAULT_ENTITY_STATUS.DELETED) {
    redirect("/dashboard/projects");
  }
  const statusWhere = { status };

  const actor = {
    id:       session.user.id,
    role:     session.user.role,
    isActive: session.user.isActive,
  };
  const canCreate = canUserPerformAction(actor, null, "project", "create");
  const canArchive = canUserPerformAction(actor, null, "project", "delete");

  const userInternScoped =
    actor.isActive !== false &&
    (actor.role === Role.USER || actor.role === Role.INTERN);

  const moderatorScoped = actor.isActive !== false && actor.role === Role.MODERATOR;

  const moderatorProjectIds = moderatorScoped ? await getVaultProjectIdsForActor(actor) : [];

  const userInternProjectIds = userInternScoped ? await getVaultProjectIdsForActor(actor) : [];

  const projects = await prisma.project.findMany({
    where: moderatorScoped
      ? moderatorProjectIds.length > 0
        ? { id: { in: moderatorProjectIds }, ...statusWhere }
        : { id: { in: [] } }
      : userInternScoped
        ? userInternProjectIds.length > 0
          ? { id: { in: userInternProjectIds }, ...statusWhere }
          : { id: { in: [] } }
        : statusWhere,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { secrets: true, notes: true } } },
  });

  const isLiveList = status === VAULT_ENTITY_STATUS.ACTIVE;
  const canOpenArchivedProjectDetail =
    actor.role === Role.MODERATOR || hasUnrestrictedProjectScope(actor.role);
  const showProjectCardLink =
    isLiveList ||
    (status === VAULT_ENTITY_STATUS.ARCHIVED && canOpenArchivedProjectDetail);
  const pageTitle = status === VAULT_ENTITY_STATUS.ARCHIVED ? "Archived projects" : "Projects";
  const pageDescription =
    status === VAULT_ENTITY_STATUS.ACTIVE
      ? "Manage environment secrets and notes per project."
      : "Projects marked archived. Open the main Projects list for active work.";

  const byId = new Map(projects.map((p) => [p.id, p]));

  function displayPathFor(project: (typeof projects)[number]): string {
    const parts: string[] = [];
    let cur: (typeof projects)[number] | undefined = project;
    const seen = new Set<string>();
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      parts.unshift(cur.name);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    return parts.join(" -> ");
  }

  const projectRows = projects.map((p) => ({
    id:          p.id,
    name:        p.name,
    description: p.description,
    displayPath: displayPathFor(p),
    secretCount: p._count.secrets,
    noteCount:   p._count.notes,
  }));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{pageDescription}</p>
        </div>
        {canCreate && isLiveList && <CreateProjectDialog />}
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-16 text-center">
          <p className="text-sm text-muted-foreground">
            {isLiveList
              ? `No projects yet.${canCreate ? " Create one to get started." : ""}`
              : "No archived projects."}
          </p>
        </div>
      ) : (
        <ProjectGridWithSearch
          rows={projectRows}
          showProjectCardLink={showProjectCardLink}
          canArchive={canArchive}
          isLiveList={isLiveList}
        />
      )}
    </div>
  );
}

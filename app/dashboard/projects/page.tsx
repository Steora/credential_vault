import Link from "next/link";
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
import { FolderArchive } from "lucide-react";
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
    <div className="space-y-10 pb-20 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pointer-events-none sticky top-0 z-20 pt-4 bg-transparent px-2">
        <div className="space-y-1 pointer-events-auto">
          <h1 className="text-3xl font-black tracking-tight text-[#0c1421] drop-shadow-sm uppercase">{pageTitle}</h1>
          <p className="text-base text-slate-500 font-medium tracking-tight">
            {pageDescription}
          </p>
        </div>
        <div className="flex items-center gap-4 pointer-events-auto">
          {canCreate && isLiveList && <CreateProjectDialog />}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/40 backdrop-blur-md rounded-full border border-white/40 shadow-sm">
            <div className={`size-1.5 rounded-full animate-pulse ${status === VAULT_ENTITY_STATUS.ARCHIVED ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"}`} />
            <span className="text-[9px] font-black tracking-widest text-[#0c1421] uppercase">
              {status === VAULT_ENTITY_STATUS.ARCHIVED ? "Archival Sync" : "active projects"}
            </span>
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white/30 backdrop-blur-md rounded-2xl border border-white/40 p-16 text-center space-y-4 animate-in fade-in zoom-in duration-700">
          <div className="size-12 bg-slate-100 rounded-xl mx-auto flex items-center justify-center text-slate-400">
            <FolderArchive className="size-6" />
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
            {isLiveList
              ? `No active project Projects found.`
              : "Historical directory is empty."}
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

      <footer className="pt-12 border-t border-white/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-[#0c1421] uppercase tracking-[0.2em]">Project Management Terminal</p>
            <p className="text-[9px] text-slate-400">All data streams are encrypted under AES-256 protocols.</p>
          </div>
          <div className="flex items-center gap-6">
             <Link href={isLiveList ? `/dashboard/projects?status=${VAULT_ENTITY_STATUS.ARCHIVED}` : "/dashboard/projects"} className="text-[9px] font-black text-blue-500 hover:text-blue-600 uppercase tracking-widest transition-colors underline-offset-4 hover:underline">
               {isLiveList ? "Access Archived Projects" : "Switch to Primary Pipeline"}
             </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

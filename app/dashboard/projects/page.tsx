import Link from "next/link";
import { auth }                 from "@/auth";
import { prisma }               from "@/lib/prisma";
import { canUserPerformAction } from "@/lib/permissions";
import { Badge }                from "@/components/ui/badge";
import CreateProjectDialog      from "@/components/dashboard/CreateProjectDialog";
import DeleteProjectButton      from "@/components/dashboard/DeleteProjectButton";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const actor     = { id: session.user.id, role: session.user.role };
  const canCreate = canUserPerformAction(actor, null, "project", "create");
  const canDelete = canUserPerformAction(actor, null, "project", "delete");

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { secrets: true, notes: true } } },
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage environment secrets and notes per project.
          </p>
        </div>
        {canCreate && <CreateProjectDialog />}
      </div>

      {/* Project grid */}
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-16 text-center">
          <p className="text-sm text-muted-foreground">
            No projects yet.{canCreate ? " Create one to get started." : ""}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="group relative rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Clickable link covers the card */}
              <Link href={`/dashboard/projects/${p.id}`} className="absolute inset-0 rounded-xl" />

              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{p.name}</h3>
                  {p.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {p.description}
                    </p>
                  )}
                </div>

                {/* Delete button sits above the link overlay */}
                {canDelete && (
                  <div className="relative z-10 shrink-0">
                    <DeleteProjectButton projectId={p.id} projectName={p.name} />
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  {p._count.secrets} secret{p._count.secrets !== 1 ? "s" : ""}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {p._count.notes} note{p._count.notes !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import Link       from "next/link";
import { notFound } from "next/navigation";
import { auth }     from "@/auth";
import { prisma }   from "@/lib/prisma";
import { canUserPerformAction } from "@/lib/permissions";
import { getSecretsByProject }  from "@/lib/queries/secrets";
import { getNotesByProject }    from "@/lib/queries/notes";
import { Badge }             from "@/components/ui/badge";
import { Separator }         from "@/components/ui/separator";
import CopyButton            from "@/components/CopyButton";
import RevealButton          from "@/components/RevealButton";
import CopyAllSecretsButton  from "@/components/CopyAllSecretsButton";
import AddSecretDialog       from "@/components/dashboard/AddSecretDialog";
import EditSecretDialog      from "@/components/dashboard/EditSecretDialog";
import DeleteSecretButton    from "@/components/dashboard/DeleteSecretButton";
import ManageAccessDialog    from "@/components/dashboard/ManageAccessDialog";
import CopyNoteButton        from "@/components/CopyNoteButton";
import AddNoteDialog         from "@/components/dashboard/AddNoteDialog";
import EditNoteDialog        from "@/components/dashboard/EditNoteDialog";
import DeleteNoteButton      from "@/components/dashboard/DeleteNoteButton";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) return null;

  const actor   = { id: session.user.id, role: session.user.role };
  const canEdit = canUserPerformAction(actor, null, "secret", "create");

  const project = await prisma.project.findUnique({
    where:  { id },
    select: { id: true, name: true, description: true, createdAt: true },
  });
  if (!project) notFound();

  const [secrets, notes, allUsers] = await Promise.all([
    getSecretsByProject(id, actor),
    getNotesByProject(id, actor),
    prisma.user.findMany({
      where:   { isActive: true },
      select:  { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">

      {/* Breadcrumb + header */}
      <div>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Projects
        </Link>

        <h1 className="mt-2 text-2xl font-bold tracking-tight">{project.name}</h1>
        {project.description && (
          <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
        )}
      </div>

      {/* ── Secrets section ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Secrets</h2>
            <p className="text-xs text-muted-foreground">
              {secrets.length} encrypted secret{secrets.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CopyAllSecretsButton projectId={project.id} secretCount={secrets.length} />
            {canEdit && (
              <AddSecretDialog projectId={project.id} projectName={project.name} />
            )}
          </div>
        </div>

        {secrets.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No secrets yet.{canEdit ? " Add one above." : ""}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-xs text-muted-foreground">
                  <th className="py-2.5 pl-4 pr-3 text-left font-medium">Key</th>
                  <th className="py-2.5 px-3 text-left font-medium">Owner</th>
                  <th className="py-2.5 px-3 text-left font-medium">Created</th>
                  <th className="py-2.5 pl-3 pr-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {secrets.map((s) => (
                  <tr key={s.id} className="bg-card hover:bg-muted/20 transition-colors">
                    <td className="py-3 pl-4 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{s.key}</span>
                        <span className="font-mono text-xs text-muted-foreground tracking-widest select-none">
                          ••••••••
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {s.owner.name ?? s.owner.email}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {formatDate(s.createdAt)}
                    </td>
                    <td className="py-3 pl-3 pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <RevealButton secretId={s.id} secretKey={s.key} />
                        <CopyButton secretId={s.id} />
                        {canEdit && (
                          <EditSecretDialog secretId={s.id} secretKey={s.key} />
                        )}
                        {canEdit && (
                          <ManageAccessDialog
                            type="secret"
                            resourceId={s.id}
                            resourceName={s.key}
                            currentAccess={s.sharedWith}
                            allUsers={allUsers}
                          />
                        )}
                        {canEdit && (
                          <DeleteSecretButton secretId={s.id} secretKey={s.key} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Separator />

      {/* ── Notes section ───────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Notes</h2>
            <p className="text-xs text-muted-foreground">
              {notes.length} note{notes.length !== 1 ? "s" : ""} linked to this project
            </p>
          </div>
          {canEdit && (
            <AddNoteDialog projectId={project.id} projectName={project.name} />
          )}
        </div>

        {notes.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No notes yet.{canEdit ? " Add one above." : ""}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{note.title}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {note.content}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {/* Copy — available to all roles */}
                    <CopyNoteButton title={note.title} content={note.content} />

                    {/* Edit, manage access, delete — MODERATOR and above only */}
                    {canEdit && (
                      <EditNoteDialog
                        noteId={note.id}
                        initialTitle={note.title}
                        initialContent={note.content}
                      />
                    )}
                    {canEdit && (
                      <ManageAccessDialog
                        type="note"
                        resourceId={note.id}
                        resourceName={note.title}
                        currentAccess={note.sharedWith}
                        allUsers={allUsers}
                      />
                    )}
                    {canEdit && (
                      <DeleteNoteButton noteId={note.id} noteTitle={note.title} />
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>By {note.owner.name ?? note.owner.email}</span>
                  <span>·</span>
                  <span>{formatDate(note.updatedAt)}</span>
                  {note.sharedWith.length > 0 && (
                    <>
                      <span>·</span>
                      <span>Shared with {note.sharedWith.length}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

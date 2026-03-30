import Link from "next/link";
import { redirect } from "next/navigation";
import { NoteType, Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canUserPerformAction } from "@/lib/permissions";
import {
  getAccessibleNotesByStatus,
  getGeneralNotes,
} from "@/lib/queries/notes";
import { VAULT_ENTITY_STATUS } from "@/lib/vault-entity-status";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CopyNoteButton from "@/components/CopyNoteButton";
import AddNoteDialog from "@/components/dashboard/AddNoteDialog";
import EditNoteDialog from "@/components/dashboard/EditNoteDialog";
import ArchiveNoteButton from "@/components/dashboard/ArchiveNoteButton";
import ManageAccessDialog from "@/components/dashboard/ManageAccessDialog";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const sp = await searchParams;
  const statusParam = typeof sp.status === "string" ? sp.status : undefined;

  if (statusParam === VAULT_ENTITY_STATUS.DELETED) {
    redirect("/dashboard/notes");
  }

  const isArchivedList = statusParam === VAULT_ENTITY_STATUS.ARCHIVED;

  const actor = {
    id:       session.user.id,
    role:     session.user.role,
    isActive: session.user.isActive,
  };
  const canEdit = canUserPerformAction(actor, null, "note", "create");
  const showAddNote =
    !isArchivedList && (canEdit || actor.role === Role.USER);

  const notes = isArchivedList
    ? await getAccessibleNotesByStatus(actor, VAULT_ENTITY_STATUS.ARCHIVED)
    : await getGeneralNotes(actor);

  const pageTitle = isArchivedList ? "Archived notes" : "General Notes";
  const pageDescription = isArchivedList
    ? "Open a note to read its contents."
    : "Notes not tied to a specific project.";

  const allUsers = !isArchivedList
    ? await prisma.user.findMany({
        where:   { isActive: true },
        select:  { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{pageDescription}</p>
        </div>
        {showAddNote && <AddNoteDialog />}
      </div>

      <Separator />

      {notes.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-16 text-center">
          <p className="text-sm text-muted-foreground">
            {isArchivedList
              ? "No archived notes."
              : `No general notes yet.${showAddNote ? " Create one above." : ""}`}
          </p>
        </div>
      ) : isArchivedList ? (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                href={`/dashboard/notes/${note.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm shadow-sm transition-colors hover:bg-muted/30"
              >
                <span className="font-medium text-foreground">{note.title}</span>
                <div className="flex flex-wrap items-center gap-2">
                  {note.type === NoteType.NORMAL ? (
                    <Badge variant="outline" className="text-[10px]">
                      General
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      {note.project?.name ?? "Project"}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{formatDate(note.updatedAt)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{note.title}</h3>
                    <Badge variant="outline" className="text-[10px]">
                      General
                    </Badge>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {note.content}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <CopyNoteButton title={note.title} content={note.content} />

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
                    <ArchiveNoteButton noteId={note.id} noteTitle={note.title} />
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span>By {note.owner.name ?? note.owner.email}</span>
                <span>·</span>
                <span>{formatDate(note.createdAt)}</span>
                {note.sharedWith.length > 0 && (
                  <>
                    <span>·</span>
                    <span>
                      Shared with {note.sharedWith.length} user{note.sharedWith.length !== 1 ? "s" : ""}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

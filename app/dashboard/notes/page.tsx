import { auth }       from "@/auth";
import { prisma }     from "@/lib/prisma";
import { canUserPerformAction } from "@/lib/permissions";
import { getGeneralNotes }      from "@/lib/queries/notes";
import { Badge }             from "@/components/ui/badge";
import { Separator }         from "@/components/ui/separator";
import CopyNoteButton        from "@/components/CopyNoteButton";
import AddNoteDialog         from "@/components/dashboard/AddNoteDialog";
import EditNoteDialog        from "@/components/dashboard/EditNoteDialog";
import DeleteNoteButton      from "@/components/dashboard/DeleteNoteButton";
import ManageAccessDialog    from "@/components/dashboard/ManageAccessDialog";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function NotesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const actor   = { id: session.user.id, role: session.user.role };
  const canEdit = canUserPerformAction(actor, null, "note", "create");

  const notes = await getGeneralNotes(actor);

  const allUsers = await prisma.user.findMany({
    where:   { isActive: true },
    select:  { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">General Notes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Notes not tied to a specific project.
          </p>
        </div>
        {canEdit && <AddNoteDialog />}
      </div>

      <Separator />

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-16 text-center">
          <p className="text-sm text-muted-foreground">
            No general notes yet.{canEdit ? " Create one above." : ""}
          </p>
        </div>
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
                    <Badge variant="outline" className="text-[10px]">General</Badge>
                  </div>
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
                <span>{formatDate(note.createdAt)}</span>
                {note.sharedWith.length > 0 && (
                  <>
                    <span>·</span>
                    <span>Shared with {note.sharedWith.length} user{note.sharedWith.length !== 1 ? "s" : ""}</span>
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

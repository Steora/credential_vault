"use client";

import { useState, useTransition } from "react";
import { useRouter }               from "next/navigation";
import { toast }                   from "sonner";
import { NoteType }                from "@prisma/client";
import { Button }  from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import { Label }   from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { saveNote } from "@/app/actions/notes";

interface Props {
  /** When provided, the note is created as PROJECT_BASED for this project. */
  projectId?:   string;
  projectName?: string;
}

export default function AddNoteDialog({ projectId, projectName }: Props) {
  const [open,    setOpen]    = useState(false);
  const [title,   setTitle]   = useState("");
  const [content, setContent] = useState("");
  const [error,   setError]   = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isProjectNote = !!projectId;

  const resetAndClose = () => {
    setOpen(false);
    setTitle("");
    setContent("");
    setError(null);
  };

  const handleSubmit = () => {
    setError(null);
    if (!title.trim())   { setError("Title is required.");   return; }
    if (!content.trim()) { setError("Content is required."); return; }

    startTransition(async () => {
      const result = await saveNote({
        title:     title.trim(),
        content:   content.trim(),
        type:      isProjectNote ? NoteType.PROJECT_BASED : NoteType.NORMAL,
        projectId: isProjectNote ? projectId : undefined,
      });

      if (result.success) {
        toast.success("Note created.");
        resetAndClose();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const dialogTitle = isProjectNote
    ? `Add Note — ${projectName ?? "Project"}`
    : "Add General Note";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetAndClose(); else setOpen(true); }}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <svg className="mr-1.5 h-4 w-4" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add Note
          </Button>
        }
      />

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="n-title">Title</Label>
            <Input
              id="n-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deployment checklist"
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="n-content">Content</Label>
            <textarea
              id="n-content"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here…"
              disabled={isPending}
              className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetAndClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Saving…" : "Create Note"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

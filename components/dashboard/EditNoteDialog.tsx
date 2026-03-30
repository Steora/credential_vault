"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast }     from "sonner";
import { Button }    from "@/components/ui/button";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { updateNote } from "@/app/actions/notes";

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M11.5 2.5a1.414 1.414 0 012 2L5 13H3v-2L11.5 2.5z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface Props {
  noteId:       string;
  initialTitle: string;
  initialContent: string;
}

export default function EditNoteDialog({ noteId, initialTitle, initialContent }: Props) {
  const [open,    setOpen]    = useState(false);
  const [title,   setTitle]   = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [error,   setError]   = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Reset fields to current values whenever the dialog opens
  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setContent(initialContent);
      setError(null);
    }
  }, [open, initialTitle, initialContent]);

  const handleSave = () => {
    setError(null);
    if (!title.trim())   { setError("Title is required.");   return; }
    if (!content.trim()) { setError("Content is required."); return; }

    startTransition(async () => {
      const result = await updateNote({
        noteId,
        title:   title.trim(),
        content: content.trim(),
      });

      if (result.success) {
        toast.success("Note updated.");
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label={`Edit note "${initialTitle}"`}
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </Button>
        }
      />

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="en-title">Title</Label>
            <Input
              id="en-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
              disabled={isPending}
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <Label htmlFor="en-content">Content</Label>
            <textarea
              id="en-content"
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here…"
              disabled={isPending}
              className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

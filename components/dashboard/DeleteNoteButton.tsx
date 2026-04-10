"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteNote } from "@/app/actions/notes";

interface Props {
  noteId: string;
  noteTitle: string;
  /** When set, navigate here after a successful delete (e.g. leave note detail). */
  afterDeleteHref?: string;
}

export default function DeleteNoteButton({
  noteId,
  noteTitle,
  afterDeleteHref,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteNote(noteId);
      if (result.success) {
        toast.success("Note permanently deleted.");
        if (afterDeleteHref) {
          router.push(afterDeleteHref);
        }
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            aria-label="Delete note permanently"
            title="Delete"
            disabled={isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 className="size-5" aria-hidden />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete &ldquo;{noteTitle}&rdquo; permanently?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone. The note is removed from the vault entirely, including any
            archived copy.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Deleting…" : "Delete permanently"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

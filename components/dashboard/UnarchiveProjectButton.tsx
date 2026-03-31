"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore } from "lucide-react";
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
import { unarchiveProject } from "@/app/actions/projects";

interface Props {
  projectId: string;
  projectName: string;
}

export default function UnarchiveProjectButton({ projectId, projectName }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRestore = () => {
    startTransition(async () => {
      const result = await unarchiveProject(projectId);
      if (result.success) {
        toast.success("Project restored.");
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
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label="Restore project"
            title="Unarchive"
            disabled={isPending}
          >
            <ArchiveRestore className="h-3.5 w-3.5" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-muted text-muted-foreground">
            <ArchiveRestore className="size-5" aria-hidden />
          </AlertDialogMedia>
          <AlertDialogTitle>Restore &ldquo;{projectName}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            The project and its subprojects will be moved back into the active Projects list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRestore} disabled={isPending}>
            {isPending ? "Restoring…" : "Restore"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


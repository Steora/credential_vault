"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
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
import { leaveProject } from "@/app/actions/project-assignments";

interface Props {
  projectId: string;
  projectName: string;
}

export default function LeaveProjectButton({ projectId, projectName }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLeave = () => {
    startTransition(async () => {
      const result = await leaveProject(projectId);
      if (result.success) {
        toast.success("You left the project.");
        router.replace("/dashboard/projects");
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
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            disabled={isPending}
          >
            <LogOut className="h-3.5 w-3.5" />
            Leave project
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-muted text-muted-foreground">
            <LogOut className="size-5" aria-hidden />
          </AlertDialogMedia>
          <AlertDialogTitle>Leave &ldquo;{projectName}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            Your assignment to this project will be removed. You will need to be added again by an admin to
            regain access. Subprojects you were only seeing through this assignment may disappear from your
            list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLeave} disabled={isPending}>
            {isPending ? "Leaving…" : "Leave project"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

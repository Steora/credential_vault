"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createProject } from "@/app/actions/projects";

interface Props {
  parentId: string;
  parentName: string;
}

export default function CreateSubprojectDialog({ parentId, parentName }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCreate = () => {
    setError(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("description", desc.trim());
    formData.set("parentId", parentId);

    startTransition(async () => {
      const result = await createProject(null, formData);
      if (result.success) {
        toast.success("Subproject created.");
        setOpen(false);
        setName("");
        setDesc("");
        router.push(`/dashboard/projects/${result.id}`);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setError(null);
          setName("");
          setDesc("");
        }
      }}
    >
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <svg className="mr-1.5 h-4 w-4" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add subproject
          </Button>
        }
      />

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New subproject</DialogTitle>
          <p className="text-sm text-muted-foreground text-left font-normal">
            Under <span className="font-medium text-foreground">{parentName}</span>. Names must be unique across all
            projects (e.g. “{parentName} — API”).
          </p>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sp-name">Name</Label>
            <Input
              id="sp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${parentName} — …`}
              disabled={isPending}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sp-desc">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="sp-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Short purpose of this subproject"
              disabled={isPending}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="button" onClick={handleCreate} className="w-full" disabled={isPending}>
            {isPending ? "Creating…" : "Create subproject"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { createCredentialSection } from "@/app/actions/credentials";

interface Props {
  /** When provided, this dialog creates a subsection of the given parent. */
  parentId?: string;
}

export default function AddCredentialSectionDialog({ parentId }: Props) {
  const isSubsection = Boolean(parentId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const reset = () => {
    setError(null);
    setName("");
    setDesc("");
  };

  const handleCreate = () => {
    setError(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    startTransition(async () => {
      const result = await createCredentialSection({
        name:        name.trim(),
        description: desc.trim() || undefined,
        parentId,
      });
      if (result.success) {
        setOpen(false);
        reset();
        // Same as root sections: open the new section’s page so the user can add keys immediately.
        router.push(`/dashboard/credentials/${result.id}`);
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
        if (!o) reset();
      }}
    >
      <DialogTrigger
        render={
          isSubsection ? (
            <Button size="sm" variant="outline">
              <svg className="mr-1.5 h-4 w-4" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 2v12M2 8h12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Add Subsection
            </Button>
          ) : (
            <Button size="sm">
              <svg className="mr-1.5 h-4 w-4" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 2v12M2 8h12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Add Section
            </Button>
          )
        }
      />

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isSubsection ? "Create subsection" : "Create credential section"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cs-name">Name</Label>
            <Input
              id="cs-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isSubsection ? "e.g. Staging keys" : "e.g. Production API keys"}
              disabled={isPending}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cs-desc">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="cs-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Short description…"
              disabled={isPending}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="button"
            onClick={handleCreate}
            className="w-full"
            disabled={isPending}
          >
            {isPending ? "Creating…" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

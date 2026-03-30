"use client";

import { useState, useTransition } from "react";
import { useRouter }               from "next/navigation";
import { toast }                   from "sonner";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import EnvFileImporter from "@/components/EnvFileImporter";
import { saveSecret }  from "@/app/actions/secrets";

// ---------------------------------------------------------------------------
// Manual single-secret form
// ---------------------------------------------------------------------------

function ManualSecretForm({
  projectId,
  onSuccess,
}: {
  projectId: string;
  onSuccess: () => void;
}) {
  const [key,   setKey]   = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!key.trim()) { setError("Key is required."); return; }
    if (!value.trim()) { setError("Value is required."); return; }

    startTransition(async () => {
      const result = await saveSecret({ key: key.trim(), value: value.trim(), projectId });
      if (result.success) {
        toast.success(`Secret "${key.trim()}" saved.`);
        setKey("");
        setValue("");
        onSuccess();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="s-key">Key</Label>
        <Input
          id="s-key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="DATABASE_URL"
          className="font-mono"
          autoComplete="off"
          disabled={isPending}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="s-value">Value</Label>
        <Input
          id="s-value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="postgres://user:pass@host/db"
          type="password"
          autoComplete="new-password"
          disabled={isPending}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="button"
        onClick={() => handleSubmit()}
        className="w-full"
        disabled={isPending}
      >
        {isPending ? "Saving…" : "Save Secret"}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------

interface Props {
  projectId:   string;
  projectName: string;
}

export default function AddSecretDialog({ projectId, projectName }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <svg className="mr-1.5 h-4 w-4" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add Secret
          </Button>
        }
      />

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Secret — {projectName}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual" className="mt-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Write manually</TabsTrigger>
            <TabsTrigger value="env">Paste / upload .env</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="mt-4">
            <ManualSecretForm projectId={projectId} onSuccess={handleSuccess} />
          </TabsContent>

          <TabsContent value="env" className="mt-4">
            <EnvFileImporter
              projectId={projectId}
              projectName={projectName}
              onImportSuccess={handleSuccess}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

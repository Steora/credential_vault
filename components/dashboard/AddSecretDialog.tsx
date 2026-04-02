"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter }               from "next/navigation";
import { toast }                   from "sonner";
import { Plus, Trash2 }            from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import EnvFileImporter from "@/components/EnvFileImporter";
import { saveSecretsFromEnv } from "@/app/actions/secrets";

// ---------------------------------------------------------------------------
// Manual multi-secret form
// ---------------------------------------------------------------------------

function ManualSecretForm({
  projectId,
  environment,
  onSuccess,
}: {
  projectId: string;
  environment: string;
  onSuccess: () => void;
}) {
  const [pairs, setPairs] = useState([{ id: Date.now(), key: "", value: "" }]);
  const [isPending, startTransition] = useTransition();

  const handleAddRow = () => {
    setPairs([...pairs, { id: Date.now(), key: "", value: "" }]);
  };

  const handleRemoveRow = (id: number) => {
    setPairs(pairs.filter(p => p.id !== id));
  };

  const updatePair = (id: number, field: "key" | "value", val: string) => {
    setPairs(pairs.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const handleSubmit = () => {
    // Fallback to "Default" if left empty
    const finalEnv = environment.trim() || "Default";

    const validPairs = pairs.filter(p => p.key.trim() && p.value.trim());
    if (validPairs.length === 0) {
      toast.error("Please add at least one valid key and value.");
      return;
    }

    startTransition(async () => {
      const result = await saveSecretsFromEnv(validPairs, projectId, finalEnv);
      
      if (result.success) {
        const saved = result.outcomes.filter(o => o.status === "saved").length;
        const pending = result.outcomes.filter(o => o.status === "pending").length;
        
        if (saved > 0) toast.success(`Saved ${saved} secret(s).`);
        if (pending > 0) toast.success(`Submitted ${pending} secret(s) for approval.`);
        
        setPairs([{ id: Date.now(), key: "", value: "" }]);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label>Secrets Preview</Label>
        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
          {pairs.map((pair) => (
            <div key={pair.id} className="flex items-center gap-2">
              <Input
                placeholder="KEY"
                value={pair.key}
                onChange={(e) => updatePair(pair.id, "key", e.target.value)}
                className="font-mono w-1/3"
                disabled={isPending}
              />
              <Input
                placeholder="Value"
                value={pair.value}
                onChange={(e) => updatePair(pair.id, "value", e.target.value)}
                className="font-mono w-full"
                type="password"
                disabled={isPending}
              />
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-red-500 hover:bg-red-50"
                onClick={() => handleRemoveRow(pair.id)}
                disabled={pairs.length === 1 || isPending}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={handleAddRow} disabled={isPending}>
          <Plus className="mr-1.5 size-4" /> Add Another
        </Button>
      </div>

      <Button onClick={handleSubmit} className="w-full" disabled={isPending}>
        {isPending ? "Saving…" : "Save Secrets"}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------

interface Props {
  projectId:   string;
  projectName: string;
  allowBulkImport?: boolean;
  defaultEnvironment?: string; 
  triggerIconOnly?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export default function AddSecretDialog({
  projectId,
  projectName,
  allowBulkImport = true,
  defaultEnvironment = "",
  triggerIconOnly = false,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  hideTrigger = false,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [environment, setEnvironment] = useState(defaultEnvironment);
  const router = useRouter();

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (setControlledOpen) setControlledOpen(newOpen);
    else setInternalOpen(newOpen);
  };

  useEffect(() => {
    if (isOpen) {
      setEnvironment(defaultEnvironment);
    }
  }, [isOpen, defaultEnvironment]);

  const handleSuccess = () => {
    handleOpenChange(false);
    setEnvironment(defaultEnvironment);
    router.refresh();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          {triggerIconOnly ? (
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground gap-1.5">
              <Plus className="size-3.5" />
              Add Secret
            </Button>
          ) : (
            <Button size="sm">
              <Plus className="mr-1.5 size-4" />
              Add Secret
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Secret — {projectName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Section Input applies to both manual and bulk uploads */}
          <div className="space-y-1.5">
            <Label htmlFor="env-section">
              Section / Environment Name <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="env-section"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              placeholder="e.g., local, development, production"
            />
          </div>

          {allowBulkImport ? (
            <Tabs defaultValue="manual" className="mt-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Write manually</TabsTrigger>
                <TabsTrigger value="env">Paste / upload .env</TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="mt-4">
                <ManualSecretForm 
                  projectId={projectId} 
                  environment={environment} 
                  onSuccess={handleSuccess} 
                />
              </TabsContent>

              <TabsContent value="env" className="mt-4">
                <EnvFileImporter
                  projectId={projectId}
                  projectName={projectName}
                  environment={environment}
                  onImportSuccess={handleSuccess}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="mt-4">
              <p className="mb-3 text-xs text-muted-foreground">
                Your submission will be sent to an administrator for approval before it appears in this project.
              </p>
              <ManualSecretForm 
                projectId={projectId} 
                environment={environment} 
                onSuccess={handleSuccess} 
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
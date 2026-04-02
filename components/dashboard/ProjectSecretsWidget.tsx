"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import CopyAllSecretsButton from "@/components/CopyAllSecretsButton";
import AddSecretDialog from "@/components/dashboard/AddSecretDialog";
import RevealButton from "@/components/RevealButton";
import CopyButton from "@/components/CopyButton";
import EditSecretDialog from "@/components/dashboard/EditSecretDialog";
import DeleteSecretButton from "@/components/dashboard/DeleteSecretButton";
import { Button } from "@/components/ui/button";
import { deleteEnvironment } from "@/app/actions/secrets";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ProjectSecretRow = {
  id: string;
  key: string;
  environment: string;
  ownerName: string;
  createdAtStr: string;
};

interface Props {
  project: { id: string; name: string };
  secrets: ProjectSecretRow[];
  showAddSecret: boolean;
  canMutateVault: boolean;
  canUserRequestPendingSubmission: boolean;
}

export default function ProjectSecretsWidget({
  project,
  secrets,
  showAddSecret,
  canMutateVault,
  canUserRequestPendingSubmission,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useState(false);
  const [addedEnvs, setAddedEnvs] = useState<string[]>([]);
  
  const [dropdownDialogOpen, setDropdownDialogOpen] = useState(false);
  const [dropdownEnv, setDropdownEnv] = useState("");
  const [selectKey, setSelectKey] = useState(Date.now()); // Forces Select to reset

  const allEnvs = useMemo(() => {
    const envsFromSecrets = secrets.map((s) => s.environment || "Default");
    return Array.from(new Set([...envsFromSecrets, ...addedEnvs]));
  }, [secrets, addedEnvs]);

  const handleAddEnv = (val: string) => {
    if (val === "custom") {
      // Just open the dialog with an empty environment so they can type it in the popup
      setDropdownEnv(""); 
      setDropdownDialogOpen(true);
    } else if (val) {
      // Predefined env selected -> add it and open dialog
      setAddedEnvs((prev) => Array.from(new Set([...prev, val])));
      setDropdownEnv(val);
      setDropdownDialogOpen(true);
    }
    
    // Reset dropdown back to placeholder
    setSelectKey(Date.now()); 
  };

  const handleDeleteSection = (envName: string, hasSecrets: boolean) => {
    if (!hasSecrets) {
      setAddedEnvs((prev) => prev.filter((e) => e !== envName));
      toast.success(`Section "${envName}" removed.`);
      return;
    }

    startTransition(true);
    deleteEnvironment(project.id, envName).then((result) => {
      if (result.success) {
        toast.success(`Section "${envName}" and all its secrets deleted.`);
        setAddedEnvs((prev) => prev.filter((e) => e !== envName));
        router.refresh();
      } else {
        toast.error(result.error);
      }
      startTransition(false);
    });
  };

  return (
    <section className="space-y-6">
      
      {/* Hidden Dialog for the Dropdown trigger */}
      {showAddSecret && (
        <AddSecretDialog
          projectId={project.id}
          projectName={project.name}
          allowBulkImport={canMutateVault || canUserRequestPendingSubmission}
          defaultEnvironment={dropdownEnv}
          open={dropdownDialogOpen}
          onOpenChange={setDropdownDialogOpen}
          hideTrigger={true}
        />
      )}

      {/* 3-Column Grid to guarantee perfect centering */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
        
        {/* LEFT: Title & Subtitle */}
        <div className="justify-self-start">
          <h2 className="text-lg font-semibold">Secrets</h2>
          <p className="text-xs text-muted-foreground">
            {secrets.length} encrypted secret{secrets.length !== 1 ? "s" : ""}
          </p>
        </div>
        
        {/* CENTER: Styled Environment Dropdown */}
        <div className="justify-self-center">
          {showAddSecret && (
            <Select key={selectKey} onValueChange={handleAddEnv}>
              <SelectTrigger className="h-9 w-[180px] bg-white/40 border-white/20 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-[#0c1421] focus:ring-blue-500/20 transition-all hover:bg-white/60 shadow-sm">
                <SelectValue placeholder="Add Environment" />
              </SelectTrigger>
              {/* Added overflow-x-auto to make the dropdown list scrollable horizontally */}
              <SelectContent align="center" className="bg-white/90 backdrop-blur-xl border-white/20 rounded-xl shadow-xl max-w-[90vw] overflow-x-auto">
                <SelectItem value="Local" className="text-[10px] font-black uppercase tracking-widest text-[#0c1421]">
                  Local
                </SelectItem>
                <SelectItem value="Development" className="text-[10px] font-black uppercase tracking-widest text-[#0c1421]">
                  Development
                </SelectItem>
                <SelectItem value="Deployment" className="text-[10px] font-black uppercase tracking-widest text-[#0c1421]">
                  Deployment
                </SelectItem>
                <SelectItem value="custom" className="text-[10px] font-black uppercase tracking-widest text-blue-600 focus:text-blue-700 focus:bg-blue-50/50">
                  + Custom Env
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* RIGHT: Global Actions */}
        <div className="justify-self-end flex items-center gap-2">
          <CopyAllSecretsButton projectId={project.id} secretCount={secrets.length} />
          
          {showAddSecret && (
            <AddSecretDialog
              projectId={project.id}
              projectName={project.name}
              allowBulkImport={canMutateVault || canUserRequestPendingSubmission}
              defaultEnvironment="" 
            />
          )}
        </div>
      </div>

      {allEnvs.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No secrets yet. {showAddSecret ? "Select an environment from the dropdown to start." : ""}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {allEnvs.map((envName) => {
            const envSecrets = secrets.filter((s) => (s.environment || "Default") === envName);
            const hasSecrets = envSecrets.length > 0;

            return (
              <div key={envName} className="space-y-3">
                {/* Section Header with Section-specific Actions */}
                <div className="flex items-center justify-between bg-muted/30 px-4 py-2.5 rounded-lg border border-border">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-600">
                    {envName}
                  </h3>
                  <div className="flex items-center gap-2">
                    <CopyAllSecretsButton 
                      projectId={project.id} 
                      secretCount={envSecrets.length} 
                      environment={envName} 
                    />
                    {showAddSecret && (
                      <AddSecretDialog
                        projectId={project.id}
                        projectName={project.name}
                        allowBulkImport={canMutateVault || canUserRequestPendingSubmission}
                        defaultEnvironment={envName}
                        triggerIconOnly={true}
                      />
                    )}
                    
                    {/* Delete Section Button & Dialog */}
                    {canMutateVault && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 gap-1.5"
                            disabled={isPending}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Section?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the <strong>{envName}</strong> section? 
                              {hasSecrets 
                                ? ` This will permanently delete all ${envSecrets.length} secret(s) inside it. This action cannot be undone.` 
                                : " This will remove the empty section from your view."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteSection(envName, hasSecrets)}
                              disabled={isPending}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              {isPending ? "Deleting..." : "Delete Section"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>

                {envSecrets.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic px-4 py-3 border border-dashed rounded-lg bg-muted/10">
                    No secrets added to this environment yet.
                  </p>
                ) : (
                  <div className="max-h-[min(50vh,30rem)] min-w-0 overflow-auto rounded-xl border border-border">
                    <table className="w-max min-w-full text-sm">
                      <thead className="sticky top-0 z-[1] bg-muted/95 backdrop-blur-sm">
                        <tr className="text-xs text-muted-foreground">
                          <th className="whitespace-nowrap py-2.5 pl-4 pr-3 text-left font-medium">Key</th>
                          <th className="whitespace-nowrap py-2.5 px-3 text-left font-medium">Owner</th>
                          <th className="whitespace-nowrap py-2.5 px-3 text-left font-medium">Created</th>
                          <th className="whitespace-nowrap py-2.5 pl-3 pr-4 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {envSecrets.map((s) => (
                          <tr key={s.id} className="bg-card hover:bg-muted/20 transition-colors">
                            <td className="py-3 pl-4 pr-3">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="font-mono font-medium whitespace-nowrap">{s.key}</span>
                                <span className="font-mono text-xs text-muted-foreground tracking-widest select-none">
                                  ••••••••
                                </span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap py-3 px-3 text-muted-foreground">
                              {s.ownerName}
                            </td>
                            <td className="py-3 px-3 text-muted-foreground">
                              {s.createdAtStr}
                            </td>
                            <td className="py-3 pl-3 pr-4">
                              <div className="flex items-center justify-end gap-1">
                                <RevealButton secretId={s.id} secretKey={s.key} />
                                <CopyButton secretId={s.id} />
                                {canMutateVault && <EditSecretDialog secretId={s.id} secretKey={s.key} />}
                                {canMutateVault && <DeleteSecretButton secretId={s.id} secretKey={s.key} />}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
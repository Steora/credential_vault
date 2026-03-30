"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  assignProjectsToUserBatch,
  listUnassignedRootProjectsPage,
  listUnassignedSubprojectsPage,
  removeProjectFromUser,
} from "@/app/actions/project-assignments";

type AssignedProject = {
  id:       string;
  name:     string;
  parentId: string | null;
  parent:   { id: string; name: string } | null;
};

interface Props {
  targetUser: {
    id:    string;
    name:  string | null;
    email: string | null;
  };
  assignedProjects: AssignedProject[];
  canManage: boolean;
}

function formatAssignedLabel(p: AssignedProject) {
  if (p.parent) return `${p.parent.name} → ${p.name}`;
  return p.name;
}

type RootRow = { id: string; name: string; childCount: number };

type SubState = {
  items:   { id: string; name: string }[];
  page:    number;
  hasMore: boolean;
  loading: boolean;
};

export default function UserProjectAssignmentsCell({
  targetUser,
  assignedProjects,
  canManage,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [addMoreOpen, setAddMoreOpen] = useState(false);

  const [rootRows, setRootRows] = useState<RootRow[]>([]);
  const [rootPage, setRootPage] = useState(0);
  const [rootHasMore, setRootHasMore] = useState(false);
  const [loadingRoots, setLoadingRoots] = useState(false);

  const [expandedRootId, setExpandedRootId] = useState<string | null>(null);
  const [subByParent, setSubByParent] = useState<Record<string, SubState>>({});

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [nameById, setNameById] = useState<Map<string, string>>(new Map());

  /** Snapshot when opening the confirm dialog — the popover closes and clears `selectedIds` while the alert stays open. */
  const [pendingBatch, setPendingBatch] = useState<{
    ids: string[];
    nameById: Map<string, string>;
  } | null>(null);

  const [batchOpen, setBatchOpen] = useState(false);

  const [removeOpen, setRemoveOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null);

  const displayName = targetUser.name ?? targetUser.email ?? "this user";

  const resetAddMore = useCallback(() => {
    setAddMoreOpen(false);
    setRootRows([]);
    setRootPage(0);
    setRootHasMore(false);
    setLoadingRoots(false);
    setExpandedRootId(null);
    setSubByParent({});
    setSelectedIds(new Set());
    setNameById(new Map());
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetAddMore();
  };

  const toggleId = (id: string, name: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
    setNameById((prev) => {
      const next = new Map(prev);
      if (checked) next.set(id, name);
      else next.delete(id);
      return next;
    });
  };

  const loadRootPage = async (nextPage: number, append: boolean) => {
    setLoadingRoots(true);
    try {
      const res = await listUnassignedRootProjectsPage(targetUser.id, nextPage);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setRootHasMore(res.hasMore);
      setRootPage(nextPage);
      setRootRows((prev) => (append ? [...prev, ...res.items] : res.items));
    } finally {
      setLoadingRoots(false);
    }
  };

  const loadSubPage = async (parentId: string, nextPage: number, append: boolean) => {
    setSubByParent((prev) => ({
      ...prev,
      [parentId]: {
        items:   prev[parentId]?.items ?? [],
        page:    prev[parentId]?.page ?? 0,
        hasMore: prev[parentId]?.hasMore ?? false,
        loading: true,
      },
    }));
    const res = await listUnassignedSubprojectsPage(targetUser.id, parentId, nextPage);
    if (!res.success) {
      toast.error(res.error);
      setSubByParent((prev) => ({
        ...prev,
        [parentId]: { ...prev[parentId]!, loading: false },
      }));
      return;
    }
    setSubByParent((prev) => {
      const prior = prev[parentId]?.items ?? [];
      const items = append ? [...prior, ...res.items] : res.items;
      return {
        ...prev,
        [parentId]: {
          items,
          page:    nextPage,
          hasMore: res.hasMore,
          loading: false,
        },
      };
    });
  };

  const handleToggleAddMore = () => {
    if (!addMoreOpen) {
      setAddMoreOpen(true);
      void loadRootPage(0, false);
    } else {
      resetAddMore();
    }
  };

  const handleExpandRoot = (root: RootRow) => {
    if (expandedRootId === root.id) {
      setExpandedRootId(null);
      return;
    }
    setExpandedRootId(root.id);
    if (root.childCount === 0) return;
    void loadSubPage(root.id, 0, false);
  };

  const selectAllLoadedSubs = (rootId: string, checked: boolean) => {
    const items = subByParent[rootId]?.items ?? [];
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const it of items) {
        if (checked) next.add(it.id);
        else next.delete(it.id);
      }
      return next;
    });
    setNameById((prev) => {
      const next = new Map(prev);
      for (const it of items) {
        if (checked) next.set(it.id, it.name);
        else next.delete(it.id);
      }
      return next;
    });
  };

  const confirmBatchAssign = () => {
    const batch = pendingBatch;
    if (!batch || batch.ids.length === 0) return;
    const ids = batch.ids;
    const names = batch.nameById;
    startTransition(async () => {
      const result = await assignProjectsToUserBatch(targetUser.id, ids);
      if (result.success) {
        toast.success(
          ids.length === 1
            ? `Assigned “${names.get(ids[0])}” to ${displayName}.`
            : `Assigned ${ids.length} projects to ${displayName}.`,
        );
        setPendingBatch(null);
        setBatchOpen(false);
        setOpen(false);
        resetAddMore();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const openBatchConfirm = () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setPendingBatch({ ids, nameById: new Map(nameById) });
    setBatchOpen(true);
  };

  const confirmRemove = () => {
    if (!pendingRemove) return;
    const p = pendingRemove;
    startTransition(async () => {
      const result = await removeProjectFromUser(targetUser.id, p.id);
      if (result.success) {
        toast.success(`Removed ${displayName} from “${p.name}”.`);
        setRemoveOpen(false);
        setPendingRemove(null);
        resetAddMore();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  if (!canManage) {
    const n = assignedProjects.length;
    return (
      <span className="text-xs text-muted-foreground">
        {n === 0 ? "—" : `${n} project${n === 1 ? "" : "s"}`}
      </span>
    );
  }

  const selectionCount = selectedIds.size;
  const batchCount = pendingBatch?.ids.length ?? 0;
  const batchPreview =
    pendingBatch?.ids.map((id) => pendingBatch.nameById.get(id) ?? id).slice(0, 8) ?? [];

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          disabled={isPending}
          className="inline-flex h-7 max-w-[11rem] items-center justify-between gap-1 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
        >
          <span className="truncate">
            {assignedProjects.length === 0
              ? "Projects"
              : `${assignedProjects.length} project${assignedProjects.length === 1 ? "" : "s"}`}
          </span>
          <ChevronDown className="size-3.5 shrink-0 opacity-60" />
        </PopoverTrigger>
        <PopoverContent side="bottom" align="end" className="w-[22rem] max-w-[min(100vw-2rem,22rem)] p-0">
          <div className="border-b border-border px-3 py-2">
            <p className="text-xs font-medium text-foreground">Assigned projects</p>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Subprojects appear under their parent. Removing access here only affects membership, not secrets
              ownership.
            </p>
          </div>

          <div className="max-h-48 overflow-y-auto px-1 py-1">
            {assignedProjects.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">No projects assigned yet.</p>
            ) : (
              <ul className="space-y-0.5">
                {assignedProjects.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/50"
                  >
                    <span className="min-w-0 truncate font-medium" title={formatAssignedLabel(p)}>
                      {formatAssignedLabel(p)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={isPending}
                      aria-label={`Remove ${p.name}`}
                      onClick={() => {
                        setPendingRemove({ id: p.id, name: formatAssignedLabel(p) });
                        setRemoveOpen(true);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Separator />

          <div className="px-1 py-1">
            <Button
              type="button"
              variant="ghost"
              className="h-8 w-full justify-between px-2 text-xs font-normal"
              onClick={handleToggleAddMore}
              disabled={isPending || loadingRoots}
            >
              <span>Add more</span>
              <ChevronDown
                className={`size-3.5 opacity-60 transition-transform ${addMoreOpen ? "rotate-180" : ""}`}
              />
            </Button>

            {addMoreOpen && (
              <div className="border-t border-border px-1 pb-2 pt-1 space-y-2">
                {rootRows.length === 0 && !loadingRoots ? (
                  <p className="px-2 py-2 text-xs text-muted-foreground">No top-level projects found.</p>
                ) : (
                  <ul className="max-h-40 space-y-1 overflow-y-auto">
                    {rootRows.map((root) => {
                      const expanded = expandedRootId === root.id;
                      const sub = subByParent[root.id];
                      return (
                        <li key={root.id} className="rounded-md border border-border/60 bg-muted/20">
                          <div className="flex items-center gap-1 px-1.5 py-1">
                            {root.childCount > 0 ? (
                              <button
                                type="button"
                                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-muted/80"
                                onClick={() => handleExpandRoot(root)}
                                aria-expanded={expanded}
                              >
                                {expanded ? (
                                  <ChevronDown className="size-3.5" />
                                ) : (
                                  <ChevronRight className="size-3.5" />
                                )}
                              </button>
                            ) : (
                              <span className="inline-flex size-7 shrink-0" />
                            )}
                            <span className="min-w-0 flex-1 truncate text-xs font-medium">{root.name}</span>
                            {root.childCount === 0 && (
                              <label className="flex shrink-0 items-center gap-1.5 text-[11px]">
                                <input
                                  type="checkbox"
                                  className="rounded border-input"
                                  checked={selectedIds.has(root.id)}
                                  disabled={isPending}
                                  onChange={(e) => toggleId(root.id, root.name, e.target.checked)}
                                />
                                Assign
                              </label>
                            )}
                          </div>

                          {expanded && root.childCount > 0 && (
                            <div className="border-t border-border/60 bg-background px-2 py-2">
                              {sub?.loading && (
                                <p className="text-[11px] text-muted-foreground py-1">Loading subprojects…</p>
                              )}
                              {!sub?.loading && sub && sub.items.length === 0 && !sub.hasMore && (
                                <p className="text-[11px] text-muted-foreground py-1">
                                  All subprojects are already assigned.
                                </p>
                              )}
                              {sub && sub.items.length > 0 && (
                                <>
                                  <div className="flex items-center justify-between gap-2 pb-1">
                                    <Label className="text-[11px] text-muted-foreground">Subprojects</Label>
                                    <label className="flex items-center gap-1.5 text-[11px]">
                                      <input
                                        type="checkbox"
                                        className="rounded border-input"
                                        disabled={isPending}
                                        onChange={(e) => selectAllLoadedSubs(root.id, e.target.checked)}
                                      />
                                      Select all (loaded)
                                    </label>
                                  </div>
                                  <ul className="space-y-1">
                                    {sub.items.map((sp) => (
                                      <li key={sp.id}>
                                        <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-muted/50">
                                          <input
                                            type="checkbox"
                                            className="rounded border-input"
                                            checked={selectedIds.has(sp.id)}
                                            disabled={isPending}
                                            onChange={(e) => toggleId(sp.id, sp.name, e.target.checked)}
                                          />
                                          <span className="truncate">{sp.name}</span>
                                        </label>
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              )}
                              {sub?.hasMore && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="mt-2 h-7 w-full text-[11px]"
                                  disabled={sub.loading || isPending}
                                  onClick={() => void loadSubPage(root.id, (sub?.page ?? 0) + 1, true)}
                                >
                                  {sub.loading ? "Loading…" : "Load more subprojects (10)"}
                                </Button>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {rootHasMore && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 w-full text-xs"
                    disabled={loadingRoots || isPending}
                    onClick={() => void loadRootPage(rootPage + 1, true)}
                  >
                    {loadingRoots ? "Loading…" : "Load more projects (10)"}
                  </Button>
                )}

                {selectionCount > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 w-full text-xs"
                    disabled={isPending}
                    onClick={openBatchConfirm}
                  >
                    Assign selected ({selectionCount})
                  </Button>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog
        open={batchOpen}
        onOpenChange={(next) => {
          setBatchOpen(next);
          if (!next) setPendingBatch(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign selected projects?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-left">
              <span className="block">
                Assign <span className="font-medium text-foreground">{batchCount}</span> project
                {batchCount === 1 ? "" : "s"} to{" "}
                <span className="font-medium text-foreground">{displayName}</span>?
              </span>
              <ul className="max-h-32 list-inside list-disc overflow-y-auto text-xs text-muted-foreground">
                {batchPreview.map((label, i) => (
                  <li key={pendingBatch?.ids[i] ?? `${label}-${i}`}>{label}</li>
                ))}
                {batchCount > 8 && <li className="list-none">…and {batchCount - 8} more</li>}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={confirmBatchAssign}
              disabled={isPending || batchCount === 0}
            >
              Yes, assign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from project?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to remove{" "}
              <span className="font-medium text-foreground">{displayName}</span> from{" "}
              <span className="font-medium text-foreground">{pendingRemove?.name}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingRemove(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

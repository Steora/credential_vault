"use client";

import { useRouter } from "next/navigation";
import { NoteType } from "@prisma/client";
import { useTransition } from "react";
import { toast } from "sonner";

import type { ApprovalsListResult } from "@/app/actions/pending-approvals";
import {
  approvePendingNote,
  approvePendingSecret,
  rejectPendingNote,
  rejectPendingSecret,
} from "@/app/actions/pending-approvals";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function PendingApprovalsClient({ initial }: { initial: ApprovalsListResult }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = async (fn: () => Promise<{ success: boolean; error?: string }>, ok: string) => {
    startTransition(async () => {
      const r = await fn();
      if (r.success) {
        toast.success(ok);
        router.refresh();
      } else {
        toast.error(r.error ?? "Something went wrong.");
      }
    });
  };

  const empty = initial.secrets.length === 0 && initial.notes.length === 0;

  return (
    <div className="space-y-10">
      {empty ? (
        <p className="text-sm text-muted-foreground">No pending submissions.</p>
      ) : null}

      {initial.secrets.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Pending secrets</h2>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>When</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Submitted by</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initial.secrets.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatWhen(s.createdAt)}
                    </TableCell>
                    <TableCell>{s.projectName}</TableCell>
                    <TableCell className="font-mono text-xs">{s.key}</TableCell>
                    <TableCell className="text-sm">
                      {s.submitterName ?? s.submitterEmail ?? "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        size="sm"
                        variant="default"
                        disabled={isPending}
                        onClick={() =>
                          run(() => approvePendingSecret(s.id), "Secret approved and added to the vault.")
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                          run(() => rejectPendingSecret(s.id), "Request rejected.")
                        }
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {initial.notes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Pending notes</h2>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>When</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Submitted by</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initial.notes.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatWhen(n.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">{n.title}</TableCell>
                    <TableCell className="text-xs">
                      {n.type === NoteType.NORMAL ? "General" : "Project-based"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {n.projectName ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {n.submitterName ?? n.submitterEmail ?? "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        size="sm"
                        variant="default"
                        disabled={isPending}
                        onClick={() =>
                          run(() => approvePendingNote(n.id), "Note approved and published.")
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                          run(() => rejectPendingNote(n.id), "Request rejected.")
                        }
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}

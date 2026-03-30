import Link from "next/link";
import { redirect } from "next/navigation";
import { ActivityAction, Role } from "@prisma/client";
import { auth } from "@/auth";
import { getActivityLogs } from "@/lib/queries/activity";

const ELEVATED = new Set<Role>([Role.SUPERADMIN, Role.ADMIN, Role.MODERATOR]);

function actionLabel(a: ActivityAction): string {
  switch (a) {
    case ActivityAction.CREATE:
      return "Created";
    case ActivityAction.UPDATE:
      return "Updated";
    case ActivityAction.DELETE:
      return "Deleted";
    case ActivityAction.ARCHIVE:
      return "Archived";
    case ActivityAction.ASSIGN:
      return "Assigned";
    case ActivityAction.REMOVE:
      return "Removed";
    case ActivityAction.LEAVE:
      return "Left";
    case ActivityAction.STATUS:
      return "Status";
    default:
      return a;
  }
}

/** Noun phrase after the verb, e.g. "created **project** '…'". */
function entityKindNoun(entityType: string): string {
  switch (entityType) {
    case "project":
      return "project";
    case "note":
      return "note";
    case "secret":
      return "secret";
    case "user":
      return "user";
    case "project_member":
      return "project assignment";
    case "sharing_secret":
      return "secret sharing";
    case "sharing_note":
      return "note sharing";
    default:
      return entityType.replace(/_/g, " ");
  }
}

function verbPhrase(action: ActivityAction, entityType: string): string {
  if (action === ActivityAction.STATUS && entityType === "user") {
    return "changed status for";
  }
  return actionLabel(action).toLowerCase();
}

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user) return null;

  if (!ELEVATED.has(session.user.role)) {
    redirect("/dashboard/projects");
  }

  const rows = await getActivityLogs();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recent create, update, delete, and related operations across the vault. Showing the latest{" "}
          {rows.length} entries.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-12 text-center text-sm text-muted-foreground">
          No activity recorded yet.
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border bg-card">
          {rows.map((row) => {
            const kind = entityKindNoun(row.entityType);
            const verb = verbPhrase(row.action, row.entityType);
            const label = row.label?.trim();
            const showLabelInSummary = Boolean(label);

            return (
              <li key={row.id} className="px-4 py-3 text-sm first:rounded-t-xl last:rounded-b-xl">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-foreground">
                    <span className="font-medium">{row.actor.name ?? row.actor.email ?? row.actor.id}</span>
                    <span className="text-muted-foreground"> ({row.actor.role}) </span>
                    <span className="font-medium">{verb}</span>
                    <span className="text-muted-foreground"> {kind}</span>
                    {showLabelInSummary && (
                      <>
                        {" "}
                        <span className="text-foreground">&#39;{label}&#39;</span>
                      </>
                    )}
                    {!showLabelInSummary && row.entityId && (
                      <code className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {row.entityId}
                      </code>
                    )}
                  </p>
                  <time
                    className="shrink-0 text-xs text-muted-foreground tabular-nums"
                    dateTime={row.createdAt.toISOString()}
                  >
                    {row.createdAt.toLocaleString()}
                  </time>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        When a name or key is not stored, the resource id is shown instead.{" "}
        <Link href="/dashboard" className="underline-offset-4 hover:underline">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}

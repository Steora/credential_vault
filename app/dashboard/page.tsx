import { auth }                  from "@/auth";
import { prisma }                from "@/lib/prisma";
import { canUserPerformAction }  from "@/lib/permissions";
import { Badge }                 from "@/components/ui/badge";
import { Separator }             from "@/components/ui/separator";
import CopyButton                from "@/components/CopyButton";

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Secret row
// ---------------------------------------------------------------------------

function SecretRow({
  id,
  secretKey,
  projectName,
  canCopy,
}: {
  id: string;
  secretKey: string;
  projectName: string;
  canCopy: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-mono text-sm font-medium">{secretKey}</span>
        <span className="text-xs text-muted-foreground">{projectName}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground tracking-widest select-none">
          ••••••••••••
        </span>
        {canCopy ? (
          <CopyButton secretId={id} />
        ) : (
          <Badge variant="outline" className="text-[10px]">No access</Badge>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const actor = { id: session.user.id, role: session.user.role };
  const canReadSecrets = canUserPerformAction(actor, null, "secret", "read");

  // Fetch counts
  const [projectCount, noteCount, secretCount] = await Promise.all([
    prisma.project.count(),
    prisma.note.count(),
    prisma.secret.count(),
  ]);

  // Fetch recent secrets the current user can access
  const recentSecrets = canReadSecrets
    ? await prisma.secret.findMany({
        take:    8,
        orderBy: { createdAt: "desc" },
        select: {
          id:        true,
          key:       true,
          project:   { select: { name: true } },
          sharedWith:{ select: { id: true } },
          ownerId:   true,
        },
      })
    : [];

  // A user who can read secrets in general can use the copy button.
  // The decrypt Server Action re-checks the 3-condition rule per-record.
  const canCopySecret = canReadSecrets;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back,{" "}
          <span className="font-medium text-foreground">
            {session.user.name ?? session.user.email}
          </span>
          .
        </p>
      </div>

      {/* Stats */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Overview
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Projects"       value={projectCount} />
          <StatCard label="Notes"          value={noteCount}    />
          <StatCard label="Stored Secrets" value={secretCount}  />
        </div>
      </section>

      <Separator />

      {/* Recent secrets */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent Secrets
        </h2>

        {!canReadSecrets ? (
          <p className="text-sm text-muted-foreground">
            You do not have permission to view secrets.
          </p>
        ) : recentSecrets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No secrets stored yet.</p>
        ) : (
          <div className="space-y-2">
            {recentSecrets.map((s) => (
              <SecretRow
                key={s.id}
                id={s.id}
                secretKey={s.key}
                projectName={s.project.name}
                canCopy={canCopySecret}
              />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

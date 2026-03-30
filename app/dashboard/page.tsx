import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { VAULT_ENTITY_STATUS } from "@/lib/vault-entity-status";

const ELEVATED_ROLES = new Set<Role>([Role.SUPERADMIN, Role.ADMIN, Role.MODERATOR]);

function StatusCard({
  href,
  label,
  value,
  tone,
}: {
  href: string;
  label: string;
  value: number;
  tone: "default" | "muted" | "danger";
}) {
  const border =
    tone === "danger"
      ? "border-destructive/30 bg-destructive/5"
      : tone === "muted"
        ? "border-muted-foreground/20 bg-muted/30"
        : "border-border bg-card";
  return (
    <Link
      href={href}
      className={`block rounded-xl border p-5 shadow-sm transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${border}`}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
    </Link>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  if (!ELEVATED_ROLES.has(session.user.role)) {
    redirect("/dashboard/projects");
  }

  const [pActive, pArchived, nActive, nArchived] = await Promise.all([
    prisma.project.count({ where: { status: VAULT_ENTITY_STATUS.ACTIVE } }),
    prisma.project.count({ where: { status: VAULT_ENTITY_STATUS.ARCHIVED } }),
    prisma.note.count({ where: { status: VAULT_ENTITY_STATUS.ACTIVE } }),
    prisma.note.count({ where: { status: VAULT_ENTITY_STATUS.ARCHIVED } }),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10">
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

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-semibold">Projects</h2>
          <Link
            href="/dashboard/projects"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Open projects
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatusCard href="/dashboard/projects" label="Active" value={pActive} tone="default" />
          <StatusCard
            href="/dashboard/projects?status=ARCHIVED"
            label="Archived"
            value={pArchived}
            tone="muted"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-semibold">Notes</h2>
          <Link
            href="/dashboard/notes"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Open notes
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatusCard href="/dashboard/notes" label="Active" value={nActive} tone="default" />
          <StatusCard
            href="/dashboard/notes?status=ARCHIVED"
            label="Archived"
            value={nArchived}
            tone="muted"
          />
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        Archived items are excluded from the main Projects and Notes lists. Counts reflect the full database.
      </p>
    </div>
  );
}

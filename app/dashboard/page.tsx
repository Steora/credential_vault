import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isVaultMemberOnlyRole } from "@/lib/role-access";
import { VAULT_ENTITY_STATUS } from "@/lib/vault-entity-status";
import { ArrowRight, FileText, LayoutGrid, ClipboardList } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  if (isVaultMemberOnlyRole(session.user.role)) {
    redirect("/dashboard/projects");
  }

  const [pActive, pArchived, nActive, nArchived] = await Promise.all([
    prisma.project.count({ where: { status: VAULT_ENTITY_STATUS.ACTIVE } }),
    prisma.project.count({ where: { status: VAULT_ENTITY_STATUS.ARCHIVED } }),
    prisma.note.count({ where: { status: VAULT_ENTITY_STATUS.ACTIVE } }),
    prisma.note.count({ where: { status: VAULT_ENTITY_STATUS.ARCHIVED } }),
  ]);

  return (
    <div className="space-y-16 pb-20 max-w-7xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-[#0c1421] drop-shadow-sm uppercase">Dashboard</h1>
        <p className="text-base text-slate-500 font-medium tracking-tight">
          Welcome back, <span className="text-[#0c1421] font-bold">{session.user.name ?? session.user.email}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Projects Column */}
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between px-2">
            <Link
              href="/dashboard/projects"
              className="text-xl font-bold flex items-center gap-3 text-[#0c1421] uppercase tracking-tight hover:opacity-80 transition-opacity"
            >
              <div className="p-1.5 bg-[#0c1421] text-white rounded-lg shadow-lg ring-4 ring-[#0c1421]/5">
                <LayoutGrid className="size-4" />
              </div>
              Projects
            </Link>
            <Link href="/dashboard/projects" className="group flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors">
              Access Portal <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="space-y-4">
            <Link
              href="/dashboard/projects"
              className="group relative block overflow-hidden bg-white/40 backdrop-blur-md border border-white/40 p-6 rounded-2xl shadow-xl transition-all hover:bg-white/60 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
            >
              <div className="absolute top-0 right-0 p-4">
                <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <FileText className="size-5" />
                </div>
              </div>
              <div className="space-y-2.5">
                <span className="text-[9px] font-black tracking-[0.2em] text-blue-600 bg-blue-100/50 px-3 py-1 rounded-full uppercase">Current Workspace</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-black tracking-tighter text-[#0c1421]">{pActive}</span>
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-[#0c1421] uppercase tracking-tight">Active Projects</span>
                    <span className="text-[11px] text-slate-400 font-medium">Ongoing development</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 size-40 bg-blue-500/5 rounded-full blur-3xl" />
            </Link>

            <Link
              href={`/dashboard/projects?status=${VAULT_ENTITY_STATUS.ARCHIVED}`}
              className="group relative block overflow-hidden bg-[#0c1421]/[0.02] backdrop-blur-sm border border-[#0c1421]/5 p-6 rounded-2xl shadow-sm transition-all hover:bg-[#0c1421]/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight">Archived Projects</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Historical data entries</p>
                </div>
                <span className="text-4xl font-black tabular-nums text-[#0c1421]">{pArchived}</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Notes Column */}
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <div className="flex items-center justify-between px-2">
            <Link
              href="/dashboard/notes"
              className="text-xl font-bold flex items-center gap-3 text-[#0c1421] uppercase tracking-tight hover:opacity-80 transition-opacity"
            >
              <div className="p-1.5 bg-[#0c1421] text-white rounded-lg shadow-lg ring-4 ring-[#0c1421]/5">
                <ClipboardList className="size-4" />
              </div>
              General Notes
            </Link>
            <Link href="/dashboard/notes" className="group flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors">
              Access Base <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="space-y-4">
            <Link
              href="/dashboard/notes"
              className="group relative block overflow-hidden bg-white/40 backdrop-blur-md border border-white/40 p-6 rounded-2xl shadow-xl transition-all hover:bg-white/60 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            >
              <div className="absolute top-0 right-0 p-4">
                <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                  <ClipboardList className="size-5" />
                </div>
              </div>
              <div className="space-y-2.5">
                <span className="text-[9px] font-black tracking-[0.2em] text-indigo-600 bg-indigo-100/50 px-3 py-1 rounded-full uppercase">Knowledge Base</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-black tracking-tighter text-[#0c1421]">{nActive}</span>
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-[#0c1421] uppercase tracking-tight">Stored Notes</span>
                    <span className="text-[11px] text-slate-400 font-medium">Encrypted records</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 size-40 bg-indigo-500/5 rounded-full blur-3xl" />
            </Link>

            <Link
              href={`/dashboard/notes?status=${VAULT_ENTITY_STATUS.ARCHIVED}`}
              className="group relative block overflow-hidden bg-[#0c1421]/[0.02] backdrop-blur-sm border border-[#0c1421]/5 p-6 rounded-2xl shadow-sm transition-all hover:bg-[#0c1421]/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight">Archived Notes</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Secured offline archives</p>
                </div>
                <span className="text-4xl font-black tabular-nums text-[#0c1421]">{nArchived}</span>
              </div>
            </Link>
          </div>
        </section>
      </div>

      {/* Modern Status Footer */}
      <footer className="pt-24 border-t border-white/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-1">
            <p className="text-sm text-[#0c1421] font-bold">Credential Vault Infrastructure</p>
            <p className="text-xs text-slate-400 tracking-wide">Archived items are excluded from active sync protocols.</p>
          </div>
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-3">
              <div className="size-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
              <span className="text-[10px] font-black tracking-[0.2em] text-[#0c1421] uppercase">System Optimized</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              <span className="text-[10px] font-black tracking-[0.2em] text-[#0c1421] uppercase">AES-256 Active</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

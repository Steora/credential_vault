import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { listPendingApprovals } from "@/app/actions/pending-approvals";
import PendingApprovalsClient from "@/components/dashboard/PendingApprovalsClient";

const APPROVERS = new Set<Role>([Role.ADMIN, Role.SUPERADMIN]);

export default async function ApprovalsPage() {
  const session = await auth();
  if (!session?.user) return null;

  if (!APPROVERS.has(session.user.role)) {
    redirect("/dashboard/projects");
  }

  const data = await listPendingApprovals();
  if ("error" in data) {
    redirect("/dashboard/projects");
  }

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#0c1421] drop-shadow-sm uppercase">Approvals</h1>
        <p className="mt-2 text-base text-slate-500 font-medium tracking-tight">
          Authorization layer for cryptographic assets and intelligence nodes. Review all submissions before integration.
        </p>
      </div>

      <PendingApprovalsClient initial={data} />

      <footer className="pt-24 border-t border-white/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-1">
            <p className="text-xs font-black text-[#0c1421] uppercase tracking-[0.2em]">Approval Terminal</p>
            <p className="text-[10px] text-slate-400">All approval actions are logged in the activity page.</p>
          </div>
          {/* <div className="flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-md rounded-full border border-white/40 shadow-sm">
            <div className="size-2 rounded-full animate-pulse bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span className="text-[10px] font-black tracking-widest text-[#0c1421] uppercase">Authority Status: SuperAdmin</span>
          </div> */}
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { KeyRound } from "lucide-react";
import ManageAccessDialog from "@/components/dashboard/ManageAccessDialog";
import CredentialArchiveSectionButton from "@/components/dashboard/CredentialArchiveSectionButton";
import { Role } from "@prisma/client";

type AccessUser = { id: string; name: string | null; email: string | null };
type AllUser    = AccessUser & { role: Role };

interface Props {
  id:           string;
  name:         string;
  description:  string | null;
  keyCount:     number;
  sharedWith:   AccessUser[];
  ownerLabel:   string;
  updatedLabel: string;
  createdAt:    Date;
  updatedAt:    Date;
  allUsers:     AllUser[];
  canManageAccess: boolean;
  canArchive:      boolean;
}

function fmt(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function CredentialSubsectionCard({
  id,
  name,
  description,
  keyCount,
  sharedWith,
  ownerLabel,
  updatedLabel,
  createdAt,
  updatedAt,
  allUsers,
  canManageAccess,
  canArchive,
}: Props) {
  return (
    <div className="group relative flex cursor-pointer flex-col rounded-xl border border-white/40 bg-white/30 p-4 shadow-sm backdrop-blur-md transition-all hover:bg-white/50 hover:shadow-md">
      {/* Full-card link (sits behind action buttons) */}
      <Link
        href={`/dashboard/credentials/${id}`}
        className="absolute inset-0 z-[1] rounded-xl"
        aria-label={`Open subsection ${name}`}
      />

      <div className="relative z-[2] pointer-events-none">
        <div className="flex items-start justify-between gap-3">
          {/* Icon + name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="rounded-lg bg-indigo-600/10 p-1.5 text-indigo-600 shrink-0">
              <KeyRound className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black uppercase tracking-tight text-[#0c1421] truncate">
                {name}
              </h3>
              {description && (
                <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{description}</p>
              )}
              <p className="mt-0.5 text-[10px] text-slate-400">
                {keyCount} key{keyCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="relative z-[3] flex shrink-0 items-center gap-1 pointer-events-auto">
            {canManageAccess && (
              <ManageAccessDialog
                type="credential_section"
                resourceId={id}
                resourceName={name}
                currentAccess={sharedWith}
                allUsers={allUsers}
              />
            )}
            {canArchive && (
              <CredentialArchiveSectionButton sectionId={id} sectionName={name} />
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-white/20 pt-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Created</span>
            <div className="flex items-center gap-1.5">
              <div className="size-1.5 rounded-full bg-blue-500/70" />
              <span className="text-[9px] font-black uppercase tracking-wider text-[#0c1421]">
                {ownerLabel} · {fmt(createdAt)}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Modified</span>
            <div className="flex items-center gap-1.5">
              <div className="size-1.5 rounded-full bg-amber-500/70" />
              <span className="text-[9px] font-black uppercase tracking-wider text-[#0c1421]">
                {updatedLabel} · {fmt(updatedAt)}
              </span>
            </div>
          </div>
          {sharedWith.length > 0 && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Shared</span>
              <div className="flex items-center gap-1.5">
                <div className="size-1.5 rounded-full bg-indigo-500/70" />
                <span className="text-[9px] font-black uppercase tracking-wider text-[#0c1421]">
                  {sharedWith.length} user{sharedWith.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

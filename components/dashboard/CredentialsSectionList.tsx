"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Search, X } from "lucide-react";
import { Role } from "@prisma/client";
import { Input } from "@/components/ui/input";
import ManageAccessDialog from "@/components/dashboard/ManageAccessDialog";
import CredentialArchiveSectionButton from "@/components/dashboard/CredentialArchiveSectionButton";
import CredentialUnarchiveSectionButton from "@/components/dashboard/CredentialUnarchiveSectionButton";

type AccessUser = { id: string; name: string | null; email: string | null };
type AllUser    = AccessUser & { role: Role };

interface Section {
  id:          string;
  name:        string;
  description: string | null;
  createdAt:   Date;
  updatedAt:   Date;
  _count:      { keys: number };
  owner:       { name: string | null; email: string | null };
  updatedBy:   { name: string | null; email: string | null } | null;
  sharedWith:  AccessUser[];
}

interface Props {
  sections:        Section[];
  isArchivedPortal: boolean;
  canManageAccess:  boolean;
  canArchiveOps:    boolean;
  allUsers:         AllUser[];
  emptyMessage:     string;
}

function fmt(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function CredentialsSectionList({
  sections,
  isArchivedPortal,
  canManageAccess,
  canArchiveOps,
  allUsers,
  emptyMessage,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? sections.filter((s) => {
        const q = query.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          (s.description ?? "").toLowerCase().includes(q)
        );
      })
    : sections;

  return (
    <div className="space-y-6">
      {/* Search bar */}
      {sections.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sections…"
            className="pl-9 pr-9 h-9 bg-white/50 border-white/40 placeholder:text-slate-400 focus-visible:bg-white"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* List */}
      {sections.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Search className="h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">
            No sections match &ldquo;{query}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-xs text-blue-600 hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {filtered.map((section) => {
            const keyCount = section._count.keys;
            const updatedByLabel =
              section.updatedBy?.name ??
              section.updatedBy?.email ??
              (section.owner.name ?? section.owner.email ?? "—");

            return (
              <div
                key={section.id}
                className="group relative flex cursor-pointer flex-col rounded-2xl border border-white/40 bg-white/40 p-6 shadow-sm backdrop-blur-md transition-all hover:bg-white/60 hover:shadow-xl"
              >
                <Link
                  href={`/dashboard/credentials/${section.id}`}
                  className="absolute inset-0 z-[1] rounded-2xl"
                  aria-label={`Open section ${section.name}`}
                />
                <div className="relative z-[2] flex flex-col pointer-events-none">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-[#0c1421] p-2 text-white shadow-lg ring-4 ring-[#0c1421]/5">
                          <KeyRound className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-lg font-black uppercase tracking-tight text-[#0c1421]">
                            {section.name}
                          </h2>
                          {section.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                              {section.description}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-slate-500">
                            {keyCount} key{keyCount !== 1 ? "s" : ""} added
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-[3] flex shrink-0 items-center justify-end gap-2 self-start rounded-xl border border-white/40 bg-white/50 p-1.5 shadow-inner backdrop-blur-md pointer-events-auto">
                      {canManageAccess && !isArchivedPortal && (
                        <ManageAccessDialog
                          type="credential_section"
                          resourceId={section.id}
                          resourceName={section.name}
                          currentAccess={section.sharedWith}
                          allUsers={allUsers}
                        />
                      )}
                      {canArchiveOps &&
                        (isArchivedPortal ? (
                          <CredentialUnarchiveSectionButton
                            sectionId={section.id}
                            sectionName={section.name}
                          />
                        ) : (
                          <CredentialArchiveSectionButton
                            sectionId={section.id}
                            sectionName={section.name}
                          />
                        ))}
                    </div>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-8 border-t border-white/10 pt-8">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Created
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <span className="max-w-[14rem] text-[10px] font-black uppercase tracking-wider text-[#0c1421]">
                          {section.owner.name ?? section.owner.email} · {fmt(section.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Last modified
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.45)]" />
                        <span className="max-w-[14rem] text-[10px] font-black uppercase tracking-wider text-[#0c1421]">
                          {updatedByLabel} · {fmt(section.updatedAt)}
                        </span>
                      </div>
                    </div>
                    {section.sharedWith.length > 0 && (
                      <>
                        <div className="h-8 w-px bg-white/20" />
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                            Shared
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="size-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#0c1421]">
                              {section.sharedWith.length} user{section.sharedWith.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import ArchiveProjectButton from "@/components/dashboard/ArchiveProjectButton";
import { Badge } from "@/components/ui/badge";

export type ProjectCardRow = {
  id:          string;
  name:        string;
  description: string | null;
  /** Full path for display and search, e.g. "my-proj" or "my-proj -> sub-a" */
  displayPath: string;
  secretCount: number;
  noteCount:   number;
};

interface Props {
  rows:                 ProjectCardRow[];
  showProjectCardLink:  boolean;
  canArchive:           boolean;
  isLiveList:           boolean;
}

export default function ProjectGridWithSearch({
  rows,
  showProjectCardLink,
  canArchive,
  isLiveList,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      if (r.displayPath.toLowerCase().includes(q)) return true;
      if (r.description?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [rows, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="sr-only" htmlFor="project-search">
          Search projects
        </label>
        <input
          id="project-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects and subprojects…"
          className="w-full max-w-md rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          autoComplete="off"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-16 text-center">
          <p className="text-sm text-muted-foreground">
            {query.trim()
              ? "No projects match your search."
              : "No projects to show."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group relative rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              {showProjectCardLink && (
                <Link href={`/dashboard/projects/${p.id}`} className="absolute inset-0 rounded-xl" />
              )}

              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-semibold leading-snug" title={p.displayPath}>
                    {p.displayPath.split(" -> ").map((part, i, arr) => (
                      <span key={`${p.id}-t-${i}`}>
                        {i > 0 && (
                          <span className="font-normal text-muted-foreground"> {"->"} </span>
                        )}
                        <span
                          className={
                            i === arr.length - 1 ? "text-foreground" : "font-medium text-muted-foreground"
                          }
                        >
                          {part}
                        </span>
                      </span>
                    ))}
                  </h3>
                  {p.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {p.description}
                    </p>
                  )}
                </div>

                {canArchive && isLiveList && (
                  <div className="relative z-10 shrink-0">
                    <ArchiveProjectButton projectId={p.id} projectName={p.name} />
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  {p.secretCount} secret{p.secretCount !== 1 ? "s" : ""}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {p.noteCount} note{p.noteCount !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

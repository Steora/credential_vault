import * as React from "react";

import { cn } from "@/lib/utils";

type ScrollTableViewportProps = {
  children: React.ReactNode;
  /** Extra classes on the scroll surface (border, radius, background). */
  className?: string;
};

/**
 * Single scroll surface for wide tables: horizontal + vertical scroll live here so
 * columns are never clipped without a scrollbar. Pair with `<Table className="min-w-[…]">`.
 * Ancestors must use `min-w-0` (e.g. flex children) — see dashboard layout.
 */
export function ScrollTableViewport({
  children,
  className,
}: ScrollTableViewportProps) {
  return (
    <div
      className={cn(
        "w-full min-w-0 max-w-full overflow-x-auto overflow-y-auto overscroll-x-contain [scrollbar-gutter:stable]",
        "max-h-[min(80vh,48rem)] rounded-[2rem] border border-white/40 bg-white/30 shadow-2xl backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

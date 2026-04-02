"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { decryptAllProjectSecrets } from "@/app/actions/decrypt";

function CopyAllIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M3 11H2.5A1.5 1.5 0 011 9.5v-7A1.5 1.5 0 012.5 1h7A1.5 1.5 0 0111 2.5V3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M8 8h3M9.5 6.5v3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface Props {
  projectId:   string;
  secretCount: number;
  environment?: string; // <-- ADDED PROP
}

/**
 * Decrypts all accessible secrets in a project (or specific environment) server-side and copies them
 * to the clipboard in .env format (KEY=value, one per line).
 *
 * Only secrets the actor can access are included — same rules as individual
 * copy. The plaintext never lives in the DOM.
 */
export default function CopyAllSecretsButton({ projectId, secretCount, environment }: Props) {
  const [copied, setCopied]              = useState(false);
  const [isPending, startTransition]     = useTransition();

  const handleCopyAll = () => {
    if (isPending || copied) return;

    startTransition(async () => {
      // Pass the environment down to the server action
      const result = await decryptAllProjectSecrets(projectId, environment);

      if (!result.success) {
        toast.error("Could not copy secrets", { description: result.error });
        return;
      }

      const envText = result.entries
        .map(({ key, plaintext }) => `${key}=${plaintext}`)
        .join("\n");

      try {
        await navigator.clipboard.writeText(envText);
        setCopied(true);
        toast.success(`${result.entries.length} secret${result.entries.length !== 1 ? "s" : ""} copied`, {
          description: "Copied as .env format. Values will clear from your clipboard shortly.",
          duration: 4000,
        });
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Clipboard access denied", {
          description: "Allow clipboard access in your browser settings.",
        });
      }
    });
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAll}
            disabled={isPending || secretCount === 0}
            aria-label="Copy all secrets as .env"
            className="h-8 gap-1.5 px-3 text-xs font-medium"
          >
            {copied ? (
              <CheckIcon className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <CopyAllIcon className="h-3.5 w-3.5" />
            )}
            {isPending ? "Copying…" : copied ? "Copied!" : "Copy all"}
          </Button>
        }
      />
      <TooltipContent side="top">
        <p>Copy {environment ? `all ${environment}` : "all"} {secretCount} secret{secretCount !== 1 ? "s" : ""} as .env</p>
      </TooltipContent>
    </Tooltip>
  );
}
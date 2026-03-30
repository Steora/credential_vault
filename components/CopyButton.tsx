"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { decryptSecretValue } from "@/app/actions/decrypt";

// Two icons rendered inline to avoid an extra icon-library dependency.
function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M3 11H2.5A1.5 1.5 0 011 9.5v-7A1.5 1.5 0 012.5 1h7A1.5 1.5 0 0111 2.5V3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
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

interface CopyButtonProps {
  /** The ID of the Secret record to decrypt and copy. */
  secretId: string;
  /** Optional label shown next to the icon (default: "Copy"). */
  label?: string;
  /** Button variant forwarded to Shadcn Button. */
  variant?: "outline" | "ghost" | "secondary";
}

/**
 * Fetches the decrypted value via a Server Action on click,
 * copies it to the clipboard, and shows a Sonner toast.
 *
 * The plaintext never lives in the DOM — it is decrypted server-side,
 * returned to the client, written to the clipboard, then discarded.
 */
export default function CopyButton({
  secretId,
  label = "Copy",
  variant = "outline",
}: CopyButtonProps) {
  const [copied, setCopied]     = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCopy = () => {
    if (isPending || copied) return;

    startTransition(async () => {
      const result = await decryptSecretValue(secretId);

      if (!result.success) {
        toast.error("Could not copy", { description: result.error });
        return;
      }

      try {
        await navigator.clipboard.writeText(result.plaintext);
        setCopied(true);
        toast.success("Copied to clipboard", {
          description: "The secret value has been copied. It will clear in 30 s.",
          duration: 3000,
        });

        // Reset the copied indicator after 2 s.
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
            variant={variant}
            size="sm"
            onClick={handleCopy}
            disabled={isPending}
            aria-label={copied ? "Copied!" : `Copy secret value`}
            className="h-7 gap-1.5 px-2 text-xs font-medium"
          >
            {copied ? (
              <CheckIcon className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <CopyIcon className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied!" : label}
          </Button>
        }
      />
      <TooltipContent side="top">
        <p>{copied ? "Value copied to clipboard" : "Decrypt and copy to clipboard"}</p>
      </TooltipContent>
    </Tooltip>
  );
}

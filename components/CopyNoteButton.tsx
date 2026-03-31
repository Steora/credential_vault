"use client";

import { useState } from "react";
import { toast }    from "sonner";
import { Button }   from "@/components/ui/button";

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

interface Props {
  title:   string;
  content: string;
}

/**
 * Copies the note's title and content to the clipboard.
 * Notes are not encrypted — the content is passed directly as a prop.
 * Visible to all roles (read permission is sufficient to copy).
 */
export default function CopyNoteButton({ title, content }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (copied) return;
    try {
      await navigator.clipboard.writeText(`${title}\n\n${content}`);
      setCopied(true);
      toast.success("Note copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard access denied", {
        description: "Allow clipboard access in your browser settings.",
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      aria-label={copied ? "Copied!" : `Copy note "${title}"`}
      title={copied ? "Copied!" : "Copy"}
      className="h-7 w-7 text-muted-foreground hover:text-foreground"
    >
      {copied ? (
        <CheckIcon className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <CopyIcon className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

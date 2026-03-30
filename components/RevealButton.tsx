"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { decryptSecretValue } from "@/app/actions/decrypt";

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

interface RevealButtonProps {
  secretId:  string;
  secretKey: string;
}

const AUTO_HIDE_MS = 30_000;

/**
 * Decrypts a secret server-side and shows the plaintext in a modal dialog.
 * The value is auto-hidden after 30 seconds and never written to the DOM
 * outside of the dialog.
 */
export default function RevealButton({ secretId, secretKey }: RevealButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [plaintext, setPlaintext]    = useState<string | null>(null);
  const [open, setOpen]              = useState(false);

  // Auto-close and wipe plaintext after AUTO_HIDE_MS
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setOpen(false);
      setPlaintext(null);
    }, AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [open]);

  const handleReveal = () => {
    if (isPending) return;
    startTransition(async () => {
      const result = await decryptSecretValue(secretId);
      if (!result.success) {
        toast.error("Could not reveal secret", { description: result.error });
        return;
      }
      setPlaintext(result.plaintext);
      setOpen(true);
    });
  };

  const handleClose = () => {
    setOpen(false);
    setPlaintext(null);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              onClick={handleReveal}
              disabled={isPending}
              aria-label={`View value of ${secretKey}`}
              className="h-7 gap-1.5 px-2 text-xs font-medium"
            >
              <EyeIcon className="h-3.5 w-3.5" />
              {isPending ? "Loading…" : "View"}
            </Button>
          }
        />
        <TooltipContent side="top">
          <p>Decrypt and view secret value</p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-base">{secretKey}</DialogTitle>
            <DialogDescription>
              This value will be hidden automatically after 30 seconds.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 rounded-lg border border-border bg-muted/40 px-4 py-3">
            <p className="break-all font-mono text-sm select-all">{plaintext}</p>
          </div>

          <p className="text-xs text-muted-foreground">
            Select the text above to copy it manually. It is not written to your clipboard.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

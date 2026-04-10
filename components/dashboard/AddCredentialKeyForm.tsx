"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCredentialKey } from "@/app/actions/credentials";

interface Props {
  sectionId: string;
}

export default function AddCredentialKeyForm({ sectionId }: Props) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const l = label.trim();
    const v = value.trim();
    if (!l || !v) {
      setError("Username and password are required.");
      return;
    }

    startTransition(async () => {
      const result = await createCredentialKey({ sectionId, label: l, value: v });
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success("Credential added.");
      setLabel("");
      setValue("");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-white/40 bg-white/40 p-4"
    >
      <div className="flex w-44 min-w-0 flex-col gap-1.5">
        <label
          htmlFor="credential-key-label"
          className="text-[10px] font-semibold uppercase tracking-widest text-slate-500"
        >
          Username
        </label>
        <Input
          id="credential-key-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Username"
          className="h-9 w-full bg-white/50 border-white/30 placeholder:text-slate-500 font-medium text-[#0c1421] focus-visible:bg-white transition-colors"
          disabled={isPending}
          required
        />
      </div>
      <div className="flex min-w-[12rem] flex-1 flex-col gap-1.5">
        <label
          htmlFor="credential-key-value"
          className="text-[10px] font-semibold uppercase tracking-widest text-slate-500"
        >
          Password
        </label>
        <Input
          id="credential-key-value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Password"
          className="h-9 w-full bg-white/50 border-white/30 placeholder:text-slate-500 font-medium text-[#0c1421] focus-visible:bg-white transition-colors"
          disabled={isPending}
          required
        />
      </div>
      <Button
        type="submit"
        className="h-9 text-[10px] font-black uppercase tracking-widest bg-[#0c1421] text-white hover:bg-black shadow-md"
        disabled={isPending}
      >
        {isPending ? "Saving…" : "Add credential"}
      </Button>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </form>
  );
}

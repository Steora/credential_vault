"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertCircle, Lock, Users } from "lucide-react";

type LoginFormProps = {
  csrfToken:   string;
  callbackUrl: string;
  urlError:    string | null;
};

function GoogleIcon() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginForm({ callbackUrl, urlError }: LoginFormProps) {
  return (
    <div className="w-full max-w-[420px] flex flex-col items-center gap-6">

      {/* Brand mark */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#0c1421] shadow-xl shadow-black/20 ring-1 ring-white/10">
          <Lock className="size-6 text-white" strokeWidth={2} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-[#0c1421] tracking-tight">Credential Vault</h1>
          <p className="mt-0.5 text-sm text-slate-500">Secure team secret management</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_60px_-12px_rgba(0,0,0,0.12)]">

        {/* Top accent bar */}
        <div className="flex items-center gap-2 bg-[#0c1421] px-6 py-3">
          <ShieldCheck className="size-3.5 text-emerald-400" strokeWidth={2.5} />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400">
            AES-256-GCM Encrypted
          </span>
        </div>

        <div className="p-8">
          <div className="mb-7">
            <h2 className="text-xl font-bold text-[#0c1421]">Sign in to your account</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              Authenticate with Google to access the secure vault environment.
            </p>
          </div>

          {urlError && (
            <div
              className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 p-4"
              role="alert"
            >
              <AlertCircle className="mt-px size-4 shrink-0 text-red-500" />
              <p className="text-[12px] font-semibold leading-snug text-red-600">{urlError}</p>
            </div>
          )}

          {/* Google sign-in button */}
          <Button
            onClick={() => signIn("google", { callbackUrl })}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
          >
            <GoogleIcon />
            <span className="text-sm font-semibold">Continue with Google</span>
          </Button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[11px] font-medium text-slate-400">secured access</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
              <ShieldCheck className="size-3.5 shrink-0 text-slate-400" />
              <span className="text-[11px] font-medium text-slate-500">End-to-end encrypted</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
              <Users className="size-3.5 shrink-0 text-slate-400" />
              <span className="text-[11px] font-medium text-slate-500">Invite-only access</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400">
        Protected by role-based access control &amp; audit logging
      </p>
    </div>
  );
}
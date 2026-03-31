"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { acceptInvitation } from "@/app/actions/invitations";

import { getSafeInternalCallbackUrl } from "@/lib/auth-callback-url";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  ) : (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25" />
      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export default function InviteAcceptForm({
  token,
  email,
  roleLabel,
}: {
  token:     string;
  email:     string;
  roleLabel: string;
}) {
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const password = (fd.get("password") as string) ?? "";

    setIsPending(true);
    try {
      const created = await acceptInvitation(null, fd);
      if (!created.success) {
        setError(created.error);
        return;
      }

      const afterLogin = getSafeInternalCallbackUrl("/dashboard/projects");
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: afterLogin,
      });

      if (result?.error) {
        setError("Account created but sign-in failed. Please sign in on the login page.");
        return;
      }

      if (result?.ok) {
        if (result.url) {
          try {
            const u = new URL(result.url, window.location.origin);
            if (u.origin === window.location.origin) {
              window.location.assign(`${u.pathname}${u.search}${u.hash}`);
              return;
            }
          } catch {
            /* fall through */
          }
        }
        window.location.assign(afterLogin);
        return;
      }

      setError("Something went wrong. Please try signing in.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-semibold tracking-tight">Accept invitation</CardTitle>
        <CardDescription>
          Create your account for <span className="font-medium text-foreground">{email}</span> as{" "}
          <span className="font-medium text-foreground">{roleLabel}</span>.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="token" value={token} />

          <div className="space-y-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                required
                minLength={8}
                disabled={isPending}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPw ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                <EyeIcon open={showPw} />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              required
              disabled={isPending}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating account…" : "Create account and continue"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center pt-0">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

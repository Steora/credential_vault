"use client";

import Link from "next/link";
import { useState } from "react";

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

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  ) : (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25" />
      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

type LoginFormProps = {
  csrfToken:   string;
  callbackUrl: string;
  urlError:    string | null;
};

/**
 * Classic form POST to Auth.js credentials callback — no client-side fetch, so it
 * avoids Turbopack / browser environments where `signIn()` from `next-auth/react` fails.
 */
export default function LoginForm({ csrfToken, callbackUrl, urlError }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Sign in
        </CardTitle>
        <CardDescription>
          Enter your credentials to access the vault.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form method="post" action="/api/auth/callback/credentials" className="space-y-4">
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {urlError && (
            <p className="text-sm text-destructive" role="alert">
              {urlError}
            </p>
          )}

          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center pt-0">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

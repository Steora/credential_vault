"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

/**
 * Pins Auth.js client calls to `/api/auth` so signIn/session fetches stay correct
 * even when NEXTAUTH_URL is not inlined into the browser bundle.
 */
export default function AuthSessionProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth" refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}

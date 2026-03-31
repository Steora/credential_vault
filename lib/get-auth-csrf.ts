import "server-only";

import { cookies, headers } from "next/headers";

/** Resolve public origin for server → self fetches (prefers AUTH_URL / NEXTAUTH_URL). */
export async function getServerAppOrigin(): Promise<string> {
  const fromEnv = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const h = await headers();
  const host = h.get("x-forwarded-host")?.split(",")[0]?.trim() ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "http";
  return `${proto}://${host}`;
}

export async function getAuthCsrfToken(): Promise<
  { ok: true; token: string } | { ok: false; error: string }
> {
  try {
    const origin = await getServerAppOrigin();
    const cookieStore = await cookies();
    const cookie = cookieStore
      .getAll()
      .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
      .join("; ");

    const res = await fetch(`${origin}/api/auth/csrf`, {
      headers: cookie ? { cookie } : {},
      cache: "no-store",
    });

    if (!res.ok) {
      return { ok: false, error: `Auth service returned ${res.status}. Check NEXTAUTH_URL / AUTH_URL matches this app URL.` };
    }

    const data = (await res.json()) as { csrfToken?: string };
    if (!data.csrfToken) {
      return { ok: false, error: "No CSRF token from /api/auth/csrf." };
    }

    return { ok: true, token: data.csrfToken };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return {
      ok: false,
      error: `${msg}. Set AUTH_URL or NEXTAUTH_URL to your site origin (e.g. http://localhost:3000).`,
    };
  }
}

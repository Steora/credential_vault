/**
 * proxy.ts — Edge-compatible route protection.
 *
 * Uses NextAuth(authConfig) — authConfig has zero Node.js imports, so this
 * file is safe to run in the Edge runtime.
 *
 * Route access logic lives in authConfig.callbacks.authorized (auth.config.ts).
 */
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: proxy } = NextAuth(authConfig);

export default proxy;

export const config = {
  // Run on every route except Next.js internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

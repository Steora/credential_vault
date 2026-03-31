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
  // Skip /api so Auth.js route handlers (/api/auth/*) are not wrapped by this
  // proxy — wrapping them breaks client signIn/session fetch ("Failed to fetch").
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

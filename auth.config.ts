/**
 * auth.config.ts — Edge-compatible NextAuth configuration.
 *
 * This file must NEVER import anything that uses Node.js built-ins
 * (crypto, fs, net, etc.) because it is loaded by proxy.ts, which
 * runs in the Edge runtime.
 *
 * Node.js-only things (Credentials provider, Prisma adapter, bcrypt)
 * live exclusively in auth.ts and are never imported here.
 */
import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";  // type-only import → stripped at build time

const PUBLIC_PATHS = ["/login", "/register", "/invite", "/api/auth"];

export const authConfig = {
  pages: {
    signIn: "/login",
  },

  session: { strategy: "jwt" },

  callbacks: {
    /**
     * Called by the Edge middleware on every request.
     * Returning false redirects to the signIn page (with callbackUrl preserved).
     * Returning true lets the request through.
     */
    authorized({ auth, request: { nextUrl } }) {
      const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));
      if (isPublic) return true;

      const isLoggedIn = !!auth?.user;
      // Inactive users remain authenticated so they can reach the dashboard shell,
      // which shows a limited “account inactive” state instead of vault content.
      if (isLoggedIn) return true;

      return false;
    },

    /**
     * Persists id and role in the JWT when a user signs in.
     * Runs in the Node.js runtime (auth.ts), not in Edge middleware.
     */
    jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },

    /**
     * Projects id, role, and isActive from the JWT into the session object.
     * Runs in the Node.js runtime (auth.ts), not in Edge middleware.
     */
    session({ session, token }) {
      session.user.id       = token.id       as string;
      session.user.role     = token.role     as Role;
      session.user.isActive = token.isActive as boolean;
      session.user.image    = (token.picture as string | null | undefined) ?? session.user.image;
      if (typeof token.name === "string") session.user.name = token.name;
      return session;
    },
  },

  // Intentionally empty — providers that need Node.js are added in auth.ts.
  providers: [],
} satisfies NextAuthConfig;

/**
 * auth.ts — Full NextAuth configuration (Node.js runtime only).
 *
 * Imports authConfig from auth.config.ts and layers on the Node.js-specific
 * pieces: Credentials provider (needs bcrypt) and Prisma adapter (needs pg).
 *
 * Never import this file from middleware.ts.
 */
import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

import { prisma }     from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  adapter: PrismaAdapter(prisma) as Adapter,

  callbacks: {
    // Keep `authorized` and `session` from authConfig; override `jwt` so that
    // role changes made outside the app (e.g. Prisma Studio) are reflected on
    // the very next request without requiring a sign-out / sign-in cycle.
    ...authConfig.callbacks,

    async jwt({ token, user }) {
      if (user) {
        // Initial sign-in — seed token from the authorize() result.
        token.id       = user.id;
        token.role     = (user as { id: string; role: Role }).role;
        token.isActive = (user as { id: string; role: Role; isActive: boolean }).isActive;
      } else if (token.id) {
        // Every subsequent request — re-fetch role and isActive from DB so that
        // deactivation takes effect on the very next request without sign-out.
        const dbUser = await prisma.user.findUnique({
          where:  { id: token.id as string },
          select: { role: true, isActive: true },
        });
        if (dbUser) {
          token.role     = dbUser.role;
          token.isActive = dbUser.isActive;
        }
      }
      return token;
    },
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const email    = (credentials?.email    as string | undefined)?.trim().toLowerCase();
        const password =  credentials?.password as string | undefined;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return null;

        return {
          id:       user.id,
          email:    user.email,
          name:     user.name ?? undefined,
          role:     user.role,
          isActive: user.isActive,
        };
      },
    }),
  ],
});

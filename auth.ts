/**
 * auth.ts — Full NextAuth configuration (Node.js runtime only).
 *
 * Imports authConfig from auth.config.ts and layers on the Node.js-specific
 * pieces: Google OAuth provider and Prisma adapter (needs pg).
 *
 * Never import this file from middleware.ts.
 */
import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";

import { pictureForJwt } from "@/lib/picture-for-jwt";
import { prisma }     from "@/lib/prisma";
import { authConfig } from "./auth.config";

type GoogleLike = {
  name?: string | null;
  given_name?: string | null;
  family_name?: string | null;
  picture?: string | null;
};

/** Prefer OAuth user, then ID token / userinfo profile (invite rows often have no name until this runs). */
function oauthDisplayName(
  user: { name?: string | null },
  profile: unknown,
): string | null {
  const fromUser = user.name?.trim();
  if (fromUser) return fromUser;
  if (!profile || typeof profile !== "object") return null;
  const p = profile as GoogleLike;
  const parts = [p.given_name, p.family_name].filter(Boolean).join(" ").trim();
  return p.name?.trim() || parts || null;
}

function oauthPicture(user: { image?: string | null }, profile: unknown): string | null {
  const fromUser = user.image?.trim();
  if (fromUser) return fromUser;
  if (!profile || typeof profile !== "object") return null;
  return (profile as GoogleLike).picture?.trim() || null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  adapter: PrismaAdapter(prisma) as Adapter,

  callbacks: {
    // Keep `authorized` and `session` from authConfig; override `jwt` so that
    // role changes made outside the app (e.g. Prisma Studio) are reflected on
    // the very next request without requiring a sign-out / sign-in cycle.
    ...authConfig.callbacks,

    /**
     * Invited users are pre-created with email + role only (no name). The Prisma adapter
     * may not write Google `name` onto that existing row. Backfill name and image here.
     */
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google" || !user?.id) {
        return true;
      }

      const googleName = oauthDisplayName(user, profile);
      const pic = oauthPicture(user, profile);

      const row = await prisma.user.findUnique({
        where:  { id: user.id },
        select: { name: true, image: true },
      });
      if (!row) return true;

      const data: { name?: string; image?: string } = {};
      if (googleName && !row.name?.trim()) {
        data.name = googleName;
      }
      if (pic && !row.image?.trim()) {
        data.image = pic;
      }

      if (Object.keys(data).length > 0) {
        await prisma.user
          .update({ where: { id: user.id }, data })
          .catch(() => {
            /* ignore race with adapter */
          });
      }

      return true;
    },

    async jwt({ token, user, account, profile }) {
      if (user) {
        // Initial sign-in — merge DB row with OAuth `user` + `profile` so the JWT gets
        // Google name/image even when the adapter omits them on the linked user.
        token.id = user.id;
        let dbUser = await prisma.user.findUnique({
          where:  { id: user.id },
          select: { role: true, isActive: true, image: true, name: true },
        });

        const resolvedName = oauthDisplayName(user, profile);
        const resolvedPic = oauthPicture(user, profile);

        if (dbUser && account?.provider === "google") {
          const data: { name?: string; image?: string } = {};
          if (resolvedName && !dbUser.name?.trim()) data.name = resolvedName;
          if (resolvedPic && !dbUser.image?.trim()) data.image = resolvedPic;
          if (Object.keys(data).length > 0) {
            await prisma.user
              .update({ where: { id: user.id }, data })
              .catch(() => {});
            const next = await prisma.user.findUnique({
              where:  { id: user.id },
              select: { role: true, isActive: true, image: true, name: true },
            });
            if (next) dbUser = next;
          }
        }

        if (dbUser) {
          token.role     = dbUser.role;
          token.isActive = dbUser.isActive;
          token.picture  = pictureForJwt(dbUser.image);
          token.name =
            dbUser.name?.trim() ||
            resolvedName ||
            (user as { name?: string | null }).name?.trim() ||
            undefined;
        } else {
          token.role =
            (user as { id: string; role?: Role }).role ?? "USER";
          token.isActive =
            (user as { id: string; isActive?: boolean }).isActive ?? true;
          token.picture = pictureForJwt(
            (user as { image?: string | null }).image ?? undefined,
          );
          token.name =
            resolvedName ||
            (user as { name?: string | null }).name?.trim() ||
            undefined;
        }
      } else if (token.id) {
        // Every subsequent request — re-fetch role and isActive from DB so that
        // deactivation takes effect on the very next request without sign-out.
        const dbUser = await prisma.user.findUnique({
          where:  { id: token.id as string },
          select: { role: true, isActive: true, image: true, name: true },
        });
        if (dbUser) {
          token.role     = dbUser.role;
          token.isActive = dbUser.isActive;
          token.picture = pictureForJwt(dbUser.image);
          token.name     = dbUser.name ?? undefined;
        }
      }
      return token;
    },
  },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
});
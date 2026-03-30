import type { Session } from "next-auth";

export const ACCOUNT_INACTIVE_ERROR = "Your account is inactive.";

/**
 * Vault mutations and sensitive reads require an authenticated, active account.
 */
export function assertActiveVaultSession(
  session: Session | null,
): { ok: true; user: NonNullable<Session["user"]> } | { ok: false; error: string } {
  if (!session?.user) return { ok: false, error: "Unauthorized." };
  if (session.user.isActive === false) return { ok: false, error: ACCOUNT_INACTIVE_ERROR };
  return { ok: true, user: session.user };
}

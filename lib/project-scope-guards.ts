/**
 * MODERATOR vault writes only in projects covered by their expanded assignment tree.
 * ADMIN / SUPERADMIN bypass; other roles are handled by RBAC elsewhere.
 */

import { Role } from "@prisma/client";

import { getVaultProjectIdsForActor, hasUnrestrictedProjectScope } from "@/lib/queries/access";

export async function assertModeratorAssignedToProject(
  actor: { id: string; role: Role },
  projectId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (hasUnrestrictedProjectScope(actor.role)) return { ok: true };
  if (actor.role !== Role.MODERATOR) return { ok: true };

  const scope = await getVaultProjectIdsForActor(actor);
  if (scope.includes(projectId)) return { ok: true };

  return { ok: false, error: "You do not have access to this project." };
}

/**
 * USER / INTERN vault scope — must be a direct `ProjectMember` of the project (or its tree per access.ts).
 */
export async function assertUserInternAssignedToProject(
  actor: { id: string; role: Role },
  projectId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (hasUnrestrictedProjectScope(actor.role)) return { ok: true };
  if (actor.role !== Role.USER && actor.role !== Role.INTERN) {
    return { ok: true };
  }

  const scope = await getVaultProjectIdsForActor(actor);
  if (scope.includes(projectId)) return { ok: true };

  return { ok: false, error: "You are not assigned to this project." };
}

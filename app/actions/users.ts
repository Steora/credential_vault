"use server";

import { ActivityAction, Role } from "@prisma/client";
import { auth } from "@/auth";
import { logActivity } from "@/lib/activity-log";
import { prisma } from "@/lib/prisma";
import { assertActiveVaultSession } from "@/lib/session-guards";

// ---------------------------------------------------------------------------
// Role rank — mirrors lib/permissions.ts but kept local to avoid the Edge
// runtime boundary (this file is Node.js-only).
// ---------------------------------------------------------------------------

const ROLE_RANK: Record<Role, number> = {
  INTERN: 0, USER: 1, MODERATOR: 2, ADMIN: 3, SUPERADMIN: 4,
};

const STATUS_PRIVILEGE_ROLES = new Set<Role>([Role.ADMIN, Role.SUPERADMIN]);

export type UserActionResult =
  | { success: true }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Update role
// ---------------------------------------------------------------------------

/**
 * Changes a user's role.
 *
 * Rules:
 *  - Actor must strictly outrank the target's current role (same-rank cannot modify peer).
 *  - SUPERADMIN may assign any role (including SUPERADMIN).
 *  - Non-SUPERADMIN actors cannot assign a role >= their own rank.
 *  - Self-modification is blocked.
 */
export async function updateUserRole(
  targetId: string,
  newRole: Role,
): Promise<UserActionResult> {
  const session = await auth();
  const vault = assertActiveVaultSession(session);
  if (!vault.ok) return { success: false, error: vault.error };

  const actor = vault.user;

  const target = await prisma.user.findUnique({
    where:  { id: targetId },
    select: { id: true, role: true, email: true },
  });
  if (!target) return { success: false, error: "User not found." };

  if (target.id === actor.id) {
    return { success: false, error: "You cannot change your own role." };
  }

  // Actor must outrank target's current role
  if (ROLE_RANK[actor.role] <= ROLE_RANK[target.role]) {
    return {
      success: false,
      error: `A ${actor.role} cannot modify a ${target.role}.`,
    };
  }

  // Non-SUPERADMIN actors cannot assign a role at or above their own rank
  if (actor.role !== Role.SUPERADMIN && ROLE_RANK[actor.role] <= ROLE_RANK[newRole]) {
    return {
      success: false,
      error: "You cannot assign a role equal to or higher than your own.",
    };
  }

  await prisma.user.update({ where: { id: targetId }, data: { role: newRole } });

  await logActivity({
    actorId:    actor.id,
    action:     ActivityAction.UPDATE,
    entityType: "user",
    entityId:   targetId,
    label:      `${target.email}: ${target.role} → ${newRole}`,
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// Deactivate user (soft delete)
// ---------------------------------------------------------------------------

/**
 * Deactivates a user account by setting isActive = false.
 * Clears all project sharing (Secret/Note sharedWith) so they lose access paths.
 * They can still sign in but the vault layer hides all content until reactivated.
 *
 * Only ADMIN and SUPERADMIN may change status. Same rank-guard as role changes.
 */
export async function deactivateUser(targetId: string): Promise<UserActionResult> {
  const session = await auth();
  const vault = assertActiveVaultSession(session);
  if (!vault.ok) return { success: false, error: vault.error };

  const actor = vault.user;

  if (!STATUS_PRIVILEGE_ROLES.has(actor.role)) {
    return { success: false, error: "Only Admins and Superadmins can change user status." };
  }

  const target = await prisma.user.findUnique({
    where:  { id: targetId },
    select: { id: true, role: true, isActive: true, email: true },
  });
  if (!target) return { success: false, error: "User not found." };

  if (target.id === actor.id) {
    return { success: false, error: "You cannot deactivate your own account." };
  }

  if (!target.isActive) {
    return { success: false, error: "User is already inactive." };
  }

  if (actor.role !== Role.SUPERADMIN && ROLE_RANK[actor.role] <= ROLE_RANK[target.role]) {
    return {
      success: false,
      error: `A ${actor.role} cannot deactivate a ${target.role}.`,
    };
  }

  await prisma.user.update({
    where: { id: targetId },
    data: {
      isActive:      false,
      sharedSecrets: { set: [] },
      sharedNotes:   { set: [] },
    },
  });

  await logActivity({
    actorId:    actor.id,
    action:     ActivityAction.STATUS,
    entityType: "user",
    entityId:   targetId,
    label:      `Deactivated ${target.email}`,
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// Reactivate user
// ---------------------------------------------------------------------------

/**
 * Reactivates a previously deactivated user account (isActive = true).
 * Same rank-guard rules apply.
 */
export async function reactivateUser(targetId: string): Promise<UserActionResult> {
  const session = await auth();
  const vault = assertActiveVaultSession(session);
  if (!vault.ok) return { success: false, error: vault.error };

  const actor = vault.user;

  if (!STATUS_PRIVILEGE_ROLES.has(actor.role)) {
    return { success: false, error: "Only Admins and Superadmins can change user status." };
  }

  const target = await prisma.user.findUnique({
    where:  { id: targetId },
    select: { id: true, role: true, isActive: true, email: true },
  });
  if (!target) return { success: false, error: "User not found." };

  if (target.isActive) {
    return { success: false, error: "User is already active." };
  }

  if (actor.role !== Role.SUPERADMIN && ROLE_RANK[actor.role] <= ROLE_RANK[target.role]) {
    return {
      success: false,
      error: `A ${actor.role} cannot reactivate a ${target.role}.`,
    };
  }

  await prisma.user.update({ where: { id: targetId }, data: { isActive: true } });

  await logActivity({
    actorId:    actor.id,
    action:     ActivityAction.STATUS,
    entityType: "user",
    entityId:   targetId,
    label:      `Reactivated ${target.email}`,
  });

  return { success: true };
}

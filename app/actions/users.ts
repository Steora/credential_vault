"use server";

import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Role rank — mirrors lib/permissions.ts but kept local to avoid the Edge
// runtime boundary (this file is Node.js-only).
// ---------------------------------------------------------------------------

const ROLE_RANK: Record<Role, number> = {
  INTERN: 0, USER: 1, MODERATOR: 2, ADMIN: 3, SUPERADMIN: 4,
};

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
  if (!session?.user) return { success: false, error: "Unauthorized." };

  const actor = session.user;

  const target = await prisma.user.findUnique({
    where:  { id: targetId },
    select: { id: true, role: true },
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
  return { success: true };
}

// ---------------------------------------------------------------------------
// Deactivate user (soft delete)
// ---------------------------------------------------------------------------

/**
 * Deactivates a user account by setting isActive = false.
 * The user record and all their secrets/notes are preserved.
 * They will be blocked from signing in immediately.
 *
 * Same rank-guard rules as hard delete apply here.
 */
export async function deactivateUser(targetId: string): Promise<UserActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized." };

  const actor = session.user;

  const target = await prisma.user.findUnique({
    where:  { id: targetId },
    select: { id: true, role: true, isActive: true },
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

  await prisma.user.update({ where: { id: targetId }, data: { isActive: false } });
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
  if (!session?.user) return { success: false, error: "Unauthorized." };

  const actor = session.user;

  const target = await prisma.user.findUnique({
    where:  { id: targetId },
    select: { id: true, role: true, isActive: true },
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
  return { success: true };
}

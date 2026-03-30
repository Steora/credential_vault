"use server";

import { auth }                 from "@/auth";
import { prisma }               from "@/lib/prisma";
import { canUserPerformAction } from "@/lib/permissions";

export type SharingResult =
  | { success: true }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Auth + permission helper — MODERATOR or above may manage access lists
// ---------------------------------------------------------------------------

async function requireEditor() {
  const session = await auth();
  if (!session?.user) return { actor: null, error: "Unauthorized." };

  const actor = { id: session.user.id, role: session.user.role };
  const canEdit = canUserPerformAction(actor, null, "secret", "update");
  if (!canEdit) return { actor: null, error: "Only Moderators and above can manage access." };

  return { actor, error: null };
}

// ---------------------------------------------------------------------------
// Secret sharing
// ---------------------------------------------------------------------------

export async function addUserToSecret(
  secretId: string,
  userId: string,
): Promise<SharingResult> {
  const { error } = await requireEditor();
  if (error) return { success: false, error };

  const secret = await prisma.secret.findUnique({ where: { id: secretId }, select: { id: true } });
  if (!secret) return { success: false, error: "Secret not found." };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { success: false, error: "User not found." };

  await prisma.secret.update({
    where: { id: secretId },
    data:  { sharedWith: { connect: { id: userId } } },
  });

  return { success: true };
}

export async function removeUserFromSecret(
  secretId: string,
  userId: string,
): Promise<SharingResult> {
  const { error } = await requireEditor();
  if (error) return { success: false, error };

  await prisma.secret.update({
    where: { id: secretId },
    data:  { sharedWith: { disconnect: { id: userId } } },
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// Note sharing
// ---------------------------------------------------------------------------

export async function addUserToNote(
  noteId: string,
  userId: string,
): Promise<SharingResult> {
  const { error } = await requireEditor();
  if (error) return { success: false, error };

  const note = await prisma.note.findUnique({ where: { id: noteId }, select: { id: true } });
  if (!note) return { success: false, error: "Note not found." };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { success: false, error: "User not found." };

  await prisma.note.update({
    where: { id: noteId },
    data:  { sharedWith: { connect: { id: userId } } },
  });

  return { success: true };
}

export async function removeUserFromNote(
  noteId: string,
  userId: string,
): Promise<SharingResult> {
  const { error } = await requireEditor();
  if (error) return { success: false, error };

  await prisma.note.update({
    where: { id: noteId },
    data:  { sharedWith: { disconnect: { id: userId } } },
  });

  return { success: true };
}

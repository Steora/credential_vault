"use server";

import { z } from "zod";
import { ActivityAction, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertActiveVaultSession } from "@/lib/session-guards";
import { canUserPerformAction } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import { type QueryActor } from "@/lib/queries/access";
import { VAULT_ENTITY_STATUS } from "@/lib/vault-entity-status";

const ROLE_RANK: Record<Role, number> = {
  [Role.INTERN]:     0,
  [Role.USER]:       1,
  [Role.MODERATOR]:  2,
  [Role.ADMIN]:      3,
  [Role.SUPERADMIN]: 4,
};

const SectionSchema = z.object({
  name:        z.string().min(1, "Section name is required."),
  description: z.string().max(10_000).optional(),
  parentId:    z.string().optional(),
});

const KeySchema = z.object({
  sectionId: z.string().min(1, "Section is required."),
  label:     z.string().min(1, "Key name is required."),
  value:     z.string().min(1, "Value is required."),
});

const KeyUpdateSchema = z.object({
  label: z.string().min(1, "Username is required."),
  value: z.string().min(1, "Password is required."),
});

export type CredentialActionResult =
  | { success: true; id?: string; pendingApproval?: boolean }
  | { success: false; error: string };

const SectionIdSchema = z.object({
  sectionId: z.string().min(1, "Section is required."),
});

function denyIfIntern(role: Role): string | null {
  if (role === Role.INTERN) return "Interns cannot modify credentials.";
  return null;
}

// CREATE SECTION or SUBSECTION (USER/MOD/ADMIN/SUPERADMIN – no interns)

export async function createCredentialSection(
  raw: z.infer<typeof SectionSchema>,
): Promise<CredentialActionResult> {
  const session = await auth();
  const vault = assertActiveVaultSession(session);
  if (!vault.ok) return { success: false, error: vault.error };

  const deny = denyIfIntern(vault.user.role);
  if (deny) return { success: false, error: deny };

  const descTrimmed = raw.description?.trim();
  const parsed = SectionSchema.safeParse({
    name:        raw.name?.trim(),
    description: descTrimmed && descTrimmed.length > 0 ? descTrimmed : undefined,
    parentId:    raw.parentId?.trim() || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // If creating a subsection, verify the parent exists and is active.
  if (parsed.data.parentId) {
    const parent = await prisma.credentialSection.findFirst({
      where:  { id: parsed.data.parentId, status: VAULT_ENTITY_STATUS.ACTIVE },
      select: { id: true },
    });
    if (!parent) {
      return { success: false, error: "Parent section not found or is archived." };
    }
  }

  const section = await prisma.credentialSection.create({
    data: {
      name:        parsed.data.name,
      description: parsed.data.description ?? null,
      parentId:    parsed.data.parentId ?? null,
      ownerId:     vault.user.id,
      updatedById: vault.user.id,
    },
    select: { id: true },
  });

  await logActivity({
    actorId:    vault.user.id,
    action:     ActivityAction.CREATE,
    entityType: parsed.data.parentId ? "credential_subsection" : "credential_section",
    entityId:   section.id,
    label:      parsed.data.name,
  });

  revalidatePath("/dashboard/credentials");
  if (parsed.data.parentId) {
    revalidatePath(`/dashboard/credentials/${parsed.data.parentId}`);
  }

  return { success: true, id: section.id };
}

// ADD KEY — MODERATOR/ADMIN/SUPERADMIN only.

export async function createCredentialKey(
  raw: z.infer<typeof KeySchema>,
): Promise<CredentialActionResult> {
  const session = await auth();
  const vault = assertActiveVaultSession(session);
  if (!vault.ok) return { success: false, error: vault.error };

  // Only MODERATOR and above may create credential keys directly.
  if (ROLE_RANK[vault.user.role] < ROLE_RANK[Role.MODERATOR]) {
    return {
      success: false,
      error:   "Only Moderators and above can add credentials.",
    };
  }

  const actor: QueryActor = {
    id:       vault.user.id,
    role:     vault.user.role,
    isActive: vault.user.isActive,
  };

  const parsed = KeySchema.safeParse({
    sectionId: raw.sectionId?.trim(),
    label:     raw.label?.trim(),
    value:     raw.value?.trim(),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (!canUserPerformAction(actor, null, "secret", "create")) {
    return {
      success: false,
      error:   `Your role (${vault.user.role}) is not permitted to add credentials.`,
    };
  }

  const sectionActive = { id: parsed.data.sectionId, status: VAULT_ENTITY_STATUS.ACTIVE };
  const section = await prisma.credentialSection.findFirst({
    where:  sectionActive,
    select: { id: true },
  });
  if (!section) {
    return { success: false, error: "Section is archived or not found." };
  }

  const key = await prisma.credentialKey.create({
    data: {
      sectionId:   parsed.data.sectionId,
      label:       parsed.data.label,
      value:       parsed.data.value,
      ownerId:     vault.user.id,
      updatedById: vault.user.id,
    },
    select: { id: true, sectionId: true },
  });

  await prisma.credentialSection.update({
    where: { id: key.sectionId },
    data:  { updatedById: vault.user.id },
  });

  await logActivity({
    actorId:    vault.user.id,
    action:     ActivityAction.CREATE,
    entityType: "credential_key",
    entityId:   key.id,
    label:      parsed.data.label,
  });

  revalidatePath("/dashboard/credentials");
  revalidatePath(`/dashboard/credentials/${parsed.data.sectionId}`);

  return { success: true, id: key.id };
}

// EDIT KEY — USER and above (not INTERN).

export async function updateCredentialKey(
  id: string,
  data: z.infer<typeof KeyUpdateSchema>,
): Promise<CredentialActionResult> {
  const session = await auth();
  const vault = assertActiveVaultSession(session);
  if (!vault.ok) return { success: false, error: vault.error };

  if (vault.user.role === Role.INTERN) {
    return { success: false, error: "Interns cannot edit credentials." };
  }

  const parsed = KeyUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // Build the section access filter: USER must be in sharedWith; MOD+ unrestricted.
  const sectionAccessFilter =
    vault.user.role === Role.USER
      ? { sharedWith: { some: { id: vault.user.id } } }
      : {};

  const key = await prisma.credentialKey.findFirst({
    where: {
      id,
      section: { status: VAULT_ENTITY_STATUS.ACTIVE, ...sectionAccessFilter },
    },
    select: { id: true, sectionId: true },
  });
  if (!key) {
    return { success: false, error: "Credential not found or access denied." };
  }

  await prisma.credentialKey.update({
    where: { id: key.id },
    data:  { label: parsed.data.label, value: parsed.data.value, updatedById: vault.user.id },
  });

  await prisma.credentialSection.update({
    where: { id: key.sectionId },
    data:  { updatedById: vault.user.id },
  });

  await logActivity({
    actorId:    vault.user.id,
    action:     ActivityAction.UPDATE,
    entityType: "credential_key",
    entityId:   key.id,
    label:      parsed.data.label,
  });

  revalidatePath("/dashboard/credentials");
  revalidatePath(`/dashboard/credentials/${key.sectionId}`);

  return { success: true, id: key.id };
}

// DELETE KEY — ADMIN and SUPERADMIN only.

export async function deleteCredentialKey(id: string): Promise<CredentialActionResult> {
  const session = await auth();
  const vault = assertActiveVaultSession(session);
  if (!vault.ok) return { success: false, error: vault.error };

  if (ROLE_RANK[vault.user.role] < ROLE_RANK[Role.ADMIN]) {
    return { success: false, error: "Only Admins and above can delete credentials." };
  }

  const key = await prisma.credentialKey.findUnique({
    where:  { id },
    select: { id: true, sectionId: true, label: true },
  });
  if (!key) return { success: false, error: "Credential not found." };

  await prisma.credentialKey.delete({ where: { id: key.id } });

  await prisma.credentialSection.update({
    where: { id: key.sectionId },
    data:  { updatedById: vault.user.id },
  });

  await logActivity({
    actorId:    vault.user.id,
    action:     ActivityAction.DELETE,
    entityType: "credential_key",
    entityId:   key.id,
    label:      key.label,
  });

  revalidatePath("/dashboard/credentials");
  revalidatePath(`/dashboard/credentials/${key.sectionId}`);

  return { success: true };
}

export async function archiveCredentialSection(
  raw: z.infer<typeof SectionIdSchema>,
): Promise<CredentialActionResult> {
  const session = await auth();
  const vault = assertActiveVaultSession(session);
  if (!vault.ok) return { success: false, error: vault.error };

  const deny = denyIfIntern(vault.user.role);
  if (deny) return { success: false, error: deny };

  const actor = { id: vault.user.id, role: vault.user.role };
  if (!canUserPerformAction(actor, null, "secret", "delete")) {
    return {
      success: false,
      error: `Your role (${vault.user.role}) is not permitted to archive sections.`,
    };
  }

  const parsed = SectionIdSchema.safeParse({ sectionId: raw.sectionId?.trim() });
  if (!parsed.success) return { success: false, error: "Invalid section." };

  await prisma.credentialSection.update({
    where: { id: parsed.data.sectionId },
    data:  { status: VAULT_ENTITY_STATUS.ARCHIVED, updatedById: vault.user.id },
  });

  // #region agent log
  fetch("http://127.0.0.1:7402/ingest/5a32ded7-2a5d-4786-a09f-95b469bd8a79", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "d56f2a",
    },
    body: JSON.stringify({
      sessionId: "d56f2a",
      runId: "feature-debug",
      hypothesisId: "H2",
      location: "app/actions/credentials.ts:archiveCredentialSection",
      message: "Section archived",
      data: { sectionId: parsed.data.sectionId },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion agent log

  await logActivity({
    actorId:    vault.user.id,
    action:     ActivityAction.ARCHIVE,
    entityType: "credential_section",
    entityId:   parsed.data.sectionId,
    label:      "Archived credential section",
  });

  revalidatePath("/dashboard/credentials");
  revalidatePath(`/dashboard/credentials/${parsed.data.sectionId}`);
  return { success: true, id: parsed.data.sectionId };
}

export async function unarchiveCredentialSection(
  raw: z.infer<typeof SectionIdSchema>,
): Promise<CredentialActionResult> {
  const session = await auth();
  const vault = assertActiveVaultSession(session);
  if (!vault.ok) return { success: false, error: vault.error };

  const deny = denyIfIntern(vault.user.role);
  if (deny) return { success: false, error: deny };

  const actor = { id: vault.user.id, role: vault.user.role };
  if (!canUserPerformAction(actor, null, "secret", "delete")) {
    return {
      success: false,
      error: `Your role (${vault.user.role}) is not permitted to unarchive sections.`,
    };
  }

  const parsed = SectionIdSchema.safeParse({ sectionId: raw.sectionId?.trim() });
  if (!parsed.success) return { success: false, error: "Invalid section." };

  await prisma.credentialSection.update({
    where: { id: parsed.data.sectionId },
    data:  { status: VAULT_ENTITY_STATUS.ACTIVE, updatedById: vault.user.id },
  });

  // #region agent log
  fetch("http://127.0.0.1:7402/ingest/5a32ded7-2a5d-4786-a09f-95b469bd8a79", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "d56f2a",
    },
    body: JSON.stringify({
      sessionId: "d56f2a",
      runId: "feature-debug",
      hypothesisId: "H3",
      location: "app/actions/credentials.ts:unarchiveCredentialSection",
      message: "Section unarchived",
      data: { sectionId: parsed.data.sectionId },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion agent log

  await logActivity({
    actorId:    vault.user.id,
    action:     ActivityAction.STATUS,
    entityType: "credential_section",
    entityId:   parsed.data.sectionId,
    label:      "Unarchived credential section",
  });

  revalidatePath("/dashboard/credentials");
  revalidatePath(`/dashboard/credentials/${parsed.data.sectionId}`);
  return { success: true, id: parsed.data.sectionId };
}

/** Form-bound actions (inline `action={async ...}` in RSC is unreliable with Turbopack). */

export async function createCredentialSectionFormAction(formData: FormData): Promise<void> {
  const name = formData.get("name")?.toString() ?? "";
  const description = formData.get("description")?.toString() ?? "";
  await createCredentialSection({ name, description: description || undefined });
}

export async function createCredentialKeyFormAction(formData: FormData): Promise<void> {
  const sectionId = formData.get("sectionId")?.toString() ?? "";
  const label = formData.get("label")?.toString() ?? "";
  const value = formData.get("value")?.toString() ?? "";
  await createCredentialKey({ sectionId, label, value });
}

export async function archiveCredentialSectionFormAction(formData: FormData): Promise<void> {
  const sectionId = formData.get("sectionId")?.toString() ?? "";
  await archiveCredentialSection({ sectionId });
}

export async function unarchiveCredentialSectionFormAction(formData: FormData): Promise<void> {
  const sectionId = formData.get("sectionId")?.toString() ?? "";
  await unarchiveCredentialSection({ sectionId });
}
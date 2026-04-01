"use server";

import { ActivityAction, NoteType, PendingSubmissionStatus, Role } from "@prisma/client";

import { auth } from "@/auth";
import { logActivity } from "@/lib/activity-log";
import { prisma } from "@/lib/prisma";
import { assertActiveVaultSession } from "@/lib/session-guards";
import { vaultWhereActive } from "@/lib/vault-entity-status";

const APPROVER_ROLES = new Set<Role>([Role.ADMIN, Role.SUPERADMIN]);

function assertApprover(role: Role): boolean {
  return APPROVER_ROLES.has(role);
}

export type ApprovalsListResult = {
  secrets: {
    id:         string;
    createdAt:  string;
    key:        string;
    projectName: string;
    submitterEmail: string | null;
    submitterName:  string | null;
  }[];
  notes: {
    id:         string;
    createdAt:  string;
    title:      string;
    type:       NoteType;
    projectName: string | null;
    submitterEmail: string | null;
    submitterName:  string | null;
  }[];
};

export async function listPendingApprovals(): Promise<ApprovalsListResult | { error: string }> {
  const session = await auth();
  const vault = assertActiveVaultSession(session);
  if (!vault.ok) return { error: vault.error };
  if (!assertApprover(vault.user.role)) return { error: "Forbidden." };

  const [secrets, notes] = await Promise.all([
    prisma.pendingSecretSubmission.findMany({
      where:  { status: PendingSubmissionStatus.PENDING },
      orderBy: { createdAt: "desc" },
      include: {
        project:   { select: { name: true } },
        submitter: { select: { email: true, name: true } },
      },
    }),
    prisma.pendingNoteSubmission.findMany({
      where:  { status: PendingSubmissionStatus.PENDING },
      orderBy: { createdAt: "desc" },
      include: {
        project:   { select: { name: true } },
        submitter: { select: { email: true, name: true } },
      },
    }),
  ]);

  return {
    secrets: secrets.map((s) => ({
      id:             s.id,
      createdAt:      s.createdAt.toISOString(),
      key:            s.key,
      projectName:    s.project.name,
      submitterEmail: s.submitter.email,
      submitterName:  s.submitter.name,
    })),
    notes: notes.map((n) => ({
      id:             n.id,
      createdAt:      n.createdAt.toISOString(),
      title:          n.title,
      type:           n.type,
      projectName:    n.project?.name ?? null,
      submitterEmail: n.submitter.email,
      submitterName:  n.submitter.name,
    })),
  };
}

export type ApprovalActionResult = { success: true } | { success: false; error: string };

export async function approvePendingSecret(id: string): Promise<ApprovalActionResult> {
  const session = await auth();
  const vault = assertActiveVaultSession(session);
  if (!vault.ok) return { success: false, error: vault.error };
  if (!assertApprover(vault.user.role)) return { success: false, error: "Forbidden." };

  const pending = await prisma.pendingSecretSubmission.findFirst({
    where: { id, status: PendingSubmissionStatus.PENDING },
  });
  if (!pending) return { success: false, error: "Request not found or already handled." };

  const proj = await prisma.project.findFirst({
    where: { id: pending.projectId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!proj) return { success: false, error: "Project is not available." };

  const secret = await prisma.$transaction(async (tx) => {
    const s = await tx.secret.create({
      data: {
        key:            pending.key,
        encryptedValue: pending.encryptedValue,
        iv:             pending.iv,
        projectId:      pending.projectId,
        ownerId:        pending.submitterId,
      },
      select: { id: true },
    });

    await tx.project.update({
      where: { id: pending.projectId },
      data:  { updatedById: pending.submitterId },
    });

    await tx.pendingSecretSubmission.update({
      where: { id },
      data: {
        status:       PendingSubmissionStatus.APPROVED,
        reviewedById: vault.user.id,
        reviewedAt:   new Date(),
      },
    });

    return s;
  });

  await logActivity({
    actorId:    vault.user.id,
    action:     ActivityAction.CREATE,
    entityType: "secret",
    entityId:   secret.id,
    label:      `Approved pending: ${pending.key}`,
  });

  return { success: true };
}

export async function rejectPendingSecret(
  id: string,
  reason?: string | null,
): Promise<ApprovalActionResult> {
  const session = await auth();
  const vault = assertActiveVaultSession(session);
  if (!vault.ok) return { success: false, error: vault.error };
  if (!assertApprover(vault.user.role)) return { success: false, error: "Forbidden." };

  const r = await prisma.pendingSecretSubmission.updateMany({
    where: { id, status: PendingSubmissionStatus.PENDING },
    data: {
      status:        PendingSubmissionStatus.REJECTED,
      reviewedById:  vault.user.id,
      reviewedAt:    new Date(),
      rejectionNote: reason?.trim() || null,
    },
  });
  if (r.count === 0) return { success: false, error: "Request not found or already handled." };
  return { success: true };
}

export async function approvePendingNote(id: string): Promise<ApprovalActionResult> {
  const session = await auth();
  const vault = assertActiveVaultSession(session);
  if (!vault.ok) return { success: false, error: vault.error };
  if (!assertApprover(vault.user.role)) return { success: false, error: "Forbidden." };

  const pending = await prisma.pendingNoteSubmission.findFirst({
    where: { id, status: PendingSubmissionStatus.PENDING },
  });
  if (!pending) return { success: false, error: "Request not found or already handled." };

  // If originalNoteId is set, this is an EDIT to an existing note.
  if (pending.originalNoteId) {
    const existing = await prisma.note.findFirst({
      where: { id: pending.originalNoteId, ...vaultWhereActive },
      select: { id: true },
    });
    if (!existing) {
      return { success: false, error: "Linked note no longer exists." };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const note = await tx.note.update({
        where: { id: existing.id },
        data:  {
          title:       pending.title,
          content:     pending.content,
          updatedById: pending.submitterId,
        },
        select: { id: true, projectId: true },
      });

      if (note.projectId) {
        await tx.project.update({
          where: { id: note.projectId },
          data:  { updatedById: pending.submitterId },
        });
      }

      await tx.pendingNoteSubmission.update({
        where: { id },
        data:  {
          status:       PendingSubmissionStatus.APPROVED,
          reviewedById: vault.user.id,
          reviewedAt:   new Date(),
        },
      });

      return note;
    });

    await logActivity({
      actorId:    vault.user.id,
      action:     ActivityAction.UPDATE,
      entityType: "note",
      entityId:   updated.id,
      label:      `Approved note edit: ${pending.title}`,
    });
  } else {
    if (pending.type === NoteType.PROJECT_BASED && pending.projectId) {
      const proj = await prisma.project.findFirst({
        where: { id: pending.projectId, ...vaultWhereActive },
        select: { id: true },
      });
      if (!proj) return { success: false, error: "Linked project no longer exists." };
    }

    const created = await prisma.$transaction(async (tx) => {
      const note = await tx.note.create({
        data: {
          title:     pending.title,
          content:   pending.content,
          type:      pending.type,
          projectId:
            pending.type === NoteType.PROJECT_BASED ? pending.projectId : null,
          ownerId:   pending.submitterId,
        },
        select: { id: true, projectId: true },
      });

      if (note.projectId) {
        await tx.project.update({
          where: { id: note.projectId },
          data:  { updatedById: pending.submitterId },
        });
      }

      await tx.pendingNoteSubmission.update({
        where: { id },
        data: {
          status:       PendingSubmissionStatus.APPROVED,
          reviewedById: vault.user.id,
          reviewedAt:   new Date(),
        },
      });

      return note;
    });

    await logActivity({
      actorId:    vault.user.id,
      action:     ActivityAction.CREATE,
      entityType: "note",
      entityId:   created.id,
      label:      `Approved pending note: ${pending.title}`,
    });
  }

  return { success: true };
}

export async function rejectPendingNote(
  id: string,
  reason?: string | null,
): Promise<ApprovalActionResult> {
  const session = await auth();
  const vault = assertActiveVaultSession(session);
  if (!vault.ok) return { success: false, error: vault.error };
  if (!assertApprover(vault.user.role)) return { success: false, error: "Forbidden." };

  const r = await prisma.pendingNoteSubmission.updateMany({
    where: { id, status: PendingSubmissionStatus.PENDING },
    data: {
      status:        PendingSubmissionStatus.REJECTED,
      reviewedById:  vault.user.id,
      reviewedAt:    new Date(),
      rejectionNote: reason?.trim() || null,
    },
  });
  if (r.count === 0) return { success: false, error: "Request not found or already handled." };
  return { success: true };
}

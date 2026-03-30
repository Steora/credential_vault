"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canUserPerformAction } from "@/lib/permissions";

const ProjectSchema = z.object({
  name:        z.string().trim().min(1, "Project name is required."),
  description: z.string().trim().optional(),
});

export type ProjectResult =
  | { success: true;  id: string }
  | { success: false; error: string };

export async function createProject(
  _prev: ProjectResult | null,
  formData: FormData,
): Promise<ProjectResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized." };

  const actor = { id: session.user.id, role: session.user.role };
  if (!canUserPerformAction(actor, null, "project", "create")) {
    return { success: false, error: "Only Admins and above can create projects." };
  }

  const parsed = ProjectSchema.safeParse({
    name:        formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const existing = await prisma.project.findUnique({
    where:  { name: parsed.data.name },
    select: { id: true },
  });
  if (existing) {
    return { success: false, error: `A project named "${parsed.data.name}" already exists.` };
  }

  const project = await prisma.project.create({
    data:   { name: parsed.data.name, description: parsed.data.description },
    select: { id: true },
  });

  return { success: true, id: project.id };
}

export async function deleteProject(projectId: string): Promise<ProjectResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized." };

  const actor = { id: session.user.id, role: session.user.role };
  if (!canUserPerformAction(actor, null, "project", "delete")) {
    return { success: false, error: "Only Admins and above can delete projects." };
  }

  const project = await prisma.project.findUnique({
    where:  { id: projectId },
    select: { id: true },
  });
  if (!project) return { success: false, error: "Project not found." };

  await prisma.project.delete({ where: { id: projectId } });
  return { success: true, id: projectId };
}

"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type UpdateProfileResult =
  | { success: true }
  | { success: false; error: string };

const ProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80, "Name is too long."),
});

export async function updateProfile(
  _prev: UpdateProfileResult | null,
  formData: FormData,
): Promise<UpdateProfileResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized." };

  const raw = {
    name: (formData.get("name") as string | null) ?? "",
  };
  const removeAvatar = formData.get("removeAvatar") === "1";

  const parsed = ProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Invalid input." };
  }

  const file = formData.get("avatarFile");
  /** Empty file inputs still send a File with size 0 — must not run upload branch or it overrides "Use initials". */
  const hasAvatarUpload =
    file &&
    typeof file === "object" &&
    "arrayBuffer" in file &&
    typeof (file as File).size === "number" &&
    (file as File).size > 0;

  const data: { name: string; image?: string | null } = {
    name: parsed.data.name,
  };

  if (hasAvatarUpload) {
    const typed = file as File;
    if (typed.size > 512 * 1024) {
      return { success: false, error: "Avatar must be smaller than 512KB." };
    }
    if (typed.type && !typed.type.startsWith("image/")) {
      return { success: false, error: "Avatar must be an image file." };
    }
    const buf = Buffer.from(await typed.arrayBuffer());
    const base64 = buf.toString("base64");
    const mime = typed.type || "image/png";
    data.image = `data:${mime};base64,${base64}`;
  } else if (removeAvatar) {
    data.image = null;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  return { success: true };
}


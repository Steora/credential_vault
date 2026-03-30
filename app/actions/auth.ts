"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { signIn }  from "@/auth";
import { prisma }  from "@/lib/prisma";

export type LoginResult =
  | { success: true }
  | { success: false; error: string };

export async function loginAction(
  _prev: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const email    = (formData.get("email")    as string | null)?.trim().toLowerCase() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const callbackUrl = (formData.get("callbackUrl") as string | null) ?? "/";

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid email or password." };
        default:
          return { success: false, error: "Something went wrong. Please try again." };
      }
    }
    // signIn throws a redirect — re-throw so Next.js handles it
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

const RegisterSchema = z.object({
  name:            z.string().trim().min(1, "Name is required."),
  email:           z.string().trim().toLowerCase().email("Enter a valid email address."),
  password:        z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export type RegisterResult =
  | { success: true }
  | { success: false; error: string };

export async function registerAction(
  _prev: RegisterResult | null,
  formData: FormData
): Promise<RegisterResult> {
  const raw = {
    name:            formData.get("name")            as string,
    email:           formData.get("email")           as string,
    password:        formData.get("password")        as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Invalid input." };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with that email already exists." };
  }

  const pendingInvite = await prisma.userInvitation.findFirst({
    where: { email, acceptedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true },
  });
  if (pendingInvite) {
    return {
      success: false,
      error: "An invitation is pending for this email. Check your inbox or ask an admin to resend.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, email, passwordHash },
  });

  // Sign the new user in immediately and redirect to the dashboard
  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Account created but sign-in failed. Please log in." };
    }
    throw error;
  }
}

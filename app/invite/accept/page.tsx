import Link from "next/link";
import { prisma } from "@/lib/prisma";
import InviteAcceptForm from "./InviteAcceptForm";

export default async function InviteAcceptPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token?.trim()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold">Invalid link</h1>
          <p className="text-sm text-muted-foreground">
            This invitation link is missing a token. Ask your administrator for a new invite.
          </p>
          <Link href="/login" className="text-sm font-medium underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  const invitation = await prisma.userInvitation.findUnique({
    where:  { token: token.trim() },
    select: { email: true, role: true, expiresAt: true, acceptedAt: true },
  });

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold">Invitation not found</h1>
          <p className="text-sm text-muted-foreground">
            This link may have been replaced by a newer invite, or the token is incorrect.
          </p>
          <Link href="/login" className="text-sm font-medium underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (invitation.acceptedAt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold">Already accepted</h1>
          <p className="text-sm text-muted-foreground">This invitation was already used. Sign in with your email and password.</p>
          <Link href="/login" className="text-sm font-medium underline-offset-4 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (invitation.expiresAt.getTime() < Date.now()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold">Invitation expired</h1>
          <p className="text-sm text-muted-foreground">
            Ask your administrator to send a new invitation to {invitation.email}.
          </p>
          <Link href="/login" className="text-sm font-medium underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <InviteAcceptForm token={token.trim()} email={invitation.email} roleLabel={invitation.role} />
    </div>
  );
}

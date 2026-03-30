"use client";

import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function InactiveAccountShell() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
    toast.success("Signed out successfully.");
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-8">
      <div className="max-w-md space-y-2 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Account inactive</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your account has been deactivated. You can still sign in, but you cannot access projects,
          credentials, or notes until an administrator reactivates your account.
        </p>
      </div>
      <Button type="button" variant="outline" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  );
}

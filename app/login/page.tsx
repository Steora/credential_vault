import { getAuthCsrfToken } from "@/lib/get-auth-csrf";
import { getSafeInternalCallbackUrl } from "@/lib/auth-callback-url";
import { formatAuthSignInError } from "@/lib/auth-sign-in-error";

import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const callbackUrl = getSafeInternalCallbackUrl(sp.callbackUrl);
  const urlError = formatAuthSignInError(sp.error);

  const csrf = await getAuthCsrfToken();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      {csrf.ok ? (
        <LoginForm csrfToken={csrf.token} callbackUrl={callbackUrl} urlError={urlError} />
      ) : (
        <div className="w-full max-w-sm rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          <p className="font-semibold">Cannot load sign-in</p>
          <p className="mt-2 text-muted-foreground">{csrf.error}</p>
        </div>
      )}
    </div>
  );
}

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4">
      {/* Subtle radial glow behind the card */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-3xl" />
      </div>
      {/* Content sits above the glow */}
      <div className="relative z-10 w-full flex justify-center">
        {csrf.ok ? (
          <LoginForm csrfToken={csrf.token} callbackUrl={callbackUrl} urlError={urlError} />
        ) : (
          <div className="w-full max-w-sm rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            <p className="font-semibold">Cannot load sign-in</p>
            <p className="mt-2 text-muted-foreground">{csrf.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

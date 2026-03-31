/** NextAuth / Auth.js `error` query values on the sign-in page. */
export function formatAuthSignInError(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "CredentialsSignin":
      return "Invalid email or password.";
    case "Configuration":
      return "Authentication is misconfigured. Contact an administrator.";
    case "AccessDenied":
      return "Access denied.";
    default:
      return "Sign in failed. Please try again.";
  }
}

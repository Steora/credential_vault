/** Only allow same-origin relative paths (blocks open redirects). */
export function getSafeInternalCallbackUrl(raw: string | null | undefined): string {
  if (raw == null) return "/";
  const s = raw.trim();
  if (s === "") return "/";
  if (!s.startsWith("/") || s.startsWith("//")) return "/";
  return s;
}

/**
 * Two-letter initials for avatars: prefer given name + family name,
 * else first two alphanumeric characters of the email local part.
 */
export function getUserInitials(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  const trimmedName = name?.trim();
  if (trimmedName) {
    const parts = trimmedName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const a = parts[0][0];
      const b = parts[parts.length - 1][0];
      if (a && b) return (a + b).toUpperCase();
    }
    const single = parts[0] ?? trimmedName;
    if (single.length >= 2) return single.slice(0, 2).toUpperCase();
    if (single.length === 1) {
      const e = email?.trim()[0];
      return (single + (e ?? "U")).slice(0, 2).toUpperCase();
    }
  }

  const local = email?.trim().split("@")[0] ?? "user";
  const alnum = local.replace(/[^a-zA-Z0-9]/g, "");
  if (alnum.length >= 2) return alnum.slice(0, 2).toUpperCase();
  if (alnum.length === 1) return (alnum + "U").toUpperCase();
  return "U";
}

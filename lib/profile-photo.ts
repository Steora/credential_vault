/**
 * Resolves a stored profile `image` string to a usable `<img src>`.
 * Supports OAuth provider URLs (e.g. Google `https://lh3.googleusercontent.com/...`),
 * uploaded data URLs, and client `blob:` previews.
 */
export function profilePhotoSrc(
  image: string | null | undefined,
): string | undefined {
  const s = image?.trim();
  if (!s) return undefined;
  if (s.startsWith("data:image/")) return s;
  if (s.startsWith("blob:")) return s;
  if (s.startsWith("https://") || s.startsWith("http://")) return s;
  return undefined;
}

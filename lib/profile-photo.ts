/**
 * Only data URLs (saved uploads) and blob: (client preview) render as a photo.
 * OAuth / Gravatar http(s) URLs are ignored so we show initials until the user uploads.
 */
export function profilePhotoSrc(
  image: string | null | undefined,
): string | undefined {
  const s = image?.trim();
  if (!s) return undefined;
  if (s.startsWith("data:image/")) return s;
  if (s.startsWith("blob:")) return s;
  return undefined;
}

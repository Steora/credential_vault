/**
 * JWT/session cookies must stay small. Base64 avatar uploads (`data:image/...`)
 * and very long URLs blow past browser header limits → ERR_RESPONSE_HEADERS_TOO_BIG.
 */
const MAX_PICTURE_CHARS_IN_JWT = 2048;

export function pictureForJwt(image: string | null | undefined): string | undefined {
  if (image == null) return undefined;
  const s = image.trim();
  if (s === "") return undefined;
  if (s.startsWith("data:")) return undefined;
  if (s.length > MAX_PICTURE_CHARS_IN_JWT) return undefined;
  return s;
}

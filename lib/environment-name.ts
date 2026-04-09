/**
 * Resolves the section/environment name for persistence.
 * - Empty input → "Default"
 * - If input matches an existing name case-insensitively → keep that canonical string (legacy casing)
 * - Otherwise → UPPERCASE (new sections, avoids duplicate sections that differ only by case)
 */
export function resolveCanonicalEnvironmentName(
  input: string,
  existingNames: readonly string[],
): string {
  const t = input.trim();
  if (!t) return "Default";
  const upper = t.toUpperCase();
  const found = existingNames.find((e) => e.trim().toUpperCase() === upper);
  if (found !== undefined) return found.trim();
  return upper;
}

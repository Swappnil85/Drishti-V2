// apps/mobile-v2/src/utils/privacy.ts

/**
 * Returns a masked representation of a numeric/string value when privacy is enabled.
 * Keep it UI-friendly and very fast (no i18n/formatting here).
 */
export function maskValue(
  input: number | string,
  enabled: boolean,
  opts?: { preserveLength?: boolean }
): string {
  const s = String(input);
  if (!enabled) return s;

  // Preserve length using bullets (ignores whitespace)
  if (opts?.preserveLength) {
    const visibleCount = s.replace(/\s+/g, '').length;
    return '•'.repeat(Math.max(visibleCount, 1));
  }

  // Default: fixed mask length
  return '••••';
}

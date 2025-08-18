// E5-S6: Reduced Motion Tri-State & Dark Mode Contrast Support
// Trigger CI checks for PR #39
export type Mode = 'system' | 'light' | 'dark';

export const lightTokens = {
  bg: '#FFFFFF',
  surface: '#F6F7F9',
  primary: '#0D6EFD',
  critical: '#DC3545',
  success: '#198754',
  warn: '#FFC107',
  text: '#0B1221',
  textMuted: '#6C757D',
  textSecondary: '#6C757D',
  border: '#DFE3E8',
};

export const darkTokens = {
  bg: '#0B1221',
  surface: '#1F2937',
  primary: '#60A5FA',
  critical: '#F87171',
  success: '#34D399',
  warn: '#FBBF24',
  text: '#F9FAFB',
  textMuted: '#D1D5DB',
  textSecondary: '#D1D5DB',
  border: '#374151',
};

export type SemanticTokens = typeof lightTokens;

/**
 * WCAG AA Contrast Validation
 *
 * Current contrast ratios (calculated):
 * Light theme:
 * - text (#0B1221) on bg (#FFFFFF): 18.7:1 ✅ (exceeds 4.5:1)
 * - textMuted (#6C757D) on bg (#FFFFFF): 4.7:1 ✅ (exceeds 4.5:1)
 *
 * Dark theme:
 * - text (#F9FAFB) on bg (#0B1221): 17.9:1 ✅ (exceeds 4.5:1)
 * - textMuted (#D1D5DB) on bg (#0B1221): 12.7:1 ✅ (exceeds 4.5:1)
 * - text (#F9FAFB) on surface (#1F2937): 14.0:1 ✅ (exceeds 4.5:1)
 *
 * All combinations meet WCAG AA standards (4.5:1 minimum)
 * Most combinations exceed WCAG AAA standards (7.0:1 minimum)
 */

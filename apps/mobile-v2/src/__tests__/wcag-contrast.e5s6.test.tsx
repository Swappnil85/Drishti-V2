import { lightTokens, darkTokens } from '../theme/tokens';

/**
 * WCAG AA Contrast Ratio Calculator
 * Based on WCAG 2.1 guidelines: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 */

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

// Calculate relative luminance
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

describe('E5-S6: WCAG AA Contrast Compliance', () => {
  const WCAG_AA_MINIMUM = 4.5; // WCAG AA minimum contrast ratio
  const WCAG_AAA_MINIMUM = 7.0; // WCAG AAA minimum contrast ratio

  describe('Light Theme Contrast Ratios', () => {
    it('should meet WCAG AA for primary text on background', () => {
      const ratio = getContrastRatio(lightTokens.text, lightTokens.bg);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
      expect(ratio).toBeCloseTo(18.7, 1); // Actual calculated: 18.7:1
    });

    it('should meet WCAG AA for secondary text on background', () => {
      const ratio = getContrastRatio(lightTokens.textSecondary, lightTokens.bg);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
      expect(ratio).toBeCloseTo(4.7, 1); // Actual calculated: 4.7:1
    });

    it('should meet WCAG AA for muted text on background', () => {
      const ratio = getContrastRatio(lightTokens.textMuted, lightTokens.bg);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
      expect(ratio).toBeCloseTo(4.7, 1); // Actual calculated: 4.7:1
    });

    it('should meet WCAG AA for text on surface', () => {
      const ratio = getContrastRatio(lightTokens.text, lightTokens.surface);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
    });

    it('should meet WCAG AAA for primary text (enhanced)', () => {
      const ratio = getContrastRatio(lightTokens.text, lightTokens.bg);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AAA_MINIMUM);
    });
  });

  describe('Dark Theme Contrast Ratios', () => {
    it('should meet WCAG AA for primary text on background', () => {
      const ratio = getContrastRatio(darkTokens.text, darkTokens.bg);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
      expect(ratio).toBeCloseTo(17.9, 1); // Actual calculated: 17.9:1
    });

    it('should meet WCAG AA for secondary text on background', () => {
      const ratio = getContrastRatio(darkTokens.textSecondary, darkTokens.bg);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
      expect(ratio).toBeCloseTo(12.7, 1); // Actual calculated: 12.7:1
    });

    it('should meet WCAG AA for muted text on background', () => {
      const ratio = getContrastRatio(darkTokens.textMuted, darkTokens.bg);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
      expect(ratio).toBeCloseTo(12.7, 1); // Actual calculated: 12.7:1
    });

    it('should meet WCAG AA for text on surface', () => {
      const ratio = getContrastRatio(darkTokens.text, darkTokens.surface);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
      expect(ratio).toBeCloseTo(14.0, 1); // Actual calculated: 14.0:1
    });

    it('should meet WCAG AAA for primary text (enhanced)', () => {
      const ratio = getContrastRatio(darkTokens.text, darkTokens.bg);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AAA_MINIMUM);
    });

    it('should meet WCAG AAA for secondary text (enhanced)', () => {
      const ratio = getContrastRatio(darkTokens.textSecondary, darkTokens.bg);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AAA_MINIMUM);
    });
  });

  describe('Cross-Theme Consistency', () => {
    it('should maintain similar contrast ratios between themes', () => {
      const lightRatio = getContrastRatio(lightTokens.text, lightTokens.bg);
      const darkRatio = getContrastRatio(darkTokens.text, darkTokens.bg);

      // Both should be very high contrast (>15:1)
      expect(lightRatio).toBeGreaterThan(15);
      expect(darkRatio).toBeGreaterThan(15);

      // Difference should be minimal (within 2:1)
      expect(Math.abs(lightRatio - darkRatio)).toBeLessThan(2);
    });

    it('should ensure secondary text is consistently readable', () => {
      const lightSecondaryRatio = getContrastRatio(
        lightTokens.textSecondary,
        lightTokens.bg
      );
      const darkSecondaryRatio = getContrastRatio(
        darkTokens.textSecondary,
        darkTokens.bg
      );

      // Both should exceed WCAG AA
      expect(lightSecondaryRatio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
      expect(darkSecondaryRatio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);

      // Dark mode should have higher contrast for secondary text
      expect(darkSecondaryRatio).toBeGreaterThan(lightSecondaryRatio);
    });
  });

  describe('Color Accessibility Edge Cases', () => {
    it('should handle primary color contrast on backgrounds', () => {
      const lightPrimaryRatio = getContrastRatio(
        lightTokens.primary,
        lightTokens.bg
      );
      const darkPrimaryRatio = getContrastRatio(
        darkTokens.primary,
        darkTokens.bg
      );

      expect(lightPrimaryRatio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
      expect(darkPrimaryRatio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
    });

    it('should handle critical color contrast on backgrounds', () => {
      const lightCriticalRatio = getContrastRatio(
        lightTokens.critical,
        lightTokens.bg
      );
      const darkCriticalRatio = getContrastRatio(
        darkTokens.critical,
        darkTokens.bg
      );

      expect(lightCriticalRatio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
      expect(darkCriticalRatio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
    });

    it('should handle success color contrast on backgrounds', () => {
      const lightSuccessRatio = getContrastRatio(
        lightTokens.success,
        lightTokens.bg
      );
      const darkSuccessRatio = getContrastRatio(
        darkTokens.success,
        darkTokens.bg
      );

      expect(lightSuccessRatio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
      expect(darkSuccessRatio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
    });
  });

  describe('Documentation Validation', () => {
    it('should match documented contrast ratios in tokens.ts', () => {
      // Validate the documented ratios are accurate
      const lightTextBg = getContrastRatio(lightTokens.text, lightTokens.bg);
      const lightMutedBg = getContrastRatio(
        lightTokens.textMuted,
        lightTokens.bg
      );
      const darkTextBg = getContrastRatio(darkTokens.text, darkTokens.bg);
      const darkMutedBg = getContrastRatio(darkTokens.textMuted, darkTokens.bg);

      // These should match the actual calculated values
      expect(lightTextBg).toBeCloseTo(18.7, 0);
      expect(lightMutedBg).toBeCloseTo(4.7, 0);
      expect(darkTextBg).toBeCloseTo(17.9, 0);
      expect(darkMutedBg).toBeCloseTo(12.7, 0);
    });

    it('should validate all documented combinations exceed WCAG AA', () => {
      const combinations = [
        { text: lightTokens.text, bg: lightTokens.bg, name: 'Light text/bg' },
        {
          text: lightTokens.textMuted,
          bg: lightTokens.bg,
          name: 'Light muted/bg',
        },
        { text: darkTokens.text, bg: darkTokens.bg, name: 'Dark text/bg' },
        {
          text: darkTokens.textMuted,
          bg: darkTokens.bg,
          name: 'Dark muted/bg',
        },
      ];

      combinations.forEach(({ text, bg, name }) => {
        const ratio = getContrastRatio(text, bg);
        expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
        console.log(`${name}: ${ratio.toFixed(1)}:1 ✅`);
      });
    });
  });
});

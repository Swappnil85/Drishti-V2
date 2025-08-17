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
  border: '#374151',
};

export type SemanticTokens = typeof lightTokens;

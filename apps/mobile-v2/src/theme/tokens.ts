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
  surface: '#111827',
  primary: '#4C8DFF',
  critical: '#FF6B6B',
  success: '#3DDC97',
  warn: '#FFD166',
  text: '#F9FAFB',
  textMuted: '#A8B3BF',
  border: '#2A3441',
};

export type SemanticTokens = typeof lightTokens;


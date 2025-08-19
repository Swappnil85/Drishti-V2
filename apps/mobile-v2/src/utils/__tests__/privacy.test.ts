// apps/mobile-v2/src/utils/privacy.test.ts
import { maskValue } from '../privacy';

describe('maskValue', () => {
  it('passes through input when disabled', () => {
    expect(maskValue(1234.56, false)).toBe('1234.56');
    expect(maskValue('AB-123', false)).toBe('AB-123');
  });

  it('masks to fixed bullets when enabled', () => {
    expect(maskValue(1234.56, true)).toBe('••••');
    expect(maskValue('AB-123', true)).toBe('••••');
  });

  it('preserves length (ignores whitespace) when option is set', () => {
    const out = maskValue('12 345.67', true, { preserveLength: true });
    expect(out).toMatch(/^•+$/);
    // should roughly match number of non-space characters
    expect(out.length).toBe('12345.67'.length);
  });
});

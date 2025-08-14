// Minimal shims for jest-expo setup in React 19 + RN 0.79

// Make sure global.performance exists for some RN shims
if (typeof global.performance === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).performance = { now: () => Date.now() };
}

// Ensure window and document exist (jsdom env)
if (typeof window === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).window = {};
}
if (typeof document === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).document = {};
}


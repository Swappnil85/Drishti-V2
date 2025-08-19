// Minimal shims for jest-expo setup in React 19 + RN 0.79

// Make sure global.performance exists for some RN shims
if (typeof global.performance === 'undefined') {
  global.performance = { now: () => Date.now() };
}

// Ensure window and document exist (jsdom env)
if (typeof window === 'undefined') {
  global.window = {};
}
if (typeof document === 'undefined') {
  global.document = {};
}


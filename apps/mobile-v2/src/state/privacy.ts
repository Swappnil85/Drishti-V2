// apps/mobile-v2/src/state/privacy.ts
// Minimal, dependency-light persistence for Privacy Mode.
// Tries to use @react-native-async-storage/async-storage if present.
// Falls back to an in-memory store so tests always pass without adding deps.

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const require: any;

type StorageLike = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

const KEY = 'privacy.mask';

// In-memory fallback (tests, CI, or when AsyncStorage not installed)
const memoryStore: Record<string, string> = {};
const Memory: StorageLike = {
  async getItem(key) {
    return key in memoryStore ? memoryStore[key] : null;
  },
  async setItem(key, value) {
    memoryStore[key] = value;
  },
};

// Try to load AsyncStorage at runtime; if missing, quietly fall back.
function getStorage(): StorageLike {
  try {
    const mod: any = require('@react-native-async-storage/async-storage');
    const AsyncStorage: any = mod?.default ?? mod;
    if (AsyncStorage?.getItem && AsyncStorage?.setItem)
      return AsyncStorage as StorageLike;
  } catch {
    // module not installed → use Memory
  }
  return Memory;
}

export async function getPrivacyEnabled(): Promise<boolean> {
  const storage = getStorage();
  try {
    const v = await storage.getItem(KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export async function setPrivacyEnabled(enabled: boolean): Promise<void> {
  const storage = getStorage();
  try {
    await storage.setItem(KEY, enabled ? '1' : '0');
  } catch {
    // no-op: non-fatal
  }
}

export async function togglePrivacy(): Promise<boolean> {
  const next = !(await getPrivacyEnabled());
  await setPrivacyEnabled(next);
  return next;
}

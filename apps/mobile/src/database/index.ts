/**
 * Database Configuration
 * Simplified web-only database to avoid SQLite bundling issues
 */

import { Platform } from 'react-native';

// Type declaration for localStorage (web only)
declare const localStorage: {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

// Simple web database implementation
const webDatabase = {
  get: (tableName: string) => ({
    query: () => ({
      fetch: () => {
        try {
          const data = localStorage.getItem(`drishti_${tableName}`) || '[]';
          return Promise.resolve(JSON.parse(data));
        } catch {
          return Promise.resolve([]);
        }
      },
      observe: () => ({
        subscribe: (callback: any) => {
          const interval = setInterval(() => {
            try {
              const data = localStorage.getItem(`drishti_${tableName}`) || '[]';
              callback(JSON.parse(data));
            } catch {
              callback([]);
            }
          }, 1000);
          return { unsubscribe: () => clearInterval(interval) };
        },
      }),
    }),
  }),
  write: (action: any) => Promise.resolve(action()),
  action: (fn: any) => fn(),
  collections: {
    get: (tableName: string) => ({
      query: () => ({
        fetch: () => {
          try {
            const data = localStorage.getItem(`drishti_${tableName}`) || '[]';
            return Promise.resolve(JSON.parse(data));
          } catch {
            return Promise.resolve([]);
          }
        },
        observe: () => ({
          subscribe: (callback: any) => {
            const interval = setInterval(() => {
              try {
                const data =
                  localStorage.getItem(`drishti_${tableName}`) || '[]';
                callback(JSON.parse(data));
              } catch {
                callback([]);
              }
            }, 1000);
            return { unsubscribe: () => clearInterval(interval) };
          },
        }),
      }),
      create: (data: any) => {
        try {
          const existing = JSON.parse(
            localStorage.getItem(`drishti_${tableName}`) || '[]'
          );
          const newItem = { ...data, id: Date.now().toString() };
          existing.push(newItem);
          localStorage.setItem(
            `drishti_${tableName}`,
            JSON.stringify(existing)
          );
          return Promise.resolve(newItem);
        } catch {
          return Promise.resolve({});
        }
      },
    }),
  },
};

// For web builds, use the simple web database
// For native builds, this will be replaced by the actual SQLite database
const database = Platform.OS === 'web' ? webDatabase : null;

export { database };
export default database;

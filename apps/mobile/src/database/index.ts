/**
 * Database Configuration
 * Web-compatible database implementation that mimics WatermelonDB interface
 */

import { Platform } from 'react-native';

// Type declaration for localStorage (web only)
declare const localStorage: {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

// Mock Q object for WatermelonDB queries
export const Q = {
  where: (field: string, value: any) => ({ type: 'where', field, value }),
  like: (pattern: string) => ({ type: 'like', pattern }),
  or: (...conditions: any[]) => ({ type: 'or', conditions }),
  and: (...conditions: any[]) => ({ type: 'and', conditions }),
};

// Mock WatermelonDB Query class for web
class MockQuery {
  constructor(
    private tableName: string,
    private conditions: any[] = []
  ) {}

  where(field: string, value: any) {
    return new MockQuery(this.tableName, [
      ...this.conditions,
      { field, value },
    ]);
  }

  async fetch() {
    try {
      const data = JSON.parse(
        localStorage.getItem(`drishti_${this.tableName}`) || '[]'
      );
      return data.filter((item: any) => {
        return this.evaluateConditions(item, this.conditions);
      });
    } catch {
      return [];
    }
  }

  private evaluateConditions(item: any, conditions: any[]): boolean {
    return conditions.every(condition => {
      if (condition.type === 'where') {
        return item[condition.field] === condition.value;
      }
      if (condition.type === 'like') {
        const pattern = condition.pattern.replace(/%/g, '');
        return item[condition.field]
          ?.toString()
          .toLowerCase()
          .includes(pattern.toLowerCase());
      }
      if (condition.type === 'or') {
        return condition.conditions.some((c: any) =>
          this.evaluateConditions(item, [c])
        );
      }
      if (condition.type === 'and') {
        return condition.conditions.every((c: any) =>
          this.evaluateConditions(item, [c])
        );
      }
      // Handle direct field-value conditions
      if (condition.field && condition.value !== undefined) {
        return item[condition.field] === condition.value;
      }
      return true;
    });
  }

  observe() {
    return {
      subscribe: (callback: any) => {
        const interval = setInterval(async () => {
          const data = await this.fetch();
          callback(data);
        }, 1000);
        return { unsubscribe: () => clearInterval(interval) };
      },
    };
  }
}

// Mock WatermelonDB Collection class for web
class MockCollection {
  constructor(private tableName: string) {}

  query(...conditions: any[]) {
    return new MockQuery(this.tableName, conditions);
  }

  async find(id: string) {
    try {
      const data = JSON.parse(
        localStorage.getItem(`drishti_${this.tableName}`) || '[]'
      );
      const item = data.find((item: any) => item.id === id);
      if (!item) return null;

      // Return mock model with update method
      return {
        ...item,
        update: async (updateFn: any) => {
          const updatedItem = { ...item };
          updateFn(updatedItem);

          const allData = JSON.parse(
            localStorage.getItem(`drishti_${this.tableName}`) || '[]'
          );
          const index = allData.findIndex((i: any) => i.id === id);
          if (index !== -1) {
            allData[index] = updatedItem;
            localStorage.setItem(
              `drishti_${this.tableName}`,
              JSON.stringify(allData)
            );
          }
          return updatedItem;
        },
      };
    } catch {
      return null;
    }
  }

  async create(createFn: any) {
    try {
      const newItem = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      createFn(newItem);

      const existing = JSON.parse(
        localStorage.getItem(`drishti_${this.tableName}`) || '[]'
      );
      existing.push(newItem);
      localStorage.setItem(
        `drishti_${this.tableName}`,
        JSON.stringify(existing)
      );

      return newItem;
    } catch {
      return {};
    }
  }
}

// Web database implementation that mimics WatermelonDB interface
const webDatabase = {
  get: (tableName: string) => new MockCollection(tableName),

  write: async (action: any) => {
    return await action();
  },

  action: (fn: any) => fn(),

  collections: {
    get: (tableName: string) => new MockCollection(tableName),
  },
};

// For web builds, use the web database
// For native builds, this will be replaced by the actual SQLite database
const database = Platform.OS === 'web' ? webDatabase : null;

export { database };
export default database;

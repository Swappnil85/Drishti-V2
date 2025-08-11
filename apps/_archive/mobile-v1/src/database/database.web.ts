/**
 * Web Database Configuration
 * Simple localStorage-based database for web builds
 */

// Simple web database using localStorage
class WebDatabase {
  collections = {
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
            // Simple observer pattern
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
  };

  get(tableName: string) {
    return this.collections.get(tableName);
  }

  write(action: any) {
    return Promise.resolve(action());
  }

  action(fn: any) {
    return fn();
  }
}

export const database = new WebDatabase();
export default database;

import { initializeDatabase, closeDatabase } from '../connection';
import { runMigrations } from './migrator';

(async () => {
  try {
    await initializeDatabase(1);
    const result = await runMigrations();
    if (!result.success) {
      console.error('Migration failed:', result.errors.join('\n'));
      process.exit(1);
    }
    console.log('Migrations completed:', result.migrationsRun);
    await closeDatabase();
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
})();

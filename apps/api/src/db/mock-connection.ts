// Mock database connection for testing when PostgreSQL is not available
// This allows the server to start and demonstrate the endpoints

export const mockTestConnection = async (): Promise<boolean> => {
  // Simulate database connection test
  console.log('🔍 Mock: Testing database connection...');
  
  // Check if DATABASE_URL is configured
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.includes('username:password')) {
    console.log('⚠️  Mock: Database URL not properly configured');
    return false;
  }
  
  // Simulate successful connection
  console.log('✅ Mock: Database connection simulated successfully');
  return true;
};

export const mockGetDatabaseHealth = async () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl || databaseUrl.includes('username:password')) {
    return {
      status: 'unhealthy',
      error: 'Database URL not configured',
      timestamp: new Date().toISOString(),
      note: 'This is a mock response - PostgreSQL not installed'
    };
  }
  
  return {
    status: 'healthy',
    latency: '5ms',
    timestamp: new Date().toISOString(),
    note: 'This is a mock response - PostgreSQL not installed'
  };
};

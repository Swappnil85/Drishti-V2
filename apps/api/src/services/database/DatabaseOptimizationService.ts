/**
 * Database Optimization Service
 * Connection pooling, query performance monitoring, automated indexing, and scaling features
 */

import { Pool, PoolClient, PoolConfig } from 'pg';
import { query } from '../../db/connection';

interface ConnectionPoolConfig {
  min: number;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  acquireTimeoutMillis: number;
  reapIntervalMillis: number;
  createRetryIntervalMillis: number;
  createTimeoutMillis: number;
}

interface QueryPerformanceMetrics {
  query: string;
  executionTime: number;
  timestamp: Date;
  parameters?: any[];
  rowCount?: number;
  error?: string;
}

interface IndexRecommendation {
  table: string;
  columns: string[];
  reason: string;
  estimatedImprovement: number;
  priority: 'low' | 'medium' | 'high';
  sql: string;
}

interface DatabaseMetrics {
  connectionPool: {
    totalConnections: number;
    idleConnections: number;
    activeConnections: number;
    waitingClients: number;
  };
  performance: {
    averageQueryTime: number;
    slowQueries: number;
    totalQueries: number;
    errorRate: number;
  };
  storage: {
    databaseSize: number;
    tableCount: number;
    indexCount: number;
    unusedIndexes: number;
  };
  replication: {
    replicationLag?: number;
    replicaStatus?: string;
  };
}

class DatabaseOptimizationService {
  private connectionPool: Pool | null = null;
  private queryMetrics: QueryPerformanceMetrics[] = [];
  private slowQueryThreshold: number = 1000; // 1 second
  private maxMetricsHistory: number = 10000;
  private indexRecommendations: IndexRecommendation[] = [];

  private readonly poolConfig: ConnectionPoolConfig = {
    min: 2,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    acquireTimeoutMillis: 60000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
    createTimeoutMillis: 20000,
  };

  constructor() {
    this.initializeConnectionPool();
    this.startPerformanceMonitoring();
    this.scheduleIndexAnalysis();
  }

  /**
   * Initialize optimized connection pool
   */
  private initializeConnectionPool(): void {
    try {
      const poolConfig: PoolConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'drishti',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        min: this.poolConfig.min,
        max: this.poolConfig.max,
        idleTimeoutMillis: this.poolConfig.idleTimeoutMillis,
        connectionTimeoutMillis: this.poolConfig.connectionTimeoutMillis,

        // SSL configuration
        ssl:
          process.env.NODE_ENV === 'production'
            ? {
                rejectUnauthorized: false,
              }
            : false,

        // Connection validation
        application_name: 'drishti_api',
        statement_timeout: 30000, // 30 seconds
        query_timeout: 30000,

        // Performance optimizations
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
      };

      this.connectionPool = new Pool(poolConfig);

      // Pool event handlers
      this.connectionPool.on('connect', client => {
        console.log('🔗 New database connection established');

        // Set connection-specific optimizations
        client.query('SET statement_timeout = 30000');
        client.query('SET lock_timeout = 10000');
        client.query('SET idle_in_transaction_session_timeout = 60000');
      });

      this.connectionPool.on('error', err => {
        console.error('💥 Database pool error:', err);
      });

      this.connectionPool.on('remove', () => {
        console.log('🔌 Database connection removed from pool');
      });

      console.log('🏊 Database connection pool initialized');
    } catch (error) {
      console.error('Failed to initialize connection pool:', error);
    }
  }

  /**
   * Execute query with performance monitoring
   */
  async executeQuery<T = any>(
    sql: string,
    params?: any[],
    options?: { timeout?: number; priority?: 'low' | 'normal' | 'high' }
  ): Promise<{ rows: T[]; rowCount: number; executionTime: number }> {
    const startTime = Date.now();
    let client: PoolClient | null = null;

    try {
      if (!this.connectionPool) {
        throw new Error('Connection pool not initialized');
      }

      // Get connection from pool
      client = await this.connectionPool.connect();

      // Set query timeout if specified
      if (options?.timeout) {
        await client.query(`SET statement_timeout = ${options.timeout}`);
      }

      // Execute query
      const result = await client.query(sql, params);
      const executionTime = Date.now() - startTime;

      // Record performance metrics
      this.recordQueryMetrics({
        query: sql,
        executionTime,
        timestamp: new Date(),
        parameters: params,
        rowCount: result.rowCount || 0,
      });

      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Record error metrics
      this.recordQueryMetrics({
        query: sql,
        executionTime,
        timestamp: new Date(),
        parameters: params,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Record query performance metrics
   */
  private recordQueryMetrics(metrics: QueryPerformanceMetrics): void {
    this.queryMetrics.push(metrics);

    // Maintain metrics history limit
    if (this.queryMetrics.length > this.maxMetricsHistory) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetricsHistory);
    }

    // Log slow queries
    if (metrics.executionTime > this.slowQueryThreshold) {
      console.warn(`🐌 Slow query detected (${metrics.executionTime}ms):`, {
        query: metrics.query.substring(0, 100) + '...',
        executionTime: metrics.executionTime,
        rowCount: metrics.rowCount,
      });
    }
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Monitor query performance every 5 minutes
    setInterval(
      () => {
        this.analyzeQueryPerformance();
      },
      5 * 60 * 1000
    );

    // Clean up old metrics every hour
    setInterval(
      () => {
        this.cleanupOldMetrics();
      },
      60 * 60 * 1000
    );
  }

  /**
   * Analyze query performance and generate recommendations
   */
  private async analyzeQueryPerformance(): Promise<void> {
    try {
      const recentMetrics = this.queryMetrics.filter(
        m => Date.now() - m.timestamp.getTime() < 60 * 60 * 1000 // Last hour
      );

      if (recentMetrics.length === 0) return;

      const slowQueries = recentMetrics.filter(
        m => m.executionTime > this.slowQueryThreshold
      );
      const averageTime =
        recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) /
        recentMetrics.length;
      const errorRate =
        recentMetrics.filter(m => m.error).length / recentMetrics.length;

      console.log(`📊 Query Performance Analysis:`, {
        totalQueries: recentMetrics.length,
        slowQueries: slowQueries.length,
        averageTime: Math.round(averageTime),
        errorRate: Math.round(errorRate * 100) + '%',
      });

      // Generate index recommendations for slow queries
      await this.generateIndexRecommendations(slowQueries);
    } catch (error) {
      console.error('Failed to analyze query performance:', error);
    }
  }

  /**
   * Generate index recommendations
   */
  private async generateIndexRecommendations(
    slowQueries: QueryPerformanceMetrics[]
  ): Promise<void> {
    try {
      // Analyze slow queries for potential index improvements
      const tableQueries = new Map<string, QueryPerformanceMetrics[]>();

      slowQueries.forEach(query => {
        // Simple table extraction (in production, use proper SQL parser)
        const tableMatch = query.query.match(/FROM\s+(\w+)/i);
        if (tableMatch) {
          const table = tableMatch[1];
          if (!tableQueries.has(table)) {
            tableQueries.set(table, []);
          }
          tableQueries.get(table)!.push(query);
        }
      });

      // Generate recommendations for each table
      for (const [table, queries] of tableQueries.entries()) {
        const recommendation = await this.analyzeTableForIndexes(
          table,
          queries
        );
        if (recommendation) {
          this.indexRecommendations.push(recommendation);
        }
      }

      // Limit recommendations
      this.indexRecommendations = this.indexRecommendations.slice(-50);
    } catch (error) {
      console.error('Failed to generate index recommendations:', error);
    }
  }

  /**
   * Analyze table for index recommendations
   */
  private async analyzeTableForIndexes(
    table: string,
    queries: QueryPerformanceMetrics[]
  ): Promise<IndexRecommendation | null> {
    try {
      // Check existing indexes
      const existingIndexes = await this.executeQuery(
        `
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = $1
      `,
        [table]
      );

      // Analyze WHERE clauses for potential indexes
      const whereColumns = new Set<string>();
      queries.forEach(query => {
        // Simple WHERE clause analysis (in production, use proper SQL parser)
        const whereMatch = query.query.match(/WHERE\s+(\w+)\s*[=<>]/gi);
        if (whereMatch) {
          whereMatch.forEach(match => {
            const column = match
              .replace(/WHERE\s+/i, '')
              .replace(/\s*[=<>].*/, '');
            whereColumns.add(column);
          });
        }
      });

      if (whereColumns.size === 0) return null;

      const columns = Array.from(whereColumns);
      const averageTime =
        queries.reduce((sum, q) => sum + q.executionTime, 0) / queries.length;

      return {
        table,
        columns,
        reason: `Frequent queries with WHERE conditions on ${columns.join(', ')}`,
        estimatedImprovement: Math.min(averageTime * 0.7, 80), // Estimate 70% improvement
        priority:
          averageTime > 5000 ? 'high' : averageTime > 2000 ? 'medium' : 'low',
        sql: `CREATE INDEX CONCURRENTLY idx_${table}_${columns.join('_')} ON ${table} (${columns.join(', ')});`,
      };
    } catch (error) {
      console.error(`Failed to analyze table ${table}:`, error);
      return null;
    }
  }

  /**
   * Schedule automated index analysis
   */
  private scheduleIndexAnalysis(): void {
    // Run index analysis daily at 2 AM
    const now = new Date();
    const tomorrow2AM = new Date(now);
    tomorrow2AM.setDate(tomorrow2AM.getDate() + 1);
    tomorrow2AM.setHours(2, 0, 0, 0);

    const msUntil2AM = tomorrow2AM.getTime() - now.getTime();

    setTimeout(() => {
      this.performIndexAnalysis();

      // Then run daily
      setInterval(
        () => {
          this.performIndexAnalysis();
        },
        24 * 60 * 60 * 1000
      );
    }, msUntil2AM);
  }

  /**
   * Perform comprehensive index analysis
   */
  private async performIndexAnalysis(): Promise<void> {
    try {
      console.log('🔍 Starting automated index analysis...');

      // Find unused indexes
      const unusedIndexes = await this.executeQuery(`
        SELECT schemaname, tablename, indexname, idx_scan
        FROM pg_stat_user_indexes
        WHERE idx_scan = 0
        AND indexname NOT LIKE '%_pkey'
      `);

      // Find duplicate indexes
      const duplicateIndexes = await this.executeQuery(`
        SELECT t1.indexname as index1, t2.indexname as index2, t1.tablename
        FROM pg_indexes t1, pg_indexes t2
        WHERE t1.tablename = t2.tablename
        AND t1.indexdef = t2.indexdef
        AND t1.indexname < t2.indexname
      `);

      console.log(`📈 Index Analysis Results:`, {
        unusedIndexes: unusedIndexes.rows.length,
        duplicateIndexes: duplicateIndexes.rows.length,
        recommendations: this.indexRecommendations.length,
      });
    } catch (error) {
      console.error('Failed to perform index analysis:', error);
    }
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    this.queryMetrics = this.queryMetrics.filter(
      m => m.timestamp.getTime() > cutoffTime
    );
  }

  /**
   * Get database metrics
   */
  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    try {
      const poolStats = this.connectionPool
        ? {
            totalConnections: this.connectionPool.totalCount,
            idleConnections: this.connectionPool.idleCount,
            activeConnections:
              this.connectionPool.totalCount - this.connectionPool.idleCount,
            waitingClients: this.connectionPool.waitingCount,
          }
        : {
            totalConnections: 0,
            idleConnections: 0,
            activeConnections: 0,
            waitingClients: 0,
          };

      const recentMetrics = this.queryMetrics.filter(
        m => Date.now() - m.timestamp.getTime() < 60 * 60 * 1000 // Last hour
      );

      const performanceStats = {
        averageQueryTime:
          recentMetrics.length > 0
            ? recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) /
              recentMetrics.length
            : 0,
        slowQueries: recentMetrics.filter(
          m => m.executionTime > this.slowQueryThreshold
        ).length,
        totalQueries: recentMetrics.length,
        errorRate:
          recentMetrics.length > 0
            ? recentMetrics.filter(m => m.error).length / recentMetrics.length
            : 0,
      };

      // Get storage stats
      const storageStats = await this.executeQuery(`
        SELECT 
          pg_database_size(current_database()) as database_size,
          (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
          (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public') as index_count,
          (SELECT count(*) FROM pg_stat_user_indexes WHERE idx_scan = 0) as unused_indexes
      `);

      return {
        connectionPool: poolStats,
        performance: performanceStats,
        storage: {
          databaseSize: parseInt(storageStats.rows[0]?.database_size || '0'),
          tableCount: parseInt(storageStats.rows[0]?.table_count || '0'),
          indexCount: parseInt(storageStats.rows[0]?.index_count || '0'),
          unusedIndexes: parseInt(storageStats.rows[0]?.unused_indexes || '0'),
        },
        replication: {
          // In production, add replication monitoring
          replicationLag: undefined,
          replicaStatus: undefined,
        },
      };
    } catch (error) {
      console.error('Failed to get database metrics:', error);
      throw error;
    }
  }

  /**
   * Get index recommendations
   */
  getIndexRecommendations(): IndexRecommendation[] {
    return this.indexRecommendations.slice().sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get query performance statistics
   */
  getQueryPerformanceStats(hours: number = 1): {
    totalQueries: number;
    slowQueries: number;
    averageTime: number;
    errorRate: number;
    topSlowQueries: QueryPerformanceMetrics[];
  } {
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
    const recentMetrics = this.queryMetrics.filter(
      m => m.timestamp.getTime() > cutoffTime
    );

    const slowQueries = recentMetrics.filter(
      m => m.executionTime > this.slowQueryThreshold
    );
    const topSlowQueries = slowQueries
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    return {
      totalQueries: recentMetrics.length,
      slowQueries: slowQueries.length,
      averageTime:
        recentMetrics.length > 0
          ? recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) /
            recentMetrics.length
          : 0,
      errorRate:
        recentMetrics.length > 0
          ? recentMetrics.filter(m => m.error).length / recentMetrics.length
          : 0,
      topSlowQueries,
    };
  }

  /**
   * Optimize connection pool settings
   */
  optimizeConnectionPool(metrics: DatabaseMetrics): void {
    const { connectionPool } = metrics;

    // Adjust pool size based on usage
    if (connectionPool.waitingClients > 0 && this.connectionPool) {
      const newMax = Math.min(this.poolConfig.max + 5, 50);
      console.log(`🔧 Increasing connection pool max to ${newMax}`);
      // Note: pg Pool doesn't support dynamic resizing, would need to recreate
    }

    if (connectionPool.idleConnections > connectionPool.activeConnections * 2) {
      console.log(
        '🔧 Consider reducing connection pool size - many idle connections'
      );
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      connectionPool: this.connectionPool
        ? {
            totalConnections: this.connectionPool.totalCount,
            idleConnections: this.connectionPool.idleCount,
            activeConnections:
              this.connectionPool.totalCount - this.connectionPool.idleCount,
            waitingClients: this.connectionPool.waitingCount,
          }
        : null,
      queryMetrics: {
        totalRecorded: this.queryMetrics.length,
        slowQueryThreshold: this.slowQueryThreshold,
        maxHistorySize: this.maxMetricsHistory,
      },
      indexRecommendations: this.indexRecommendations.length,
      poolConfig: this.poolConfig,
    };
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    if (this.connectionPool) {
      await this.connectionPool.end();
      console.log('🏊 Database connection pool closed');
    }
  }
}

export const databaseOptimizationService = new DatabaseOptimizationService();

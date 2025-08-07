import { useState, useEffect, useCallback } from 'react';
import { 
  developerConflictResolutionService, 
  ConflictResolutionStrategy, 
  ConflictTestScenario, 
  PerformanceOptimization 
} from '../services/sync/DeveloperConflictResolutionService';

/**
 * React hook for developer conflict resolution
 * Provides access to strategies, test scenarios, and performance optimization
 */
export function useDeveloperConflictResolution() {
  const [strategies, setStrategies] = useState<ConflictResolutionStrategy[]>([]);
  const [testScenarios, setTestScenarios] = useState<ConflictTestScenario[]>([]);
  const [performanceConfig, setPerformanceConfig] = useState<PerformanceOptimization | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeDeveloperService = async () => {
      try {
        setIsLoading(true);
        
        await developerConflictResolutionService.initialize();
        
        if (mounted) {
          const allStrategies = developerConflictResolutionService.getStrategies();
          setStrategies(allStrategies);
          
          const allScenarios = developerConflictResolutionService.getTestScenarios();
          setTestScenarios(allScenarios);
          
          const config = developerConflictResolutionService.getPerformanceConfig();
          setPerformanceConfig(config);
          
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize developer conflict resolution:', error);
        if (mounted) {
          setIsInitialized(true);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeDeveloperService();

    return () => {
      mounted = false;
    };
  }, []);

  // Execute conflict resolution
  const executeResolution = useCallback(async (
    conflictId: string,
    strategyId: string,
    clientData: any,
    serverData: any,
    metadata?: any
  ) => {
    if (!isInitialized) throw new Error('Service not initialized');
    
    return await developerConflictResolutionService.executeResolution(
      conflictId,
      strategyId,
      clientData,
      serverData,
      metadata
    );
  }, [isInitialized]);

  // Run test suite
  const runTestSuite = useCallback(async (strategyId?: string) => {
    if (!isInitialized) throw new Error('Service not initialized');
    
    setIsLoading(true);
    try {
      const results = await developerConflictResolutionService.runTestSuite(strategyId);
      
      // Refresh strategies and scenarios to get updated test results
      const updatedStrategies = developerConflictResolutionService.getStrategies();
      setStrategies(updatedStrategies);
      
      const updatedScenarios = developerConflictResolutionService.getTestScenarios();
      setTestScenarios(updatedScenarios);
      
      return results;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Add strategy
  const addStrategy = useCallback(async (strategy: ConflictResolutionStrategy) => {
    if (!isInitialized) throw new Error('Service not initialized');
    
    await developerConflictResolutionService.addStrategy(strategy);
    const updatedStrategies = developerConflictResolutionService.getStrategies();
    setStrategies(updatedStrategies);
  }, [isInitialized]);

  // Add test scenario
  const addTestScenario = useCallback(async (scenario: ConflictTestScenario) => {
    if (!isInitialized) throw new Error('Service not initialized');
    
    await developerConflictResolutionService.addTestScenario(scenario);
    const updatedScenarios = developerConflictResolutionService.getTestScenarios();
    setTestScenarios(updatedScenarios);
  }, [isInitialized]);

  // Update performance configuration
  const updatePerformanceConfig = useCallback(async (updates: Partial<PerformanceOptimization>) => {
    if (!isInitialized) throw new Error('Service not initialized');
    
    await developerConflictResolutionService.updatePerformanceConfig(updates);
    const updatedConfig = developerConflictResolutionService.getPerformanceConfig();
    setPerformanceConfig(updatedConfig);
  }, [isInitialized]);

  // Get strategy by ID
  const getStrategy = useCallback((strategyId: string) => {
    return strategies.find(s => s.id === strategyId) || null;
  }, [strategies]);

  // Get strategies by data type
  const getStrategiesByDataType = useCallback((dataType: string) => {
    return strategies.filter(s => s.applicableDataTypes.includes(dataType));
  }, [strategies]);

  // Get test scenarios by data type
  const getTestScenariosByDataType = useCallback((dataType: string) => {
    return testScenarios.filter(s => s.dataType === dataType);
  }, [testScenarios]);

  // Calculate overall test coverage
  const calculateOverallTestCoverage = useCallback(() => {
    if (strategies.length === 0) return 0;
    
    const totalCoverage = strategies.reduce((sum, strategy) => {
      return sum + (strategy.testCoverage.passRate || 0);
    }, 0);
    
    return totalCoverage / strategies.length;
  }, [strategies]);

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    if (strategies.length === 0) return null;
    
    const totalTime = strategies.reduce((sum, s) => sum + s.performanceProfile.averageResolutionTime, 0);
    const totalMemory = strategies.reduce((sum, s) => sum + s.performanceProfile.memoryUsage, 0);
    
    return {
      averageResolutionTime: totalTime / strategies.length,
      averageMemoryUsage: totalMemory / strategies.length,
      totalStrategies: strategies.length,
      highPerformanceStrategies: strategies.filter(s => 
        s.performanceProfile.averageResolutionTime < 100 && 
        s.performanceProfile.cpuIntensity === 'low'
      ).length,
    };
  }, [strategies]);

  return {
    // State
    strategies,
    testScenarios,
    performanceConfig,
    isInitialized,
    isLoading,

    // Actions
    executeResolution,
    runTestSuite,
    addStrategy,
    addTestScenario,
    updatePerformanceConfig,
    getStrategy,
    getStrategiesByDataType,
    getTestScenariosByDataType,

    // Computed values
    totalStrategies: strategies.length,
    totalTestScenarios: testScenarios.length,
    overallTestCoverage: calculateOverallTestCoverage(),
    performanceSummary: getPerformanceSummary(),
    
    // Strategy statistics
    strategiesByType: {
      timestamp: strategies.filter(s => s.id.includes('timestamp')).length,
      userPreference: strategies.filter(s => s.id.includes('user_preference')).length,
      businessRule: strategies.filter(s => s.id.includes('business_rule')).length,
    },
    
    // Test scenario statistics
    scenariosByComplexity: {
      simple: testScenarios.filter(s => s.metadata.complexity === 'simple').length,
      medium: testScenarios.filter(s => s.metadata.complexity === 'medium').length,
      complex: testScenarios.filter(s => s.metadata.complexity === 'complex').length,
    },
    
    scenariosByCriticality: {
      low: testScenarios.filter(s => s.metadata.criticality === 'low').length,
      medium: testScenarios.filter(s => s.metadata.criticality === 'medium').length,
      high: testScenarios.filter(s => s.metadata.criticality === 'high').length,
      critical: testScenarios.filter(s => s.metadata.criticality === 'critical').length,
    },
  };
}

/**
 * React hook for conflict resolution testing
 * Provides testing-specific functionality and results
 */
export function useConflictResolutionTesting() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testHistory, setTestHistory] = useState<any[]>([]);

  // Run specific test scenario
  const runTestScenario = useCallback(async (
    scenarioId: string,
    strategyId: string
  ) => {
    setIsRunning(true);
    
    try {
      const scenarios = developerConflictResolutionService.getTestScenarios();
      const scenario = scenarios.find(s => s.id === scenarioId);
      
      if (!scenario) {
        throw new Error(`Test scenario not found: ${scenarioId}`);
      }
      
      const startTime = Date.now();
      
      const resolution = await developerConflictResolutionService.executeResolution(
        scenario.id,
        strategyId,
        scenario.clientData,
        scenario.serverData,
        scenario.metadata
      );
      
      const executionTime = Date.now() - startTime;
      
      const result = {
        scenarioId,
        strategyId,
        resolution,
        expectedResolution: scenario.expectedResolution,
        executionTime,
        timestamp: Date.now(),
        passed: JSON.stringify(resolution) === JSON.stringify(scenario.expectedResolution),
      };
      
      setTestResults(result);
      setTestHistory(prev => [result, ...prev.slice(0, 49)]); // Keep last 50 results
      
      return result;
    } finally {
      setIsRunning(false);
    }
  }, []);

  // Run comprehensive test suite
  const runComprehensiveTests = useCallback(async (strategyId?: string) => {
    setIsRunning(true);
    
    try {
      const results = await developerConflictResolutionService.runTestSuite(strategyId);
      setTestResults(results);
      setTestHistory(prev => [results, ...prev.slice(0, 19)]); // Keep last 20 suite results
      return results;
    } finally {
      setIsRunning(false);
    }
  }, []);

  // Clear test history
  const clearTestHistory = useCallback(() => {
    setTestHistory([]);
    setTestResults(null);
  }, []);

  // Get test statistics
  const getTestStatistics = useCallback(() => {
    if (!testResults) return null;
    
    return {
      totalTests: testResults.totalTests || 0,
      passedTests: testResults.passedTests || 0,
      failedTests: testResults.failedTests || 0,
      passRate: testResults.overallPassRate || 0,
      executionTime: testResults.executionTime || 0,
      averageTestTime: testResults.totalTests > 0 ? 
        (testResults.executionTime / testResults.totalTests) : 0,
    };
  }, [testResults]);

  return {
    // State
    testResults,
    isRunning,
    testHistory,

    // Actions
    runTestScenario,
    runComprehensiveTests,
    clearTestHistory,

    // Computed values
    testStatistics: getTestStatistics(),
    hasResults: testResults !== null,
    historyCount: testHistory.length,
    
    // Recent test summary
    recentTestSummary: testHistory.length > 0 ? {
      lastRun: testHistory[0].timestamp,
      recentPassRate: testHistory.slice(0, 5).reduce((sum, result) => {
        return sum + (result.overallPassRate || (result.passed ? 100 : 0));
      }, 0) / Math.min(5, testHistory.length),
      totalRuns: testHistory.length,
    } : null,
  };
}

/**
 * React hook for performance monitoring
 * Provides performance metrics and optimization insights
 */
export function useConflictResolutionPerformance() {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadPerformanceData = async () => {
      try {
        await developerConflictResolutionService.initialize();
        
        if (mounted) {
          const strategies = developerConflictResolutionService.getStrategies();
          const config = developerConflictResolutionService.getPerformanceConfig();
          
          const performanceMetrics = {
            strategies: strategies.map(s => ({
              id: s.id,
              name: s.name,
              averageTime: s.performanceProfile.averageResolutionTime,
              memoryUsage: s.performanceProfile.memoryUsage,
              cpuIntensity: s.performanceProfile.cpuIntensity,
              scalability: s.performanceProfile.scalability,
            })),
            configuration: config,
            summary: {
              totalStrategies: strategies.length,
              averageResolutionTime: strategies.reduce((sum, s) => 
                sum + s.performanceProfile.averageResolutionTime, 0) / strategies.length,
              totalMemoryUsage: strategies.reduce((sum, s) => 
                sum + s.performanceProfile.memoryUsage, 0),
              highPerformanceCount: strategies.filter(s => 
                s.performanceProfile.averageResolutionTime < 100).length,
            },
          };
          
          setPerformanceData(performanceMetrics);
        }
      } catch (error) {
        console.error('Failed to load performance data:', error);
      }
    };

    loadPerformanceData();

    return () => {
      mounted = false;
    };
  }, []);

  // Get performance recommendations
  const getPerformanceRecommendations = useCallback(() => {
    if (!performanceData) return [];
    
    const recommendations: string[] = [];
    
    // Check for slow strategies
    const slowStrategies = performanceData.strategies.filter(
      (s: any) => s.averageTime > 500
    );
    if (slowStrategies.length > 0) {
      recommendations.push(
        `${slowStrategies.length} strategies are slower than 500ms. Consider optimization.`
      );
    }
    
    // Check for high memory usage
    const highMemoryStrategies = performanceData.strategies.filter(
      (s: any) => s.memoryUsage > 10 * 1024 * 1024 // 10MB
    );
    if (highMemoryStrategies.length > 0) {
      recommendations.push(
        `${highMemoryStrategies.length} strategies use more than 10MB memory. Consider optimization.`
      );
    }
    
    // Check batch processing configuration
    if (performanceData.configuration?.batchProcessing?.enabled === false) {
      recommendations.push('Enable batch processing for better performance with multiple conflicts.');
    }
    
    // Check caching configuration
    if (performanceData.configuration?.caching?.enabled === false) {
      recommendations.push('Enable caching to improve repeated conflict resolution performance.');
    }
    
    return recommendations;
  }, [performanceData]);

  return {
    // State
    performanceData,
    isMonitoring,

    // Computed values
    recommendations: getPerformanceRecommendations(),
    hasData: performanceData !== null,
    
    // Performance insights
    performanceInsights: performanceData ? {
      fastestStrategy: performanceData.strategies.reduce((fastest: any, current: any) => 
        current.averageTime < fastest.averageTime ? current : fastest
      ),
      slowestStrategy: performanceData.strategies.reduce((slowest: any, current: any) => 
        current.averageTime > slowest.averageTime ? current : slowest
      ),
      mostMemoryEfficient: performanceData.strategies.reduce((efficient: any, current: any) => 
        current.memoryUsage < efficient.memoryUsage ? current : efficient
      ),
      averagePerformance: {
        time: performanceData.summary.averageResolutionTime,
        memory: performanceData.summary.totalMemoryUsage / performanceData.summary.totalStrategies,
      },
    } : null,
  };
}

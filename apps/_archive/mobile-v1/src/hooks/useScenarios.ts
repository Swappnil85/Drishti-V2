/**
 * useScenarios Hook
 * React hook for scenario management with comprehensive state management
 * Epic 9, Story 1: Scenario Creation & Management
 */

import { useState, useEffect, useCallback } from 'react';
import {
  EnhancedScenario,
  CreateScenarioDto,
  UpdateScenarioDto,
  ScenarioTemplate,
  ScenarioTemplateType,
  ScenarioValidationResult,
  ScenarioStats,
} from '@drishti/shared/types/financial';
import {
  scenarioService,
  ScenarioSearchFilters,
} from '../services/scenario/ScenarioService';
import { useHaptic } from './useHaptic';

export interface UseScenariosReturn {
  // Data
  scenarios: EnhancedScenario[];
  templates: ScenarioTemplate[];
  stats: ScenarioStats | null;
  folders: Array<{
    name: string;
    count: number;
    scenarios: EnhancedScenario[];
  }>;
  tags: string[];

  // State
  loading: boolean;
  error: string | null;
  refreshing: boolean;

  // Actions
  createScenario: (data: CreateScenarioDto) => Promise<EnhancedScenario | null>;
  updateScenario: (
    id: string,
    updates: UpdateScenarioDto
  ) => Promise<EnhancedScenario | null>;
  deleteScenario: (id: string) => Promise<boolean>;
  cloneScenario: (
    id: string,
    newName: string
  ) => Promise<EnhancedScenario | null>;
  createFromTemplate: (
    templateType: ScenarioTemplateType,
    customizations?: Partial<CreateScenarioDto>
  ) => Promise<EnhancedScenario | null>;
  validateScenario: (
    data: Partial<CreateScenarioDto>
  ) => Promise<ScenarioValidationResult>;

  // Search and filtering
  searchScenarios: (filters: ScenarioSearchFilters) => Promise<void>;
  clearSearch: () => void;

  // Refresh
  refresh: () => Promise<void>;
  refreshTemplates: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export interface UseScenariosOptions {
  autoLoad?: boolean;
  enableRealTimeUpdates?: boolean;
  filters?: ScenarioSearchFilters;
}

/**
 * Hook for comprehensive scenario management
 */
export const useScenarios = (
  options: UseScenariosOptions = {}
): UseScenariosReturn => {
  const { autoLoad = true, enableRealTimeUpdates = true, filters } = options;

  // State
  const [scenarios, setScenarios] = useState<EnhancedScenario[]>([]);
  const [templates, setTemplates] = useState<ScenarioTemplate[]>([]);
  const [stats, setStats] = useState<ScenarioStats | null>(null);
  const [folders, setFolders] = useState<
    Array<{ name: string; count: number; scenarios: EnhancedScenario[] }>
  >([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<
    ScenarioSearchFilters | undefined
  >(filters);

  // Haptic feedback
  const { successFeedback, errorFeedback } = useHaptic();

  /**
   * Load scenarios with current filters
   */
  const loadScenarios = useCallback(async () => {
    try {
      setError(null);
      const scenarioList = await scenarioService.getScenarios(currentFilters);
      setScenarios(scenarioList);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load scenarios';
      setError(errorMessage);
      errorFeedback();
    }
  }, [currentFilters, errorFeedback]);

  /**
   * Load templates
   */
  const loadTemplates = useCallback(async () => {
    try {
      const templateList = await scenarioService.getTemplates();
      setTemplates(templateList);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  }, []);

  /**
   * Load statistics
   */
  const loadStats = useCallback(async () => {
    try {
      const scenarioStats = await scenarioService.getScenarioStats();
      setStats(scenarioStats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  /**
   * Load folders
   */
  const loadFolders = useCallback(async () => {
    try {
      const folderList = await scenarioService.getFolders();
      setFolders(folderList);
    } catch (err) {
      console.error('Failed to load folders:', err);
    }
  }, []);

  /**
   * Load tags
   */
  const loadTags = useCallback(async () => {
    try {
      const tagList = await scenarioService.getAllTags();
      setTags(tagList);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  }, []);

  /**
   * Load all data
   */
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadScenarios(),
        loadTemplates(),
        loadStats(),
        loadFolders(),
        loadTags(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadScenarios, loadTemplates, loadStats, loadFolders, loadTags]);

  /**
   * Create scenario
   */
  const createScenario = useCallback(
    async (data: CreateScenarioDto): Promise<EnhancedScenario | null> => {
      try {
        setError(null);
        const newScenario = await scenarioService.createScenario(data);
        if (newScenario) {
          await loadAllData(); // Refresh all data
          successFeedback();
        }
        return newScenario;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create scenario';
        setError(errorMessage);
        errorFeedback();
        return null;
      }
    },
    [loadAllData, successFeedback, errorFeedback]
  );

  /**
   * Update scenario
   */
  const updateScenario = useCallback(
    async (
      id: string,
      updates: UpdateScenarioDto
    ): Promise<EnhancedScenario | null> => {
      try {
        setError(null);
        const updatedScenario = await scenarioService.updateScenario(
          id,
          updates
        );
        if (updatedScenario) {
          await loadAllData(); // Refresh all data
          successFeedback();
        }
        return updatedScenario;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update scenario';
        setError(errorMessage);
        errorFeedback();
        return null;
      }
    },
    [loadAllData, successFeedback, errorFeedback]
  );

  /**
   * Delete scenario
   */
  const deleteScenario = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);
        const success = await scenarioService.deleteScenario(id);
        if (success) {
          await loadAllData(); // Refresh all data
          successFeedback();
        }
        return success;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete scenario';
        setError(errorMessage);
        errorFeedback();
        return false;
      }
    },
    [loadAllData, successFeedback, errorFeedback]
  );

  /**
   * Clone scenario
   */
  const cloneScenario = useCallback(
    async (id: string, newName: string): Promise<EnhancedScenario | null> => {
      try {
        setError(null);
        const clonedScenario = await scenarioService.cloneScenario(id, newName);
        if (clonedScenario) {
          await loadAllData(); // Refresh all data
          successFeedback();
        }
        return clonedScenario;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to clone scenario';
        setError(errorMessage);
        errorFeedback();
        return null;
      }
    },
    [loadAllData, successFeedback, errorFeedback]
  );

  /**
   * Create from template
   */
  const createFromTemplate = useCallback(
    async (
      templateType: ScenarioTemplateType,
      customizations?: Partial<CreateScenarioDto>
    ): Promise<EnhancedScenario | null> => {
      try {
        setError(null);
        const newScenario = await scenarioService.createFromTemplate(
          templateType,
          customizations
        );
        if (newScenario) {
          await loadAllData(); // Refresh all data
          successFeedback();
        }
        return newScenario;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to create scenario from template';
        setError(errorMessage);
        errorFeedback();
        return null;
      }
    },
    [loadAllData, successFeedback, errorFeedback]
  );

  /**
   * Validate scenario
   */
  const validateScenario = useCallback(
    async (
      data: Partial<CreateScenarioDto>
    ): Promise<ScenarioValidationResult> => {
      return await scenarioService.validateScenario(data);
    },
    []
  );

  /**
   * Search scenarios
   */
  const searchScenarios = useCallback(
    async (searchFilters: ScenarioSearchFilters) => {
      setCurrentFilters(searchFilters);
      await loadScenarios();
    },
    [loadScenarios]
  );

  /**
   * Clear search
   */
  const clearSearch = useCallback(() => {
    setCurrentFilters(undefined);
  }, []);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAllData();
    } finally {
      setRefreshing(false);
    }
  }, [loadAllData]);

  /**
   * Refresh templates
   */
  const refreshTemplates = useCallback(async () => {
    await loadTemplates();
  }, [loadTemplates]);

  /**
   * Refresh stats
   */
  const refreshStats = useCallback(async () => {
    await loadStats();
  }, [loadStats]);

  // Auto-load data on mount
  useEffect(() => {
    if (autoLoad) {
      loadAllData();
    }
  }, [autoLoad, loadAllData]);

  // Re-load scenarios when filters change
  useEffect(() => {
    if (currentFilters !== filters) {
      loadScenarios();
    }
  }, [currentFilters, filters, loadScenarios]);

  return {
    // Data
    scenarios,
    templates,
    stats,
    folders,
    tags,

    // State
    loading,
    error,
    refreshing,

    // Actions
    createScenario,
    updateScenario,
    deleteScenario,
    cloneScenario,
    createFromTemplate,
    validateScenario,

    // Search and filtering
    searchScenarios,
    clearSearch,

    // Refresh
    refresh,
    refreshTemplates,
    refreshStats,
  };
};

export default useScenarios;

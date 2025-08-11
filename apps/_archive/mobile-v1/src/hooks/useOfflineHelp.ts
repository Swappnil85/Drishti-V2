import { useState, useEffect, useCallback } from 'react';
import { 
  offlineHelpService, 
  HelpArticle, 
  Tutorial, 
  HelpSearchResult, 
  OfflineHelpStats 
} from '../services/help/OfflineHelpService';

/**
 * React hook for offline help functionality
 * Provides access to help articles, tutorials, and search capabilities
 */
export function useOfflineHelp() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [helpStats, setHelpStats] = useState<OfflineHelpStats | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    const initializeHelp = async () => {
      try {
        await offlineHelpService.initialize();
        
        if (mounted) {
          const stats = await offlineHelpService.getHelpStats();
          setHelpStats(stats);
          
          const helpCategories = offlineHelpService.getHelpCategories();
          setCategories(helpCategories);
          
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize offline help:', error);
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    initializeHelp();

    return () => {
      mounted = false;
    };
  }, []);

  // Search help content
  const searchHelp = useCallback((query: string): HelpSearchResult[] => {
    if (!isInitialized || !query.trim()) return [];
    return offlineHelpService.searchHelp(query);
  }, [isInitialized]);

  // Get help article by ID
  const getHelpArticle = useCallback((id: string): HelpArticle | null => {
    if (!isInitialized) return null;
    return offlineHelpService.getHelpArticle(id);
  }, [isInitialized]);

  // Get tutorial by ID
  const getTutorial = useCallback((id: string): Tutorial | null => {
    if (!isInitialized) return null;
    return offlineHelpService.getTutorial(id);
  }, [isInitialized]);

  // Get help articles by category
  const getHelpArticlesByCategory = useCallback((category: string): HelpArticle[] => {
    if (!isInitialized) return [];
    return offlineHelpService.getHelpArticlesByCategory(category);
  }, [isInitialized]);

  // Get tutorials by category
  const getTutorialsByCategory = useCallback((category: string): Tutorial[] => {
    if (!isInitialized) return [];
    return offlineHelpService.getTutorialsByCategory(category);
  }, [isInitialized]);

  // Start tutorial
  const startTutorial = useCallback(async (tutorialId: string): Promise<boolean> => {
    if (!isInitialized) return false;
    return await offlineHelpService.startTutorial(tutorialId);
  }, [isInitialized]);

  // Complete tutorial step
  const completeTutorialStep = useCallback(async (tutorialId: string, stepId: string): Promise<boolean> => {
    if (!isInitialized) return false;
    return await offlineHelpService.completeTutorialStep(tutorialId, stepId);
  }, [isInitialized]);

  // Get tutorial progress
  const getTutorialProgress = useCallback((tutorialId: string): any => {
    if (!isInitialized) return null;
    return offlineHelpService.getTutorialProgress(tutorialId);
  }, [isInitialized]);

  // Refresh help statistics
  const refreshHelpStats = useCallback(async () => {
    if (!isInitialized) return;
    
    try {
      const stats = await offlineHelpService.getHelpStats();
      setHelpStats(stats);
    } catch (error) {
      console.error('Failed to refresh help stats:', error);
    }
  }, [isInitialized]);

  return {
    // State
    isInitialized,
    helpStats,
    categories,

    // Actions
    searchHelp,
    getHelpArticle,
    getTutorial,
    getHelpArticlesByCategory,
    getTutorialsByCategory,
    startTutorial,
    completeTutorialStep,
    getTutorialProgress,
    refreshHelpStats,

    // Computed values
    totalArticles: helpStats?.totalArticles || 0,
    totalTutorials: helpStats?.totalTutorials || 0,
    completedTutorials: helpStats?.completedTutorials || 0,
    hasContent: (helpStats?.totalArticles || 0) > 0 || (helpStats?.totalTutorials || 0) > 0,
  };
}

/**
 * React hook for tutorial management
 * Provides tutorial-specific functionality with progress tracking
 */
export function useTutorial(tutorialId: string) {
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadTutorial = async () => {
      try {
        setIsLoading(true);
        
        await offlineHelpService.initialize();
        
        if (mounted) {
          const tutorialData = offlineHelpService.getTutorial(tutorialId);
          setTutorial(tutorialData);
          
          const progressData = offlineHelpService.getTutorialProgress(tutorialId);
          setProgress(progressData);
          
          if (progressData) {
            setCurrentStepIndex(progressData.currentStep || 0);
          }
        }
      } catch (error) {
        console.error('Failed to load tutorial:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    if (tutorialId) {
      loadTutorial();
    }

    return () => {
      mounted = false;
    };
  }, [tutorialId]);

  // Start tutorial
  const startTutorial = useCallback(async () => {
    if (!tutorial) return false;
    
    try {
      const success = await offlineHelpService.startTutorial(tutorialId);
      if (success) {
        const newProgress = offlineHelpService.getTutorialProgress(tutorialId);
        setProgress(newProgress);
        setCurrentStepIndex(0);
      }
      return success;
    } catch (error) {
      console.error('Failed to start tutorial:', error);
      return false;
    }
  }, [tutorial, tutorialId]);

  // Complete current step
  const completeCurrentStep = useCallback(async () => {
    if (!tutorial || !tutorial.steps[currentStepIndex]) return false;
    
    try {
      const stepId = tutorial.steps[currentStepIndex].id;
      const success = await offlineHelpService.completeTutorialStep(tutorialId, stepId);
      
      if (success) {
        const updatedProgress = offlineHelpService.getTutorialProgress(tutorialId);
        setProgress(updatedProgress);
        
        // Move to next step if not completed
        if (currentStepIndex < tutorial.steps.length - 1) {
          setCurrentStepIndex(currentStepIndex + 1);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Failed to complete tutorial step:', error);
      return false;
    }
  }, [tutorial, tutorialId, currentStepIndex]);

  // Go to specific step
  const goToStep = useCallback((stepIndex: number) => {
    if (!tutorial || stepIndex < 0 || stepIndex >= tutorial.steps.length) return false;
    
    setCurrentStepIndex(stepIndex);
    return true;
  }, [tutorial]);

  // Go to next step
  const nextStep = useCallback(() => {
    if (!tutorial || currentStepIndex >= tutorial.steps.length - 1) return false;
    
    setCurrentStepIndex(currentStepIndex + 1);
    return true;
  }, [tutorial, currentStepIndex]);

  // Go to previous step
  const previousStep = useCallback(() => {
    if (currentStepIndex <= 0) return false;
    
    setCurrentStepIndex(currentStepIndex - 1);
    return true;
  }, [currentStepIndex]);

  // Check if step is completed
  const isStepCompleted = useCallback((stepIndex: number) => {
    if (!tutorial || !progress) return false;
    
    const step = tutorial.steps[stepIndex];
    return progress.completedSteps?.includes(step?.id) || false;
  }, [tutorial, progress]);

  return {
    // State
    tutorial,
    progress,
    currentStepIndex,
    isLoading,

    // Actions
    startTutorial,
    completeCurrentStep,
    goToStep,
    nextStep,
    previousStep,
    isStepCompleted,

    // Computed values
    currentStep: tutorial?.steps[currentStepIndex] || null,
    totalSteps: tutorial?.steps.length || 0,
    completedSteps: progress?.completedSteps?.length || 0,
    isCompleted: progress?.completed || false,
    progressPercentage: tutorial ? (progress?.completedSteps?.length || 0) / tutorial.steps.length * 100 : 0,
    canGoNext: tutorial ? currentStepIndex < tutorial.steps.length - 1 : false,
    canGoPrevious: currentStepIndex > 0,
    isStarted: !!progress,
  };
}

/**
 * React hook for help search functionality
 */
export function useHelpSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HelpSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Perform search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      
      await offlineHelpService.initialize();
      const results = offlineHelpService.searchHelp(query);
      
      setSearchResults(results);
      
      // Add to search history
      setSearchHistory(prev => {
        const newHistory = [query, ...prev.filter(item => item !== query)];
        return newHistory.slice(0, 10); // Keep only last 10 searches
      });
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Update search query and perform search
  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    performSearch(query);
  }, [performSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  return {
    // State
    searchQuery,
    searchResults,
    isSearching,
    searchHistory,

    // Actions
    updateSearchQuery,
    performSearch,
    clearSearch,

    // Computed values
    hasResults: searchResults.length > 0,
    hasQuery: searchQuery.trim().length > 0,
    resultCount: searchResults.length,
  };
}

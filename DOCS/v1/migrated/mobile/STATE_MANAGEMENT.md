# State Management

## Overview

Drishti uses Zustand for state management, providing a lightweight, TypeScript-first solution for managing application state across the mobile app.

## Store Architecture

### Main Store Structure
```typescript
interface AppState {
  // Authentication state
  auth: AuthState;
  
  // Camera and analysis state
  camera: CameraState;
  
  // User interface state
  ui: UIState;
  
  // Application settings
  settings: SettingsState;
  
  // Actions
  actions: AppActions;
}
```

### Authentication State
```typescript
interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}
```

### Camera State
```typescript
interface CameraState {
  isActive: boolean;
  currentImage: CameraCapture | null;
  analysisHistory: VisualAnalysis[];
  isAnalyzing: boolean;
  analysisError: string | null;
}

interface CameraActions {
  setCurrentImage: (image: CameraCapture | null) => void;
  addAnalysis: (analysis: VisualAnalysis) => void;
  clearAnalysisHistory: () => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setAnalysisError: (error: string | null) => void;
}
```

## Store Implementation

### Main Store
```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAppStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        auth: {
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        },
        
        camera: {
          isActive: false,
          currentImage: null,
          analysisHistory: [],
          isAnalyzing: false,
          analysisError: null
        },
        
        ui: {
          theme: 'light',
          isLoading: false,
          activeScreen: 'Camera',
          notifications: []
        },
        
        settings: {
          language: 'en',
          voiceEnabled: true,
          autoAnalysis: false,
          highContrast: false,
          fontSize: 'medium'
        },

        // Authentication actions
        login: async (email: string, password: string) => {
          set(state => ({
            auth: { ...state.auth, isLoading: true, error: null }
          }));

          try {
            const response = await authService.login(email, password);
            
            // Store tokens securely
            await storeTokensSecurely(response.tokens);
            
            set(state => ({
              auth: {
                ...state.auth,
                user: response.user,
                tokens: response.tokens,
                isAuthenticated: true,
                isLoading: false
              }
            }));
          } catch (error) {
            set(state => ({
              auth: {
                ...state.auth,
                error: error.message,
                isLoading: false
              }
            }));
            throw error;
          }
        },

        logout: async () => {
          try {
            await authService.logout();
            await clearStoredTokens();
            
            set(state => ({
              auth: {
                user: null,
                tokens: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
              },
              camera: {
                ...state.camera,
                analysisHistory: []
              }
            }));
          } catch (error) {
            console.error('Logout error:', error);
          }
        },

        // Camera actions
        setCurrentImage: (image: CameraCapture | null) => {
          set(state => ({
            camera: { ...state.camera, currentImage: image }
          }));
        },

        addAnalysis: (analysis: VisualAnalysis) => {
          set(state => ({
            camera: {
              ...state.camera,
              analysisHistory: [analysis, ...state.camera.analysisHistory],
              isAnalyzing: false,
              analysisError: null
            }
          }));
        },

        // Settings actions
        updateSettings: (newSettings: Partial<SettingsState>) => {
          set(state => ({
            settings: { ...state.settings, ...newSettings }
          }));
        }
      }),
      {
        name: 'drishti-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          settings: state.settings,
          // Don't persist sensitive auth data or temporary camera state
        })
      }
    )
  )
);
```

## Custom Hooks

### Authentication Hook
```typescript
const useAuth = () => {
  const auth = useAppStore(state => state.auth);
  const login = useAppStore(state => state.login);
  const logout = useAppStore(state => state.logout);
  const register = useAppStore(state => state.register);
  
  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    login,
    logout,
    register
  };
};
```

### Camera Hook
```typescript
const useCamera = () => {
  const camera = useAppStore(state => state.camera);
  const setCurrentImage = useAppStore(state => state.setCurrentImage);
  const addAnalysis = useAppStore(state => state.addAnalysis);
  
  const analyzeImage = async (image: CameraCapture) => {
    try {
      useAppStore.setState(state => ({
        camera: { ...state.camera, isAnalyzing: true, analysisError: null }
      }));
      
      const analysis = await analysisService.analyzeImage(image);
      addAnalysis(analysis);
      
      return analysis;
    } catch (error) {
      useAppStore.setState(state => ({
        camera: {
          ...state.camera,
          isAnalyzing: false,
          analysisError: error.message
        }
      }));
      throw error;
    }
  };
  
  return {
    currentImage: camera.currentImage,
    analysisHistory: camera.analysisHistory,
    isAnalyzing: camera.isAnalyzing,
    analysisError: camera.analysisError,
    setCurrentImage,
    analyzeImage
  };
};
```

### Settings Hook
```typescript
const useSettings = () => {
  const settings = useAppStore(state => state.settings);
  const updateSettings = useAppStore(state => state.updateSettings);
  
  const toggleVoice = () => {
    updateSettings({ voiceEnabled: !settings.voiceEnabled });
  };
  
  const setLanguage = (language: string) => {
    updateSettings({ language });
  };
  
  return {
    ...settings,
    updateSettings,
    toggleVoice,
    setLanguage
  };
};
```

## State Persistence

### Secure Storage for Sensitive Data
```typescript
import * as SecureStore from 'expo-secure-store';

const storeTokensSecurely = async (tokens: AuthTokens) => {
  await SecureStore.setItemAsync('access_token', tokens.accessToken);
  await SecureStore.setItemAsync('refresh_token', tokens.refreshToken);
};

const getStoredTokens = async (): Promise<AuthTokens | null> => {
  try {
    const accessToken = await SecureStore.getItemAsync('access_token');
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    
    if (!accessToken || !refreshToken) return null;
    
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error retrieving tokens:', error);
    return null;
  }
};
```

### AsyncStorage for App Preferences
```typescript
// Zustand persist middleware automatically handles AsyncStorage
const persistConfig = {
  name: 'drishti-storage',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state: AppState) => ({
    settings: state.settings,
    ui: {
      theme: state.ui.theme
    }
  })
};
```

## State Synchronization

### Real-time Updates
```typescript
// Subscribe to store changes for real-time updates
useEffect(() => {
  const unsubscribe = useAppStore.subscribe(
    (state) => state.auth.isAuthenticated,
    (isAuthenticated) => {
      if (!isAuthenticated) {
        // Clear sensitive data when user logs out
        clearCameraHistory();
        clearCachedImages();
      }
    }
  );
  
  return unsubscribe;
}, []);
```

### Background State Management
```typescript
import { AppState } from 'react-native';

// Handle app state changes
useEffect(() => {
  const handleAppStateChange = (nextAppState: string) => {
    if (nextAppState === 'background') {
      // Save critical state before app goes to background
      useAppStore.getState().saveState();
    } else if (nextAppState === 'active') {
      // Refresh tokens and sync state when app becomes active
      useAppStore.getState().refreshSession();
    }
  };

  const subscription = AppState.addEventListener('change', handleAppStateChange);
  return () => subscription?.remove();
}, []);
```

## Testing State Management

### Store Testing
```typescript
import { renderHook, act } from '@testing-library/react-hooks';

describe('useAuth', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.setState({
      auth: {
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      }
    });
  });

  test('should login user successfully', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBeTruthy();
  });
});
```

### Integration Testing
```typescript
// Test state changes across components
test('should update analysis history after capture', async () => {
  const { getByTestId } = render(<CameraScreen />);
  
  const captureButton = getByTestId('capture-button');
  fireEvent.press(captureButton);
  
  // Wait for analysis to complete
  await waitFor(() => {
    const store = useAppStore.getState();
    expect(store.camera.analysisHistory).toHaveLength(1);
  });
});
```

## Performance Considerations

### Selector Optimization
```typescript
// Use specific selectors to prevent unnecessary re-renders
const user = useAppStore(state => state.auth.user);
const isLoading = useAppStore(state => state.auth.isLoading);

// Instead of
const auth = useAppStore(state => state.auth); // Re-renders on any auth change
```

### State Normalization
```typescript
// Normalize complex state for better performance
interface NormalizedAnalysisState {
  analyses: Record<string, VisualAnalysis>;
  analysisIds: string[];
  currentAnalysisId: string | null;
}
```

### Memory Management
- Clear large objects when no longer needed
- Implement state cleanup on logout
- Limit history size to prevent memory bloat
- Use weak references for temporary data

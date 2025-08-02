import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, AuthState, User, AuthTokens } from '../services/auth/AuthService';

// Auth context interface
interface AuthContextType {
  authState: AuthState;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component that wraps the app and provides authentication state
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    tokens: null,
    isLoading: true,
  });

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.addAuthListener((newState) => {
      setAuthState(newState);
    });

    // Get initial auth state
    setAuthState(authService.getAuthState());

    return unsubscribe;
  }, []);

  /**
   * Login user with email and password
   */
  const login = async (email: string, password: string) => {
    try {
      const result = await authService.login({ email, password });
      
      if (result.success) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: result.error || 'Login failed' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  };

  /**
   * Register new user
   */
  const register = async (name: string, email: string, password: string) => {
    try {
      const result = await authService.register({ name, email, password });
      
      if (result.success) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: result.error || 'Registration failed' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  /**
   * Refresh authentication token
   */
  const refreshToken = async (): Promise<boolean> => {
    try {
      const newToken = await authService.refreshAccessToken();
      return !!newToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  const contextValue: AuthContextType = {
    authState,
    login,
    register,
    logout,
    refreshToken,
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    isLoading: authState.isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

/**
 * Hook to get current user
 */
export const useUser = (): User | null => {
  const { user } = useAuth();
  return user;
};

/**
 * Higher-order component to protect routes that require authentication
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      // You can replace this with a loading spinner component
      return null;
    }

    if (!isAuthenticated) {
      // You can replace this with a redirect to login screen
      return null;
    }

    return <Component {...props} />;
  };
};

/**
 * Component to conditionally render content based on authentication status
 */
export const AuthGuard: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}> = ({ children, fallback = null, requireAuth = true }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return fallback;
  }

  if (requireAuth && !isAuthenticated) {
    return fallback;
  }

  if (!requireAuth && isAuthenticated) {
    return fallback;
  }

  return <>{children}</>;
};

export default AuthContext;

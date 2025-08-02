import { useState, useEffect } from 'react';
import { userService, CreateUserData } from '../database/services/UserService';
import User from '../database/models/User';

// Hook for managing users
export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all users
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const allUsers = await userService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Create a new user
  const createUser = async (userData: CreateUserData): Promise<User | null> => {
    try {
      setError(null);
      const newUser = await userService.createUser(userData);
      await loadUsers(); // Refresh the list
      return newUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
      return null;
    }
  };

  // Update a user
  const updateUser = async (userId: string, updates: Partial<CreateUserData>): Promise<boolean> => {
    try {
      setError(null);
      const updatedUser = await userService.updateUser(userId, updates);
      if (updatedUser) {
        await loadUsers(); // Refresh the list
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      return false;
    }
  };

  // Delete a user
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await userService.deleteUser(userId);
      if (success) {
        await loadUsers(); // Refresh the list
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      return false;
    }
  };

  // Search users
  const searchUsers = async (query: string): Promise<User[]> => {
    try {
      setError(null);
      return await userService.searchUsers(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search users');
      return [];
    }
  };

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  return {
    users,
    loading,
    error,
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    searchUsers,
  };
};

// Hook for managing a single user
export const useUser = (userId?: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user by ID
  const loadUser = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const foundUser = await userService.getUserById(id);
      setUser(foundUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  // Load user by email
  const loadUserByEmail = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      const foundUser = await userService.getUserByEmail(email);
      setUser(foundUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  // Update current user
  const updateCurrentUser = async (updates: Partial<CreateUserData>): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);
      const updatedUser = await userService.updateUser(user.id, updates);
      if (updatedUser) {
        setUser(updatedUser);
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      return false;
    }
  };

  // Load user on mount if userId provided
  useEffect(() => {
    if (userId) {
      loadUser(userId);
    } else {
      setLoading(false);
    }
  }, [userId]);

  return {
    user,
    loading,
    error,
    loadUser,
    loadUserByEmail,
    updateCurrentUser,
  };
};

// Hook for database statistics
export const useDatabaseStats = () => {
  const [stats, setStats] = useState({
    userCount: 0,
    activeUserCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [totalUsers, activeUsers] = await Promise.all([
        userService.getUserCount(),
        userService.getActiveUsers(),
      ]);

      setStats({
        userCount: totalUsers,
        activeUserCount: activeUsers.length,
      });
    } catch (err) {
      console.error('Failed to load database stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return {
    stats,
    loading,
    loadStats,
  };
};

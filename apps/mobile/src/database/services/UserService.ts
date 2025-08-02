import { Q } from '@nozbe/watermelondb';
import database from '../index';
import User, { UserPreferences } from '../models/User';

// User creation interface
export interface CreateUserData {
  name: string;
  email: string;
  avatarUrl?: string;
  preferences?: Partial<UserPreferences>;
}

// User service class
export class UserService {
  private usersCollection = database.get<User>('users');

  // Create a new user
  async createUser(userData: CreateUserData): Promise<User> {
    const user = await database.write(async () => {
      return await this.usersCollection.create(user => {
        user.name = userData.name;
        user.email = userData.email;
        if (userData.avatarUrl !== undefined) {
          user.avatarUrl = userData.avatarUrl;
        }
        user.isActive = true;
        user.lastLoginAt = new Date();
        
        // Set preferences
        const defaultPreferences: UserPreferences = {
          language: 'en',
          theme: 'light',
          voiceEnabled: true,
          autoAnalysis: false,
          notifications: true,
        };
        user.preferences = { ...defaultPreferences, ...userData.preferences };
      });
    });

    return user;
  }

  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    try {
      return await this.usersCollection.find(id);
    } catch {
      return null;
    }
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.usersCollection
      .query(Q.where('email', email))
      .fetch();
    
    return users.length > 0 ? users[0] : null;
  }

  // Get all users
  async getAllUsers(): Promise<User[]> {
    return await this.usersCollection.query().fetch();
  }

  // Get active users
  async getActiveUsers(): Promise<User[]> {
    return await this.usersCollection
      .query(Q.where('is_active', true))
      .fetch();
  }

  // Update user
  async updateUser(userId: string, updates: Partial<CreateUserData>): Promise<User | null> {
    const user = await this.getUserById(userId);
    if (!user) return null;

    await database.write(async () => {
      await user.update(u => {
        if (updates.name !== undefined) u.name = updates.name;
        if (updates.email !== undefined) u.email = updates.email;
        if (updates.avatarUrl !== undefined) u.avatarUrl = updates.avatarUrl;
        if (updates.preferences !== undefined) {
          const currentPreferences = u.preferences;
          u.preferences = { ...currentPreferences, ...updates.preferences };
        }
      });
    });

    return user;
  }

  // Delete user
  async deleteUser(userId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;

    await database.write(async () => {
      await user.destroyPermanently();
    });

    return true;
  }

  // Soft delete (deactivate) user
  async deactivateUser(userId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;

    await user.setActive(false);
    return true;
  }

  // Activate user
  async activateUser(userId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;

    await user.setActive(true);
    return true;
  }

  // Update user login timestamp
  async recordLogin(userId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;

    await user.updateLastLogin();
    return true;
  }

  // Search users by name or email
  async searchUsers(query: string): Promise<User[]> {
    const lowerQuery = query.toLowerCase();
    
    return await this.usersCollection
      .query(
        Q.or(
          Q.where('name', Q.like(`%${lowerQuery}%`)),
          Q.where('email', Q.like(`%${lowerQuery}%`))
        )
      )
      .fetch();
  }

  // Get user count
  async getUserCount(): Promise<number> {
    const users = await this.getAllUsers();
    return users.length;
  }

  // Clear all users (for testing/development)
  async clearAllUsers(): Promise<void> {
    const users = await this.getAllUsers();
    
    await database.write(async () => {
      for (const user of users) {
        await user.destroyPermanently();
      }
    });
  }
}

// Export singleton instance
export const userService = new UserService();

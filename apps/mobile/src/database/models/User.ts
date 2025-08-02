import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

// User preferences interface
export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark';
  voiceEnabled: boolean;
  autoAnalysis: boolean;
  notifications: boolean;
}

// User model class
export default class User extends Model {
  static table = 'users';

  // User fields
  @field('name') name!: string;
  @field('email') email!: string;
  @field('avatar_url') avatarUrl?: string;
  @field('is_active') isActive!: boolean;
  @date('last_login_at') lastLoginAt?: Date;
  @field('preferences') preferencesRaw?: string;

  // Timestamps
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Computed properties
  get preferences(): UserPreferences {
    if (!this.preferencesRaw) {
      return {
        language: 'en',
        theme: 'light',
        voiceEnabled: true,
        autoAnalysis: false,
        notifications: true,
      };
    }
    
    try {
      return JSON.parse(this.preferencesRaw);
    } catch {
      return {
        language: 'en',
        theme: 'light',
        voiceEnabled: true,
        autoAnalysis: false,
        notifications: true,
      };
    }
  }

  set preferences(value: UserPreferences) {
    this.preferencesRaw = JSON.stringify(value);
  }

  // Helper methods
  get displayName(): string {
    return this.name || this.email.split('@')[0];
  }

  get isOnline(): boolean {
    if (!this.lastLoginAt) return false;
    
    // Consider user online if last login was within 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return this.lastLoginAt.getTime() > fiveMinutesAgo;
  }

  // Update last login timestamp
  async updateLastLogin(): Promise<void> {
    await this.update(user => {
      user.lastLoginAt = new Date();
    });
  }

  // Update user preferences
  async updatePreferences(newPreferences: Partial<UserPreferences>): Promise<void> {
    const currentPreferences = this.preferences;
    const updatedPreferences = { ...currentPreferences, ...newPreferences };
    
    await this.update(user => {
      user.preferences = updatedPreferences;
    });
  }

  // Activate/deactivate user
  async setActive(active: boolean): Promise<void> {
    await this.update(user => {
      user.isActive = active;
    });
  }
}

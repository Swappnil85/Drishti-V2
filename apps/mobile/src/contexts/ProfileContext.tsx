/**
 * Profile Context
 * Manages user profile state and provides profile functionality
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import ProfileService from '../services/profile/ProfileService';
import PhotoUploadService from '../services/profile/PhotoUploadService';
import PrivacyDashboardService from '../services/profile/PrivacyDashboardService';
import MLRecommendationsService from '../services/profile/MLRecommendationsService';
import {
  UserProfile,
  PersonalizedRecommendation,
  SecurityEvent,
  ProfileChangeHistory,
  UpdateProfileRequest,
  PrivacyDashboard,
} from '../types/profile';

interface ProfileContextType {
  // State
  profile: UserProfile | null;
  recommendations: PersonalizedRecommendation[];
  securityEvents: SecurityEvent[];
  changeHistory: ProfileChangeHistory[];
  loading: boolean;
  error: string | null;

  // Profile Management
  createProfile: (profileData: Partial<UserProfile>) => Promise<UserProfile>;
  updateProfile: (request: UpdateProfileRequest) => Promise<UserProfile>;
  updateMultipleFields: (
    updates: UpdateProfileRequest[]
  ) => Promise<UserProfile>;
  refreshProfile: () => Promise<void>;
  deleteProfile: () => Promise<void>;

  // Recommendations
  getRecommendations: () => Promise<PersonalizedRecommendation[]>;
  acceptRecommendation: (recommendationId: string) => Promise<void>;
  dismissRecommendation: (
    recommendationId: string,
    feedback?: string
  ) => Promise<void>;
  generateRecommendations: () => Promise<PersonalizedRecommendation[]>;

  // Data Export
  exportProfileData: (format?: 'json' | 'csv') => Promise<string>;

  // Advanced Features
  getPrivacyDashboard: () => Promise<PrivacyDashboard>;
  updatePrivacySetting: (category: string, enabled: boolean) => Promise<void>;
  generateAdvancedRecommendations: () => Promise<PersonalizedRecommendation[]>;
  uploadProfilePhoto: (source: 'camera' | 'gallery') => Promise<boolean>;

  // Utilities
  isProfileComplete: boolean;
  hasRecommendations: boolean;
  securityScore: number;
  privacyScore: number;
}

interface ProfileProviderProps {
  children: ReactNode;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<ProfileProviderProps> = ({
  children,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<
    PersonalizedRecommendation[]
  >([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [changeHistory, setChangeHistory] = useState<ProfileChangeHistory[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize profile service
  useEffect(() => {
    initializeProfile();
  }, []);

  const initializeProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      await ProfileService.initialize();

      const userProfile = await ProfileService.getProfile();
      setProfile(userProfile);

      if (userProfile) {
        const recs = await ProfileService.getRecommendations();
        setRecommendations(recs);
      }
    } catch (err) {
      console.error('Failed to initialize profile:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to initialize profile'
      );
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (
    profileData: Partial<UserProfile>
  ): Promise<UserProfile> => {
    try {
      setLoading(true);
      setError(null);

      const newProfile = await ProfileService.createProfile(profileData);
      setProfile(newProfile);

      // Generate initial recommendations
      const recs = await ProfileService.generateRecommendations();
      setRecommendations(recs);

      return newProfile;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (
    request: UpdateProfileRequest
  ): Promise<UserProfile> => {
    try {
      setError(null);

      const updatedProfile = await ProfileService.updateProfile(request);
      setProfile(updatedProfile);

      // Refresh recommendations if needed
      const recs = await ProfileService.getRecommendations();
      setRecommendations(recs);

      return updatedProfile;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateMultipleFields = async (
    updates: UpdateProfileRequest[]
  ): Promise<UserProfile> => {
    try {
      setLoading(true);
      setError(null);

      const updatedProfile = await ProfileService.updateMultipleFields(updates);
      setProfile(updatedProfile);

      // Refresh recommendations
      const recs = await ProfileService.getRecommendations();
      setRecommendations(recs);

      return updatedProfile;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const userProfile = await ProfileService.getProfile();
      setProfile(userProfile);

      if (userProfile) {
        const recs = await ProfileService.getRecommendations();
        setRecommendations(recs);
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to refresh profile'
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteProfile = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await ProfileService.deleteProfile();

      // Clear state
      setProfile(null);
      setRecommendations([]);
      setSecurityEvents([]);
      setChangeHistory([]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendations = async (): Promise<
    PersonalizedRecommendation[]
  > => {
    try {
      const recs = await ProfileService.getRecommendations();
      setRecommendations(recs);
      return recs;
    } catch (err) {
      console.error('Failed to get recommendations:', err);
      return [];
    }
  };

  const acceptRecommendation = async (
    recommendationId: string
  ): Promise<void> => {
    try {
      await ProfileService.acceptRecommendation(recommendationId);

      // Update local state
      setRecommendations(prev =>
        prev.map(rec =>
          rec.id === recommendationId ? { ...rec, accepted: true } : rec
        )
      );
    } catch (err) {
      console.error('Failed to accept recommendation:', err);
      throw new Error('Failed to accept recommendation');
    }
  };

  const dismissRecommendation = async (
    recommendationId: string,
    feedback?: string
  ): Promise<void> => {
    try {
      await ProfileService.dismissRecommendation(recommendationId, feedback);

      // Update local state
      setRecommendations(prev =>
        prev.map(rec =>
          rec.id === recommendationId
            ? { ...rec, dismissed: true, feedback }
            : rec
        )
      );
    } catch (err) {
      console.error('Failed to dismiss recommendation:', err);
      throw new Error('Failed to dismiss recommendation');
    }
  };

  const generateRecommendations = async (): Promise<
    PersonalizedRecommendation[]
  > => {
    try {
      const recs = await ProfileService.generateRecommendations();
      setRecommendations(recs);
      return recs;
    } catch (err) {
      console.error('Failed to generate recommendations:', err);
      return [];
    }
  };

  const exportProfileData = async (
    format: 'json' | 'csv' = 'json'
  ): Promise<string> => {
    try {
      return await ProfileService.exportProfileData(format);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to export profile data';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getPrivacyDashboard = async (): Promise<PrivacyDashboard> => {
    try {
      return await PrivacyDashboardService.getDashboard();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get privacy dashboard';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updatePrivacySetting = async (
    category: string,
    enabled: boolean
  ): Promise<void> => {
    try {
      await PrivacyDashboardService.updateDataCollection(category, enabled);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update privacy setting';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const generateAdvancedRecommendations = async (): Promise<
    PersonalizedRecommendation[]
  > => {
    try {
      if (!profile) {
        throw new Error('No profile found');
      }
      const recs =
        await MLRecommendationsService.generateAdvancedRecommendations(profile);
      setRecommendations(recs);
      return recs;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to generate advanced recommendations';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const uploadProfilePhoto = async (
    source: 'camera' | 'gallery'
  ): Promise<boolean> => {
    try {
      const result =
        source === 'camera'
          ? await PhotoUploadService.pickFromCamera()
          : await PhotoUploadService.pickFromGallery();

      if (result.success && profile) {
        // Save photo locally
        const filename = `profile_${Date.now()}.${result.metadata.format}`;
        const localUri = await PhotoUploadService.saveImageLocally(
          result.uri,
          filename
        );

        if (localUri) {
          await updateProfile({
            field: 'personalInfo.profilePicture',
            value: localUri,
          });

          await updateProfile({
            field: 'personalInfo.profilePictureMetadata',
            value: result.metadata,
          });

          return true;
        }
      }

      return false;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to upload profile photo';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Computed properties
  const isProfileComplete = profile
    ? profile.personalInfo.firstName &&
      profile.personalInfo.lastName &&
      profile.personalInfo.email &&
      profile.financialInfo.totalAnnualIncome > 0 &&
      profile.financialInfo.monthlyExpenses > 0
    : false;

  const hasRecommendations =
    recommendations.filter(rec => !rec.dismissed && !rec.accepted).length > 0;

  const securityScore = profile ? calculateSecurityScore(profile) : 0;
  const privacyScore = PrivacyDashboardService.getPrivacyScore();

  const value: ProfileContextType = {
    // State
    profile,
    recommendations,
    securityEvents,
    changeHistory,
    loading,
    error,

    // Profile Management
    createProfile,
    updateProfile,
    updateMultipleFields,
    refreshProfile,
    deleteProfile,

    // Recommendations
    getRecommendations,
    acceptRecommendation,
    dismissRecommendation,
    generateRecommendations,

    // Data Export
    exportProfileData,

    // Advanced Features
    getPrivacyDashboard,
    updatePrivacySetting,
    generateAdvancedRecommendations,
    uploadProfilePhoto,

    // Utilities
    isProfileComplete,
    hasRecommendations,
    securityScore,
    privacyScore,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};

// Helper function to calculate security score
function calculateSecurityScore(profile: UserProfile): number {
  let score = 0;
  const security = profile.securitySettings;

  if (security.biometricEnabled) score += 25;
  if (security.pinEnabled) score += 20;
  if (security.twoFactorEnabled) score += 30;
  if (security.autoLockEnabled) score += 10;
  if (security.sessionTimeout <= 15) score += 10;
  if (!security.cloudSyncEnabled && security.localOnlyMode) score += 5;

  return Math.min(100, score);
}

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export default ProfileProvider;

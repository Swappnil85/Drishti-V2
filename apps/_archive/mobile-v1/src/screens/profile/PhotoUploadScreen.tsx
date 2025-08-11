/**
 * Photo Upload Screen
 * Profile picture upload with camera and gallery options
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Card, Flex, Icon, Avatar } from '../../components/ui';
import { useProfile } from '../../contexts/ProfileContext';
import { useHaptic } from '../../hooks/useHaptic';
import { useNavigation } from '@react-navigation/native';
import PhotoUploadService, { PhotoUploadResult } from '../../services/profile/PhotoUploadService';

const PhotoUploadScreen: React.FC = () => {
  const { profile, updateProfile } = useProfile();
  const { buttonTap, successFeedback, errorFeedback } = useHaptic();
  const navigation = useNavigation();
  
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoUploadResult | null>(null);

  const handleTakePhoto = async () => {
    try {
      await buttonTap();
      setUploading(true);
      
      const result = await PhotoUploadService.pickFromCamera({
        quality: 0.8,
        maxWidth: 400,
        maxHeight: 400,
        format: 'jpeg',
        allowsEditing: true,
      });

      if (result.success) {
        setSelectedPhoto(result);
        await successFeedback();
      } else {
        if (result.error && !result.error.includes('cancelled')) {
          Alert.alert('Error', result.error);
          await errorFeedback();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
      await errorFeedback();
    } finally {
      setUploading(false);
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      await buttonTap();
      setUploading(true);
      
      const result = await PhotoUploadService.pickFromGallery({
        quality: 0.8,
        maxWidth: 400,
        maxHeight: 400,
        format: 'jpeg',
        allowsEditing: true,
      });

      if (result.success) {
        setSelectedPhoto(result);
        await successFeedback();
      } else {
        if (result.error && !result.error.includes('cancelled')) {
          Alert.alert('Error', result.error);
          await errorFeedback();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select photo');
      await errorFeedback();
    } finally {
      setUploading(false);
    }
  };

  const handleSavePhoto = async () => {
    if (!selectedPhoto || !profile) {
      return;
    }

    try {
      setUploading(true);
      await buttonTap();

      // Save photo locally
      const filename = `profile_${Date.now()}.${selectedPhoto.metadata.format}`;
      const localUri = await PhotoUploadService.saveImageLocally(selectedPhoto.uri, filename);

      if (localUri) {
        // Update profile with new photo
        await updateProfile({
          field: 'personalInfo.profilePicture',
          value: localUri,
        });

        // Update photo metadata
        await updateProfile({
          field: 'personalInfo.profilePictureMetadata',
          value: selectedPhoto.metadata,
        });

        await successFeedback();
        Alert.alert(
          'Success',
          'Profile picture updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error('Failed to save photo locally');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile picture');
      await errorFeedback();
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!profile?.personalInfo.profilePicture) {
      return;
    }

    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await buttonTap();

              // Delete local file if it exists
              if (profile.personalInfo.profilePicture) {
                await PhotoUploadService.deleteLocalImage(profile.personalInfo.profilePicture);
              }

              // Update profile to remove photo
              await updateProfile({
                field: 'personalInfo.profilePicture',
                value: '',
              });

              await updateProfile({
                field: 'personalInfo.profilePictureMetadata',
                value: null,
              });

              await successFeedback();
              Alert.alert('Success', 'Profile picture removed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove profile picture');
              await errorFeedback();
            }
          },
        },
      ]
    );
  };

  const handleCancel = async () => {
    await buttonTap();
    
    if (selectedPhoto) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard the selected photo?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const currentPhoto = selectedPhoto?.uri || profile?.personalInfo.profilePicture;
  const hasChanges = selectedPhoto !== null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Button variant="ghost" size="sm" onPress={handleCancel}>
          <Icon name="close" size="md" color="text.primary" />
        </Button>
        <Text variant="h6" weight="semiBold">Profile Picture</Text>
        <Button 
          variant="ghost" 
          size="sm" 
          onPress={handleSavePhoto}
          disabled={!hasChanges || uploading}
        >
          <Text variant="body2" weight="medium" color={hasChanges ? "primary.500" : "text.secondary"}>
            Save
          </Text>
        </Button>
      </View>

      <View style={styles.content}>
        {/* Current Photo Display */}
        <Card variant="outlined" padding="lg" style={styles.photoCard}>
          <Flex direction="column" align="center">
            <View style={styles.photoContainer}>
              {currentPhoto ? (
                <Image source={{ uri: currentPhoto }} style={styles.photo} />
              ) : (
                <Avatar
                  size="xl"
                  fallback={`${profile?.personalInfo.firstName?.[0] || ''}${profile?.personalInfo.lastName?.[0] || ''}`}
                />
              )}
            </View>
            
            {selectedPhoto && (
              <View style={styles.photoInfo}>
                <Text variant="caption" color="text.secondary" align="center">
                  {selectedPhoto.metadata.dimensions.width} × {selectedPhoto.metadata.dimensions.height} pixels
                </Text>
                <Text variant="caption" color="text.secondary" align="center">
                  {formatFileSize(selectedPhoto.metadata.compressedSize)}
                </Text>
                {selectedPhoto.metadata.originalSize > selectedPhoto.metadata.compressedSize && (
                  <Text variant="caption" color="success.500" align="center">
                    Compressed from {formatFileSize(selectedPhoto.metadata.originalSize)}
                  </Text>
                )}
              </View>
            )}
          </Flex>
        </Card>

        {/* Upload Options */}
        <Card variant="outlined" padding="lg" style={styles.optionsCard}>
          <Text variant="h6" weight="semiBold" style={styles.optionsTitle}>
            Upload Options
          </Text>
          
          <Flex direction="column" gap="md">
            <Button
              variant="outline"
              size="lg"
              onPress={handleTakePhoto}
              disabled={uploading}
              loading={uploading}
              style={styles.optionButton}
            >
              <Flex direction="row" align="center" justify="center">
                <Icon name="camera" size="md" color="primary.500" style={styles.optionIcon} />
                <Text variant="body1" weight="medium">Take Photo</Text>
              </Flex>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onPress={handleSelectFromGallery}
              disabled={uploading}
              loading={uploading}
              style={styles.optionButton}
            >
              <Flex direction="row" align="center" justify="center">
                <Icon name="images" size="md" color="primary.500" style={styles.optionIcon} />
                <Text variant="body1" weight="medium">Choose from Gallery</Text>
              </Flex>
            </Button>
            
            {profile?.personalInfo.profilePicture && (
              <Button
                variant="outline"
                size="lg"
                onPress={handleRemovePhoto}
                disabled={uploading}
                style={[styles.optionButton, styles.removeButton]}
              >
                <Flex direction="row" align="center" justify="center">
                  <Icon name="trash" size="md" color="error.500" style={styles.optionIcon} />
                  <Text variant="body1" weight="medium" color="error.500">Remove Photo</Text>
                </Flex>
              </Button>
            )}
          </Flex>
        </Card>

        {/* Guidelines */}
        <Card variant="filled" padding="lg" style={styles.guidelinesCard}>
          <Text variant="body2" weight="medium" style={styles.guidelinesTitle}>
            Photo Guidelines
          </Text>
          
          <Flex direction="column" gap="sm">
            <Flex direction="row" align="flex-start">
              <Icon name="checkmark-circle" size="sm" color="success.500" style={styles.guidelineIcon} />
              <Text variant="body2" color="text.secondary" style={styles.guidelineText}>
                Use a clear, well-lit photo of yourself
              </Text>
            </Flex>
            
            <Flex direction="row" align="flex-start">
              <Icon name="checkmark-circle" size="sm" color="success.500" style={styles.guidelineIcon} />
              <Text variant="body2" color="text.secondary" style={styles.guidelineText}>
                Square photos work best (1:1 aspect ratio)
              </Text>
            </Flex>
            
            <Flex direction="row" align="flex-start">
              <Icon name="checkmark-circle" size="sm" color="success.500" style={styles.guidelineIcon} />
              <Text variant="body2" color="text.secondary" style={styles.guidelineText}>
                Maximum file size: 5MB
              </Text>
            </Flex>
            
            <Flex direction="row" align="flex-start">
              <Icon name="checkmark-circle" size="sm" color="success.500" style={styles.guidelineIcon} />
              <Text variant="body2" color="text.secondary" style={styles.guidelineText}>
                Photos are automatically compressed and resized
              </Text>
            </Flex>
          </Flex>
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  photoCard: {
    marginBottom: 20,
  },
  photoContainer: {
    marginBottom: 16,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoInfo: {
    alignItems: 'center',
    gap: 4,
  },
  optionsCard: {
    marginBottom: 20,
  },
  optionsTitle: {
    marginBottom: 16,
  },
  optionButton: {
    paddingVertical: 16,
  },
  optionIcon: {
    marginRight: 12,
  },
  removeButton: {
    borderColor: '#EF4444',
  },
  guidelinesCard: {
    backgroundColor: '#F0F9FF',
  },
  guidelinesTitle: {
    marginBottom: 12,
  },
  guidelineIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  guidelineText: {
    flex: 1,
    lineHeight: 18,
  },
});

export default PhotoUploadScreen;

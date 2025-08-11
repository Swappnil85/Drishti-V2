/**
 * Photo Upload Service
 * Handles profile picture upload, compression, and management
 */

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { ProfilePictureMetadata } from '../../types/profile';

export interface PhotoUploadOptions {
  quality: number; // 0-1
  maxWidth: number;
  maxHeight: number;
  format: 'jpeg' | 'png' | 'webp';
  allowsEditing: boolean;
}

export interface PhotoUploadResult {
  uri: string;
  base64?: string;
  metadata: ProfilePictureMetadata;
  success: boolean;
  error?: string;
}

class PhotoUploadService {
  private defaultOptions: PhotoUploadOptions = {
    quality: 0.8,
    maxWidth: 400,
    maxHeight: 400,
    format: 'jpeg',
    allowsEditing: true,
  };

  /**
   * Request camera and media library permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // Request camera permission
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        return false;
      }

      // Request media library permission
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (mediaPermission.status !== 'granted') {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }

  /**
   * Pick image from camera
   */
  async pickFromCamera(options?: Partial<PhotoUploadOptions>): Promise<PhotoUploadResult> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return {
          uri: '',
          metadata: this.createEmptyMetadata(),
          success: false,
          error: 'Camera permission not granted',
        };
      }

      const finalOptions = { ...this.defaultOptions, ...options };
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: finalOptions.allowsEditing,
        aspect: [1, 1],
        quality: finalOptions.quality,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return {
          uri: '',
          metadata: this.createEmptyMetadata(),
          success: false,
          error: 'Image selection cancelled',
        };
      }

      const asset = result.assets[0];
      return await this.processImage(asset, finalOptions);
    } catch (error) {
      console.error('Failed to pick image from camera:', error);
      return {
        uri: '',
        metadata: this.createEmptyMetadata(),
        success: false,
        error: error instanceof Error ? error.message : 'Failed to pick image from camera',
      };
    }
  }

  /**
   * Pick image from gallery
   */
  async pickFromGallery(options?: Partial<PhotoUploadOptions>): Promise<PhotoUploadResult> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return {
          uri: '',
          metadata: this.createEmptyMetadata(),
          success: false,
          error: 'Media library permission not granted',
        };
      }

      const finalOptions = { ...this.defaultOptions, ...options };
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: finalOptions.allowsEditing,
        aspect: [1, 1],
        quality: finalOptions.quality,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return {
          uri: '',
          metadata: this.createEmptyMetadata(),
          success: false,
          error: 'Image selection cancelled',
        };
      }

      const asset = result.assets[0];
      return await this.processImage(asset, finalOptions);
    } catch (error) {
      console.error('Failed to pick image from gallery:', error);
      return {
        uri: '',
        metadata: this.createEmptyMetadata(),
        success: false,
        error: error instanceof Error ? error.message : 'Failed to pick image from gallery',
      };
    }
  }

  /**
   * Process and compress image
   */
  private async processImage(
    asset: ImagePicker.ImagePickerAsset,
    options: PhotoUploadOptions
  ): Promise<PhotoUploadResult> {
    try {
      // Get original file info
      const originalInfo = await FileSystem.getInfoAsync(asset.uri);
      const originalSize = originalInfo.exists ? originalInfo.size || 0 : 0;

      // Compress and resize image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        asset.uri,
        [
          {
            resize: {
              width: options.maxWidth,
              height: options.maxHeight,
            },
          },
        ],
        {
          compress: options.quality,
          format: this.getImageFormat(options.format),
          base64: true,
        }
      );

      // Get compressed file info
      const compressedInfo = await FileSystem.getInfoAsync(manipulatedImage.uri);
      const compressedSize = compressedInfo.exists ? compressedInfo.size || 0 : 0;

      // Create metadata
      const metadata: ProfilePictureMetadata = {
        originalSize,
        compressedSize,
        dimensions: {
          width: manipulatedImage.width,
          height: manipulatedImage.height,
        },
        uploadedAt: Date.now(),
        format: options.format,
      };

      return {
        uri: manipulatedImage.uri,
        base64: manipulatedImage.base64,
        metadata,
        success: true,
      };
    } catch (error) {
      console.error('Failed to process image:', error);
      return {
        uri: '',
        metadata: this.createEmptyMetadata(),
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process image',
      };
    }
  }

  /**
   * Save image to local storage
   */
  async saveImageLocally(uri: string, filename: string): Promise<string | null> {
    try {
      const directory = `${FileSystem.documentDirectory}profile_pictures/`;
      
      // Create directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(directory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      }

      const localUri = `${directory}${filename}`;
      await FileSystem.copyAsync({
        from: uri,
        to: localUri,
      });

      return localUri;
    } catch (error) {
      console.error('Failed to save image locally:', error);
      return null;
    }
  }

  /**
   * Delete local image
   */
  async deleteLocalImage(uri: string): Promise<boolean> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        await FileSystem.deleteAsync(uri);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete local image:', error);
      return false;
    }
  }

  /**
   * Get image format for ImageManipulator
   */
  private getImageFormat(format: string): ImageManipulator.SaveFormat {
    switch (format) {
      case 'png':
        return ImageManipulator.SaveFormat.PNG;
      case 'webp':
        return ImageManipulator.SaveFormat.WEBP;
      case 'jpeg':
      default:
        return ImageManipulator.SaveFormat.JPEG;
    }
  }

  /**
   * Create empty metadata
   */
  private createEmptyMetadata(): ProfilePictureMetadata {
    return {
      originalSize: 0,
      compressedSize: 0,
      dimensions: { width: 0, height: 0 },
      uploadedAt: Date.now(),
      format: 'jpeg',
    };
  }

  /**
   * Validate image file
   */
  validateImage(uri: string, maxSizeBytes: number = 5 * 1024 * 1024): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        const info = await FileSystem.getInfoAsync(uri);
        if (!info.exists) {
          resolve(false);
          return;
        }

        const size = info.size || 0;
        if (size > maxSizeBytes) {
          resolve(false);
          return;
        }

        resolve(true);
      } catch (error) {
        console.error('Failed to validate image:', error);
        resolve(false);
      }
    });
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(uri: string): Promise<{ width: number; height: number } | null> {
    try {
      // Use ImageManipulator to get image info
      const result = await ImageManipulator.manipulateAsync(uri, [], {
        format: ImageManipulator.SaveFormat.JPEG,
      });
      
      return {
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Failed to get image dimensions:', error);
      return null;
    }
  }

  /**
   * Create thumbnail from image
   */
  async createThumbnail(
    uri: string,
    size: number = 100
  ): Promise<{ uri: string; base64?: string } | null> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: size,
              height: size,
            },
          },
        ],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      return {
        uri: result.uri,
        base64: result.base64,
      };
    } catch (error) {
      console.error('Failed to create thumbnail:', error);
      return null;
    }
  }
}

export default new PhotoUploadService();

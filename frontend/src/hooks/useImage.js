import { useState, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import ImagePicker from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs';
import usePermissions from './usePermissions';
import useError from './useError';
import useAnalytics from './useAnalytics';

const useImage = (options = {}) => {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.8,
    format = 'JPEG',
    rotation = 0,
    outputPath = RNFS.CachesDirectoryPath,
  } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const { checkAndRequestPermission } = usePermissions();
  const { handleError } = useError();
  const { trackEvent } = useAnalytics();

  // Request camera permission on Android
  const requestCameraPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera to take photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        handleError(error);
        return false;
      }
    }
    return true;
  }, [handleError]);

  // Pick image from gallery
  const pickImage = useCallback(async (customOptions = {}) => {
    try {
      const hasPermission = await checkAndRequestPermission('PHOTO_LIBRARY');
      if (!hasPermission) {
        throw new Error('Permission denied');
      }

      const response = await ImagePicker.launchImageLibrary({
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: maxHeight,
        maxWidth: maxWidth,
        quality: quality,
        ...customOptions,
      });

      if (response.didCancel) {
        trackEvent('image_picker_cancelled', { source: 'gallery' });
        return null;
      }

      if (response.error) {
        throw new Error(response.error);
      }

      trackEvent('image_picked', { source: 'gallery' });
      return response.assets[0];
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [
    checkAndRequestPermission,
    maxHeight,
    maxWidth,
    quality,
    trackEvent,
    handleError,
  ]);

  // Take photo with camera
  const takePhoto = useCallback(async (customOptions = {}) => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        throw new Error('Camera permission denied');
      }

      const response = await ImagePicker.launchCamera({
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: maxHeight,
        maxWidth: maxWidth,
        quality: quality,
        ...customOptions,
      });

      if (response.didCancel) {
        trackEvent('image_picker_cancelled', { source: 'camera' });
        return null;
      }

      if (response.error) {
        throw new Error(response.error);
      }

      trackEvent('image_picked', { source: 'camera' });
      return response.assets[0];
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [
    requestCameraPermission,
    maxHeight,
    maxWidth,
    quality,
    trackEvent,
    handleError,
  ]);

  // Resize image
  const resizeImage = useCallback(async (imagePath, options = {}) => {
    setIsProcessing(true);
    try {
      const resizedImage = await ImageResizer.createResizedImage(
        imagePath,
        options.width || maxWidth,
        options.height || maxHeight,
        options.format || format,
        options.quality || quality,
        options.rotation || rotation,
        options.outputPath || outputPath
      );

      trackEvent('image_resized', {
        width: options.width || maxWidth,
        height: options.height || maxHeight,
      });

      return resizedImage;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [
    maxWidth,
    maxHeight,
    format,
    quality,
    rotation,
    outputPath,
    trackEvent,
    handleError,
  ]);

  // Get image dimensions
  const getImageDimensions = useCallback(async (imagePath) => {
    try {
      const { width, height } = await ImageResizer.createResizedImage(
        imagePath,
        maxWidth,
        maxHeight,
        format,
        100,
        0,
        outputPath,
        true // only get dimensions
      );
      return { width, height };
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [maxWidth, maxHeight, format, outputPath, handleError]);

  // Delete image file
  const deleteImage = useCallback(async (imagePath) => {
    try {
      await RNFS.unlink(imagePath);
      trackEvent('image_deleted');
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [trackEvent, handleError]);

  // Copy image file
  const copyImage = useCallback(async (sourcePath, destinationPath) => {
    try {
      await RNFS.copyFile(sourcePath, destinationPath);
      trackEvent('image_copied');
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [trackEvent, handleError]);

  // Move image file
  const moveImage = useCallback(async (sourcePath, destinationPath) => {
    try {
      await RNFS.moveFile(sourcePath, destinationPath);
      trackEvent('image_moved');
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [trackEvent, handleError]);

  return {
    // State
    isProcessing,

    // Image picker functions
    pickImage,
    takePhoto,

    // Image processing functions
    resizeImage,
    getImageDimensions,

    // File operations
    deleteImage,
    copyImage,
    moveImage,
  };
};

// Example usage with avatar upload
export const useAvatarImage = (options = {}) => {
  const {
    maxSize = 512,
    quality = 0.8,
    onUpload,
  } = options;

  const image = useImage({
    maxWidth: maxSize,
    maxHeight: maxSize,
    quality,
  });

  const uploadAvatar = useCallback(async () => {
    try {
      const imageResponse = await image.pickImage({
        mediaType: 'photo',
        includeBase64: true,
      });

      if (!imageResponse) return null;

      const resizedImage = await image.resizeImage(
        imageResponse.uri,
        {
          width: maxSize,
          height: maxSize,
        }
      );

      if (resizedImage && onUpload) {
        await onUpload(resizedImage);
      }

      return resizedImage;
    } catch (error) {
      console.error('Avatar upload error:', error);
      return null;
    }
  }, [image, maxSize, onUpload]);

  return {
    ...image,
    uploadAvatar,
  };
};

export default useImage;

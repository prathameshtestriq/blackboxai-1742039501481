import { useState, useCallback, useEffect } from 'react';
import { Platform, Linking, Alert } from 'react-native';
import {
  check,
  request,
  RESULTS,
  PERMISSIONS,
  openSettings,
} from 'react-native-permissions';

const PERMISSION_TYPES = {
  CAMERA: Platform.select({
    ios: PERMISSIONS.IOS.CAMERA,
    android: PERMISSIONS.ANDROID.CAMERA,
  }),
  PHOTO_LIBRARY: Platform.select({
    ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
    android: PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
  }),
  LOCATION: Platform.select({
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  }),
  NOTIFICATIONS: Platform.select({
    ios: PERMISSIONS.IOS.NOTIFICATIONS,
    android: PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
  }),
  BIOMETRIC: Platform.select({
    ios: PERMISSIONS.IOS.FACE_ID,
    android: PERMISSIONS.ANDROID.USE_BIOMETRIC,
  }),
};

const usePermissions = () => {
  const [permissionStatus, setPermissionStatus] = useState({});

  // Check permission status
  const checkPermission = useCallback(async (type) => {
    try {
      const permission = PERMISSION_TYPES[type];
      if (!permission) {
        throw new Error(`Unknown permission type: ${type}`);
      }

      const result = await check(permission);
      setPermissionStatus((prev) => ({
        ...prev,
        [type]: result,
      }));
      return result;
    } catch (error) {
      console.error(`Error checking ${type} permission:`, error);
      return RESULTS.DENIED;
    }
  }, []);

  // Request permission
  const requestPermission = useCallback(async (type) => {
    try {
      const permission = PERMISSION_TYPES[type];
      if (!permission) {
        throw new Error(`Unknown permission type: ${type}`);
      }

      const result = await request(permission);
      setPermissionStatus((prev) => ({
        ...prev,
        [type]: result,
      }));
      return result;
    } catch (error) {
      console.error(`Error requesting ${type} permission:`, error);
      return RESULTS.DENIED;
    }
  }, []);

  // Check and request permission if needed
  const checkAndRequestPermission = useCallback(async (type) => {
    const status = await checkPermission(type);

    if (status === RESULTS.DENIED) {
      return await requestPermission(type);
    }

    return status;
  }, [checkPermission, requestPermission]);

  // Handle permission blocked
  const handleBlockedPermission = useCallback((type, message) => {
    Alert.alert(
      'Permission Required',
      message || `${type} permission is required for this feature. Please enable it in settings.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => openSettings(),
        },
      ],
    );
  }, []);

  // Check multiple permissions
  const checkMultiplePermissions = useCallback(async (types) => {
    const results = {};
    for (const type of types) {
      results[type] = await checkPermission(type);
    }
    return results;
  }, [checkPermission]);

  // Request multiple permissions
  const requestMultiplePermissions = useCallback(async (types) => {
    const results = {};
    for (const type of types) {
      results[type] = await requestPermission(type);
    }
    return results;
  }, [requestPermission]);

  // Check if permission is granted
  const isPermissionGranted = useCallback((type) => {
    return permissionStatus[type] === RESULTS.GRANTED;
  }, [permissionStatus]);

  // Check if any permission is blocked
  const isAnyPermissionBlocked = useCallback((types) => {
    return types.some(
      (type) => permissionStatus[type] === RESULTS.BLOCKED
    );
  }, [permissionStatus]);

  // Initialize permissions on mount
  useEffect(() => {
    const initializePermissions = async () => {
      const types = Object.keys(PERMISSION_TYPES);
      await checkMultiplePermissions(types);
    };

    initializePermissions();
  }, [checkMultiplePermissions]);

  return {
    // State
    permissionStatus,

    // Actions
    checkPermission,
    requestPermission,
    checkAndRequestPermission,
    handleBlockedPermission,
    checkMultiplePermissions,
    requestMultiplePermissions,

    // Helpers
    isPermissionGranted,
    isAnyPermissionBlocked,

    // Constants
    PERMISSION_TYPES,
    RESULTS,
  };
};

// Example usage for specific features
export const useCameraPermission = () => {
  const {
    checkAndRequestPermission,
    handleBlockedPermission,
    isPermissionGranted,
    PERMISSION_TYPES,
    RESULTS,
  } = usePermissions();

  const requestCameraAccess = useCallback(async () => {
    const result = await checkAndRequestPermission('CAMERA');
    
    if (result === RESULTS.BLOCKED) {
      handleBlockedPermission(
        'Camera',
        'Camera access is required to take profile pictures. Please enable it in settings.'
      );
      return false;
    }

    return result === RESULTS.GRANTED;
  }, [checkAndRequestPermission, handleBlockedPermission]);

  return {
    requestCameraAccess,
    isCameraEnabled: isPermissionGranted('CAMERA'),
  };
};

export const useNotificationPermission = () => {
  const {
    checkAndRequestPermission,
    handleBlockedPermission,
    isPermissionGranted,
    PERMISSION_TYPES,
    RESULTS,
  } = usePermissions();

  const requestNotificationAccess = useCallback(async () => {
    const result = await checkAndRequestPermission('NOTIFICATIONS');
    
    if (result === RESULTS.BLOCKED) {
      handleBlockedPermission(
        'Notifications',
        'Notifications are required to receive important updates. Please enable them in settings.'
      );
      return false;
    }

    return result === RESULTS.GRANTED;
  }, [checkAndRequestPermission, handleBlockedPermission]);

  return {
    requestNotificationAccess,
    isNotificationsEnabled: isPermissionGranted('NOTIFICATIONS'),
  };
};

export default usePermissions;

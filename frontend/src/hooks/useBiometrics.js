import { useState, useCallback, useEffect } from 'react';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { Platform } from 'react-native';
import useStorage from './useStorage';
import useAnalytics from './useAnalytics';
import useError from './useError';

const BIOMETRIC_STORAGE_KEY = 'biometric_enabled';
const BIOMETRIC_KEY_NAME = 'com.cricketstocks.biometricKey';

const useBiometrics = (options = {}) => {
  const {
    onSuccess,
    onError,
    promptMessage = 'Authenticate to continue',
    cancelButtonText = 'Cancel',
  } = options;

  const [isAvailable, setIsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const storage = useStorage(BIOMETRIC_STORAGE_KEY);
  const { trackEvent } = useAnalytics();
  const { handleError } = useError();

  const rnBiometrics = new ReactNativeBiometrics({
    allowDeviceCredentials: true,
  });

  // Check if biometrics is available
  const checkAvailability = useCallback(async () => {
    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      setIsAvailable(available);
      setBiometryType(biometryType);
      return { available, biometryType };
    } catch (error) {
      handleError(error);
      return { available: false, biometryType: null };
    }
  }, [rnBiometrics, handleError]);

  // Get biometric type name
  const getBiometricName = useCallback(() => {
    switch (biometryType) {
      case BiometryTypes.TouchID:
        return 'Touch ID';
      case BiometryTypes.FaceID:
        return 'Face ID';
      case BiometryTypes.Biometrics:
        return Platform.OS === 'android' ? 'Fingerprint' : 'Biometrics';
      default:
        return 'Biometrics';
    }
  }, [biometryType]);

  // Create biometric keys
  const createKeys = useCallback(async () => {
    try {
      const { publicKey } = await rnBiometrics.createKeys();
      return publicKey;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [rnBiometrics, handleError]);

  // Delete biometric keys
  const deleteKeys = useCallback(async () => {
    try {
      return await rnBiometrics.deleteKeys();
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [rnBiometrics, handleError]);

  // Check if biometric keys exist
  const checkKeys = useCallback(async () => {
    try {
      return await rnBiometrics.biometricKeysExist();
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [rnBiometrics, handleError]);

  // Enable biometric authentication
  const enable = useCallback(async () => {
    try {
      const { available } = await checkAvailability();
      if (!available) {
        throw new Error('Biometrics not available');
      }

      const authenticated = await authenticate({
        promptMessage: 'Authenticate to enable biometric login',
      });

      if (authenticated) {
        await createKeys();
        await storage.setValue(true);
        setIsEnabled(true);
        trackEvent('biometric_enabled', { type: biometryType });
        return true;
      }
      return false;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [
    checkAvailability,
    authenticate,
    createKeys,
    storage,
    trackEvent,
    biometryType,
    handleError,
  ]);

  // Disable biometric authentication
  const disable = useCallback(async () => {
    try {
      await deleteKeys();
      await storage.setValue(false);
      setIsEnabled(false);
      trackEvent('biometric_disabled');
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [deleteKeys, storage, trackEvent, handleError]);

  // Authenticate using biometrics
  const authenticate = useCallback(async (options = {}) => {
    const {
      payload = 'biometric_auth',
      promptMessage: customPromptMessage = promptMessage,
    } = options;

    if (!isAvailable || isAuthenticating) return false;

    setIsAuthenticating(true);
    try {
      const { success, signature } = await rnBiometrics.createSignature({
        promptMessage: customPromptMessage,
        payload,
        cancelButtonText,
      });

      if (success) {
        trackEvent('biometric_auth_success', { type: biometryType });
        onSuccess?.(signature);
      } else {
        trackEvent('biometric_auth_cancel', { type: biometryType });
      }

      return success;
    } catch (error) {
      trackEvent('biometric_auth_error', {
        type: biometryType,
        error: error.message,
      });
      handleError(error);
      onError?.(error);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [
    isAvailable,
    isAuthenticating,
    rnBiometrics,
    promptMessage,
    cancelButtonText,
    biometryType,
    trackEvent,
    handleError,
    onSuccess,
    onError,
  ]);

  // Simple authentication without signature
  const simpleAuthenticate = useCallback(async (customPromptMessage = promptMessage) => {
    if (!isAvailable || isAuthenticating) return false;

    setIsAuthenticating(true);
    try {
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: customPromptMessage,
        cancelButtonText,
      });

      if (success) {
        trackEvent('biometric_simple_auth_success', { type: biometryType });
        onSuccess?.();
      } else {
        trackEvent('biometric_simple_auth_cancel', { type: biometryType });
      }

      return success;
    } catch (error) {
      trackEvent('biometric_simple_auth_error', {
        type: biometryType,
        error: error.message,
      });
      handleError(error);
      onError?.(error);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [
    isAvailable,
    isAuthenticating,
    rnBiometrics,
    promptMessage,
    cancelButtonText,
    biometryType,
    trackEvent,
    handleError,
    onSuccess,
    onError,
  ]);

  // Initialize biometrics
  useEffect(() => {
    const initialize = async () => {
      const { available } = await checkAvailability();
      if (available) {
        const enabled = await storage.value;
        setIsEnabled(enabled);
      }
    };

    initialize();
  }, [checkAvailability, storage]);

  return {
    // State
    isAvailable,
    isEnabled,
    isAuthenticating,
    biometryType,

    // Actions
    checkAvailability,
    enable,
    disable,
    authenticate,
    simpleAuthenticate,
    createKeys,
    deleteKeys,
    checkKeys,

    // Helpers
    getBiometricName,
  };
};

export default useBiometrics;

import { useCallback } from 'react';
import { Platform } from 'react-native';
import CryptoJS from 'crypto-js';
import jwt_decode from 'jwt-decode';
import useStorage from './useStorage';
import useBiometrics from './useBiometrics';
import useAnalytics from './useAnalytics';
import useError from './useError';

const useSecurity = (options = {}) => {
  const {
    encryptionKey = process.env.ENCRYPTION_KEY || 'default-key',
    tokenStorageKey = '@Auth:token',
    secureStorageKey = '@Secure:data',
  } = options;

  const storage = useStorage();
  const biometrics = useBiometrics();
  const { trackEvent } = useAnalytics();
  const { handleError } = useError();

  // Encrypt data
  const encrypt = useCallback((data) => {
    try {
      const stringData = typeof data === 'string' ? data : JSON.stringify(data);
      return CryptoJS.AES.encrypt(stringData, encryptionKey).toString();
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [encryptionKey, handleError]);

  // Decrypt data
  const decrypt = useCallback((encryptedData) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      
      try {
        return JSON.parse(decryptedString);
      } catch {
        return decryptedString;
      }
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [encryptionKey, handleError]);

  // Hash data
  const hash = useCallback((data) => {
    try {
      return CryptoJS.SHA256(data).toString();
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [handleError]);

  // Store secure data
  const storeSecureData = useCallback(async (key, data) => {
    try {
      const encryptedData = encrypt(data);
      if (!encryptedData) return false;

      await storage.setItem(`${secureStorageKey}:${key}`, encryptedData);
      
      trackEvent('security_store_data', {
        key,
        success: true,
      });

      return true;
    } catch (error) {
      handleError(error);
      trackEvent('security_store_data', {
        key,
        success: false,
        error: error.message,
      });
      return false;
    }
  }, [encrypt, storage, secureStorageKey, trackEvent, handleError]);

  // Get secure data
  const getSecureData = useCallback(async (key) => {
    try {
      const encryptedData = await storage.getItem(`${secureStorageKey}:${key}`);
      if (!encryptedData) return null;

      return decrypt(encryptedData);
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [decrypt, storage, secureStorageKey, handleError]);

  // Remove secure data
  const removeSecureData = useCallback(async (key) => {
    try {
      await storage.removeItem(`${secureStorageKey}:${key}`);
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [storage, secureStorageKey, handleError]);

  // Store auth token
  const storeToken = useCallback(async (token) => {
    try {
      await storage.setItem(tokenStorageKey, token);
      
      trackEvent('security_store_token', {
        success: true,
      });

      return true;
    } catch (error) {
      handleError(error);
      trackEvent('security_store_token', {
        success: false,
        error: error.message,
      });
      return false;
    }
  }, [storage, tokenStorageKey, trackEvent, handleError]);

  // Get auth token
  const getToken = useCallback(async () => {
    try {
      return await storage.getItem(tokenStorageKey);
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [storage, tokenStorageKey, handleError]);

  // Remove auth token
  const removeToken = useCallback(async () => {
    try {
      await storage.removeItem(tokenStorageKey);
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [storage, tokenStorageKey, handleError]);

  // Decode JWT token
  const decodeToken = useCallback((token) => {
    try {
      return jwt_decode(token);
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [handleError]);

  // Check if token is expired
  const isTokenExpired = useCallback((token) => {
    try {
      const decoded = decodeToken(token);
      if (!decoded || !decoded.exp) return true;
      
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      handleError(error);
      return true;
    }
  }, [decodeToken, handleError]);

  // Generate random string
  const generateRandomString = useCallback((length = 32) => {
    try {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      
      const randomValues = new Uint32Array(length);
      crypto.getRandomValues(randomValues);
      
      for (let i = 0; i < length; i++) {
        result += chars[randomValues[i] % chars.length];
      }
      
      return result;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [handleError]);

  // Secure authentication with biometrics
  const authenticateWithBiometrics = useCallback(async () => {
    try {
      const result = await biometrics.authenticate({
        promptMessage: 'Authenticate to continue',
      });

      trackEvent('security_biometric_auth', {
        success: result,
      });

      return result;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [biometrics, trackEvent, handleError]);

  return {
    // Encryption
    encrypt,
    decrypt,
    hash,

    // Secure storage
    storeSecureData,
    getSecureData,
    removeSecureData,

    // Token management
    storeToken,
    getToken,
    removeToken,
    decodeToken,
    isTokenExpired,

    // Utilities
    generateRandomString,
    authenticateWithBiometrics,
  };
};

// Example usage with secure storage
export const useSecureStorage = () => {
  const security = useSecurity();

  const storeSecurely = useCallback(async (key, data) => {
    return security.storeSecureData(key, data);
  }, [security]);

  const retrieveSecurely = useCallback(async (key) => {
    return security.getSecureData(key);
  }, [security]);

  return {
    storeSecurely,
    retrieveSecurely,
  };
};

// Example usage with authentication
export const useAuthSecurity = () => {
  const security = useSecurity();

  const authenticateUser = useCallback(async (token) => {
    if (!token || security.isTokenExpired(token)) {
      return false;
    }

    const isAuthenticated = await security.authenticateWithBiometrics();
    if (!isAuthenticated) {
      return false;
    }

    await security.storeToken(token);
    return true;
  }, [security]);

  return {
    ...security,
    authenticateUser,
  };
};

export default useSecurity;

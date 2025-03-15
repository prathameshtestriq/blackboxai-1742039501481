import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import useStorage from './useStorage';
import useNetwork from './useNetwork';
import useAnalytics from './useAnalytics';
import useError from './useError';

// Default configuration
const DEFAULT_CONFIG = {
  // API Configuration
  api: {
    baseUrl: 'https://api.cricketstocks.com',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    cacheTime: 300000, // 5 minutes
  },

  // Feature Flags
  features: {
    liveScoring: true,
    trading: true,
    socialFeatures: true,
    notifications: true,
    analytics: true,
    feedback: true,
  },

  // App Limits
  limits: {
    maxWatchlistItems: 50,
    maxSearchResults: 100,
    maxTransactionHistory: 1000,
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    rateLimit: {
      requests: 100,
      window: 60000, // 1 minute
    },
  },

  // Performance Settings
  performance: {
    enablePrefetching: true,
    enableLazyLoading: true,
    imageCacheSize: 100,
    listViewThreshold: 50,
  },

  // Environment-specific Settings
  environment: {
    isDevelopment: __DEV__,
    isStaging: false,
    isProduction: !__DEV__,
    version: '1.0.0',
    buildNumber: '1',
  },
};

const useConfig = (options = {}) => {
  const {
    storageKey = '@Config',
    remoteConfigUrl = `${DEFAULT_CONFIG.api.baseUrl}/config`,
    refreshInterval = 300000, // 5 minutes
    persistConfig = true,
  } = options;

  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const storage = useStorage(storageKey);
  const network = useNetwork();
  const { trackEvent } = useAnalytics();
  const { handleError } = useError();

  // Load local configuration
  const loadLocalConfig = useCallback(async () => {
    if (!persistConfig) return null;

    try {
      const storedConfig = await storage.getItem('config');
      if (storedConfig) {
        return storedConfig;
      }
    } catch (error) {
      handleError(error);
    }
    return null;
  }, [persistConfig, storage, handleError]);

  // Fetch remote configuration
  const fetchRemoteConfig = useCallback(async () => {
    if (!network.isConnected) return null;

    try {
      const response = await fetch(remoteConfigUrl);
      if (!response.ok) throw new Error('Failed to fetch remote config');
      
      const remoteConfig = await response.json();
      trackEvent('config_fetched', {
        source: 'remote',
      });
      
      return remoteConfig;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [network.isConnected, remoteConfigUrl, trackEvent, handleError]);

  // Save configuration
  const saveConfig = useCallback(async (newConfig) => {
    if (!persistConfig) return;

    try {
      await storage.setItem('config', newConfig);
      trackEvent('config_saved');
    } catch (error) {
      handleError(error);
    }
  }, [persistConfig, storage, trackEvent, handleError]);

  // Update configuration
  const updateConfig = useCallback(async (updates, options = {}) => {
    const {
      merge = true,
      persist = true,
    } = options;

    try {
      const newConfig = merge
        ? { ...config, ...updates }
        : updates;

      setConfig(newConfig);
      setLastUpdated(Date.now());

      if (persist && persistConfig) {
        await saveConfig(newConfig);
      }

      trackEvent('config_updated', {
        merge,
        persist,
      });

      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [config, persistConfig, saveConfig, trackEvent, handleError]);

  // Refresh configuration
  const refreshConfig = useCallback(async (force = false) => {
    if (!force && lastUpdated && Date.now() - lastUpdated < refreshInterval) {
      return false;
    }

    setIsLoading(true);
    try {
      // Load local config first
      const localConfig = await loadLocalConfig();
      if (localConfig) {
        await updateConfig(localConfig, { persist: false });
      }

      // Fetch and merge remote config
      const remoteConfig = await fetchRemoteConfig();
      if (remoteConfig) {
        await updateConfig(remoteConfig);
      }

      return true;
    } catch (error) {
      handleError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [
    lastUpdated,
    refreshInterval,
    loadLocalConfig,
    fetchRemoteConfig,
    updateConfig,
    handleError,
  ]);

  // Reset configuration
  const resetConfig = useCallback(async () => {
    try {
      await updateConfig(DEFAULT_CONFIG, { merge: false });
      if (persistConfig) {
        await storage.removeItem('config');
      }

      trackEvent('config_reset');
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [updateConfig, persistConfig, storage, trackEvent, handleError]);

  // Get platform-specific configuration
  const getPlatformConfig = useCallback(() => {
    const platformConfig = config[Platform.OS];
    return platformConfig ? { ...config, ...platformConfig } : config;
  }, [config]);

  // Check if feature is enabled
  const isFeatureEnabled = useCallback((featureKey) => {
    return config.features?.[featureKey] ?? false;
  }, [config]);

  // Get configuration value
  const getValue = useCallback((path, defaultValue = null) => {
    try {
      return path.split('.').reduce((obj, key) => obj?.[key], config) ?? defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }, [config]);

  // Initialize configuration
  useEffect(() => {
    refreshConfig();

    // Set up periodic refresh
    const interval = setInterval(() => {
      refreshConfig();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshConfig, refreshInterval]);

  return {
    // State
    config,
    isLoading,
    lastUpdated,

    // Actions
    updateConfig,
    refreshConfig,
    resetConfig,

    // Helpers
    getPlatformConfig,
    isFeatureEnabled,
    getValue,
  };
};

// Example usage with feature flags
export const useFeatureFlags = () => {
  const config = useConfig();

  const checkFeature = useCallback((featureKey) => {
    return config.isFeatureEnabled(featureKey);
  }, [config]);

  return {
    ...config,
    checkFeature,
  };
};

// Example usage with environment config
export const useEnvironmentConfig = () => {
  const config = useConfig();

  const getEnvironment = useCallback(() => {
    return config.getValue('environment', {});
  }, [config]);

  const isDevelopment = useCallback(() => {
    return getEnvironment().isDevelopment;
  }, [getEnvironment]);

  const isProduction = useCallback(() => {
    return getEnvironment().isProduction;
  }, [getEnvironment]);

  return {
    ...config,
    getEnvironment,
    isDevelopment,
    isProduction,
  };
};

export default useConfig;

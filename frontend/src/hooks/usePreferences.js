import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import useStorage from './useStorage';
import useAnalytics from './useAnalytics';
import useI18n from './useI18n';
import useTheme from './useTheme';

const DEFAULT_PREFERENCES = {
  // App Settings
  theme: 'system', // 'light', 'dark', 'system'
  language: 'en', // 'en', 'hi', 'bn', 'ta'
  notifications: {
    enabled: true,
    matchAlerts: true,
    priceAlerts: true,
    newsAlerts: true,
    marketingAlerts: false,
  },
  
  // Display Settings
  fontSize: 'medium', // 'small', 'medium', 'large'
  animations: true,
  reduceMotion: false,
  hapticFeedback: true,
  
  // Privacy Settings
  analytics: true,
  crashReports: true,
  locationServices: false,
  
  // Match Settings
  liveScoreRefreshRate: 10, // seconds
  matchNotificationLeadTime: 15, // minutes
  defaultMatchView: 'summary', // 'summary', 'scorecard', 'commentary'
  
  // Trading Settings
  defaultCurrency: 'INR',
  priceFormat: 'compact', // 'compact', 'full'
  priceAlertThreshold: 5, // percentage
  tradingConfirmation: true,
  
  // Data Usage
  autoPlayVideos: 'wifi-only', // 'always', 'never', 'wifi-only'
  imageQuality: 'auto', // 'low', 'medium', 'high', 'auto'
  offlineMode: false,
  
  // Security
  biometricAuth: false,
  autoLock: 5, // minutes, 0 = disabled
  hideBalance: false,
};

const usePreferences = (options = {}) => {
  const {
    storageKey = '@Preferences',
    syncInterval = 60000, // 1 minute
  } = options;

  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const storage = useStorage();
  const { trackEvent } = useAnalytics();
  const { setLanguage } = useI18n();
  const { setThemeMode } = useTheme();

  // Load preferences
  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      const stored = await storage.getItem(storageKey);
      if (stored) {
        setPreferences(prev => ({
          ...prev,
          ...stored,
        }));
      }
      return true;
    } catch (error) {
      console.error('Load preferences error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [storage, storageKey]);

  // Save preferences
  const savePreferences = useCallback(async (newPreferences) => {
    try {
      await storage.setItem(storageKey, newPreferences);
      setPreferences(newPreferences);

      trackEvent('preferences_updated', {
        changes: Object.keys(newPreferences),
      });

      return true;
    } catch (error) {
      console.error('Save preferences error:', error);
      return false;
    }
  }, [storage, storageKey, trackEvent]);

  // Update specific preference
  const updatePreference = useCallback(async (key, value) => {
    try {
      const newPreferences = {
        ...preferences,
        [key]: value,
      };

      const success = await savePreferences(newPreferences);
      if (success) {
        // Handle specific preference changes
        switch (key) {
          case 'language':
            await setLanguage(value);
            break;
          case 'theme':
            await setThemeMode(value);
            break;
        }
      }

      return success;
    } catch (error) {
      console.error('Update preference error:', error);
      return false;
    }
  }, [preferences, savePreferences, setLanguage, setThemeMode]);

  // Reset preferences to defaults
  const resetPreferences = useCallback(async () => {
    try {
      await savePreferences(DEFAULT_PREFERENCES);
      
      trackEvent('preferences_reset');
      
      return true;
    } catch (error) {
      console.error('Reset preferences error:', error);
      return false;
    }
  }, [savePreferences, trackEvent]);

  // Export preferences
  const exportPreferences = useCallback(() => {
    try {
      return JSON.stringify(preferences, null, 2);
    } catch (error) {
      console.error('Export preferences error:', error);
      return null;
    }
  }, [preferences]);

  // Import preferences
  const importPreferences = useCallback(async (data) => {
    try {
      const imported = JSON.parse(data);
      await savePreferences(imported);
      
      trackEvent('preferences_imported');
      
      return true;
    } catch (error) {
      console.error('Import preferences error:', error);
      return false;
    }
  }, [savePreferences, trackEvent]);

  // Get platform-specific preferences
  const getPlatformPreferences = useCallback(() => {
    return {
      ...preferences,
      ...Platform.select({
        ios: preferences.ios || {},
        android: preferences.android || {},
      }),
    };
  }, [preferences]);

  // Initialize preferences
  useEffect(() => {
    loadPreferences();

    // Set up periodic sync if needed
    const syncInterval = setInterval(loadPreferences, syncInterval);
    return () => clearInterval(syncInterval);
  }, [loadPreferences, syncInterval]);

  return {
    // State
    preferences,
    isLoading,

    // Actions
    updatePreference,
    resetPreferences,
    exportPreferences,
    importPreferences,

    // Helpers
    getPlatformPreferences,
  };
};

// Example usage with theme preferences
export const useThemePreferences = () => {
  const { preferences, updatePreference } = usePreferences();
  const theme = useTheme();

  const updateThemePreference = useCallback(async (themeMode) => {
    const success = await updatePreference('theme', themeMode);
    if (success) {
      theme.setThemeMode(themeMode);
    }
    return success;
  }, [updatePreference, theme]);

  return {
    theme: preferences.theme,
    updateTheme: updateThemePreference,
  };
};

// Example usage with notification preferences
export const useNotificationPreferences = () => {
  const { preferences, updatePreference } = usePreferences();

  const updateNotificationPreference = useCallback(async (key, value) => {
    return updatePreference('notifications', {
      ...preferences.notifications,
      [key]: value,
    });
  }, [preferences, updatePreference]);

  return {
    notifications: preferences.notifications,
    updateNotification: updateNotificationPreference,
  };
};

export default usePreferences;

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from 'react-native-paper';
import {
  updateSettings,
  toggleTheme,
  setLanguage,
  toggleNotifications,
  updateNotificationPreferences,
} from '../store/slices/settingsSlice';

const STORAGE_KEYS = {
  SETTINGS: 'app_settings',
  THEME: 'app_theme',
  LANGUAGE: 'app_language',
  NOTIFICATIONS: 'app_notifications',
};

const useSettings = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const settings = useSelector((state) => state.settings);

  // Load settings from storage
  const loadSettings = useCallback(async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (storedSettings) {
        dispatch(updateSettings(JSON.parse(storedSettings)));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, [dispatch]);

  // Save settings to storage
  const saveSettings = useCallback(async (newSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      dispatch(updateSettings(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [dispatch]);

  // Toggle theme (light/dark)
  const handleToggleTheme = useCallback(async () => {
    try {
      const newTheme = settings.theme === 'light' ? 'dark' : 'light';
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, newTheme);
      dispatch(toggleTheme());
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  }, [dispatch, settings.theme]);

  // Change language
  const handleSetLanguage = useCallback(async (language) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
      dispatch(setLanguage(language));
    } catch (error) {
      console.error('Error setting language:', error);
    }
  }, [dispatch]);

  // Toggle notifications
  const handleToggleNotifications = useCallback(async () => {
    try {
      const newValue = !settings.notifications.enabled;
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(newValue));
      dispatch(toggleNotifications());
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  }, [dispatch, settings.notifications.enabled]);

  // Update notification preferences
  const handleUpdateNotificationPreferences = useCallback(async (preferences) => {
    try {
      const updatedPreferences = {
        ...settings.notifications.preferences,
        ...preferences,
      };
      await AsyncStorage.setItem(
        STORAGE_KEYS.NOTIFICATIONS,
        JSON.stringify({
          enabled: settings.notifications.enabled,
          preferences: updatedPreferences,
        })
      );
      dispatch(updateNotificationPreferences(preferences));
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  }, [dispatch, settings.notifications]);

  // Get current theme
  const getCurrentTheme = useCallback(() => {
    return {
      isDark: settings.theme === 'dark',
      theme: theme,
      themeName: settings.theme,
    };
  }, [settings.theme, theme]);

  // Reset settings to defaults
  const resetSettings = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SETTINGS,
        STORAGE_KEYS.THEME,
        STORAGE_KEYS.LANGUAGE,
        STORAGE_KEYS.NOTIFICATIONS,
      ]);
      dispatch(updateSettings({
        theme: 'light',
        language: 'en',
        notifications: {
          enabled: true,
          preferences: {
            matches: true,
            transactions: true,
            priceAlerts: true,
            news: true,
          },
        },
        currency: 'INR',
        chartPeriod: '1D',
        autoRefresh: true,
        refreshInterval: 30000,
      }));
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  }, [dispatch]);

  return {
    // State
    settings,
    theme: getCurrentTheme(),

    // Actions
    loadSettings,
    saveSettings,
    toggleTheme: handleToggleTheme,
    setLanguage: handleSetLanguage,
    toggleNotifications: handleToggleNotifications,
    updateNotificationPreferences: handleUpdateNotificationPreferences,
    resetSettings,

    // Getters
    getCurrentTheme,
    getLanguage: () => settings.language,
    getNotificationSettings: () => settings.notifications,
    getCurrency: () => settings.currency,
    getChartPeriod: () => settings.chartPeriod,
    getAutoRefresh: () => settings.autoRefresh,
    getRefreshInterval: () => settings.refreshInterval,
  };
};

// Custom hook for theme-specific styles
export const useThemedStyles = (styleCreator) => {
  const theme = useTheme();
  return styleCreator(theme);
};

export default useSettings;

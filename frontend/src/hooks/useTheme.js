import { useCallback } from 'react';
import { useColorScheme, Appearance, Platform, Dimensions } from 'react-native';
import { useTheme as usePaperTheme } from 'react-native-paper';
import useSettings from './useSettings';
import useStorage from './useStorage';
import useAnalytics from './useAnalytics';

const useTheme = (options = {}) => {
  const {
    storageKey = '@Theme',
    defaultTheme = 'light',
  } = options;

  const systemColorScheme = useColorScheme();
  const paperTheme = usePaperTheme();
  const { settings, saveSettings } = useSettings();
  const storage = useStorage(storageKey);
  const { trackEvent } = useAnalytics();

  // Base colors
  const colors = {
    primary: {
      light: '#007AFF',
      dark: '#0A84FF',
    },
    secondary: {
      light: '#5856D6',
      dark: '#5E5CE6',
    },
    success: {
      light: '#34C759',
      dark: '#30D158',
    },
    warning: {
      light: '#FF9500',
      dark: '#FFD60A',
    },
    error: {
      light: '#FF3B30',
      dark: '#FF453A',
    },
    background: {
      light: '#FFFFFF',
      dark: '#000000',
    },
    surface: {
      light: '#F2F2F7',
      dark: '#1C1C1E',
    },
    text: {
      light: '#000000',
      dark: '#FFFFFF',
    },
    border: {
      light: '#C6C6C8',
      dark: '#38383A',
    },
  };

  // Theme variants
  const themes = {
    light: {
      dark: false,
      colors: {
        primary: colors.primary.light,
        secondary: colors.secondary.light,
        success: colors.success.light,
        warning: colors.warning.light,
        error: colors.error.light,
        background: colors.background.light,
        surface: colors.surface.light,
        text: colors.text.light,
        border: colors.border.light,
        disabled: colors.border.light,
        placeholder: colors.border.light,
      },
      roundness: 8,
      animation: {
        scale: 1.0,
      },
    },
    dark: {
      dark: true,
      colors: {
        primary: colors.primary.dark,
        secondary: colors.secondary.dark,
        success: colors.success.dark,
        warning: colors.warning.dark,
        error: colors.error.dark,
        background: colors.background.dark,
        surface: colors.surface.dark,
        text: colors.text.dark,
        border: colors.border.dark,
        disabled: colors.border.dark,
        placeholder: colors.border.dark,
      },
      roundness: 8,
      animation: {
        scale: 1.0,
      },
    },
  };

  // Get current theme mode
  const getThemeMode = useCallback(() => {
    if (settings.themeMode === 'system') {
      return systemColorScheme || defaultTheme;
    }
    return settings.themeMode || defaultTheme;
  }, [settings.themeMode, systemColorScheme, defaultTheme]);

  // Get theme
  const getTheme = useCallback(() => {
    const mode = getThemeMode();
    return themes[mode] || themes[defaultTheme];
  }, [getThemeMode, defaultTheme]);

  // Set theme mode
  const setThemeMode = useCallback(async (mode) => {
    try {
      await saveSettings({ ...settings, themeMode: mode });
      await storage.setValue(mode);

      trackEvent('theme_changed', {
        mode,
        previous: settings.themeMode,
      });

      return true;
    } catch (error) {
      console.error('Set theme mode error:', error);
      return false;
    }
  }, [settings, saveSettings, storage, trackEvent]);

  // Get color for current theme
  const getColor = useCallback((colorName) => {
    const theme = getTheme();
    return theme.colors[colorName] || colors[colorName]?.[theme.dark ? 'dark' : 'light'];
  }, [getTheme]);

  // Get style for current theme
  const getStyle = useCallback((lightStyle, darkStyle) => {
    const theme = getTheme();
    return theme.dark ? darkStyle : lightStyle;
  }, [getTheme]);

  // Get responsive styles
  const getResponsiveStyle = useCallback((style) => {
    const { width, height } = Dimensions.get('window');
    const isLandscape = width > height;

    return {
      ...style,
      paddingHorizontal: isLandscape ? 32 : 16,
      marginHorizontal: isLandscape ? 32 : 16,
    };
  }, []);

  // Get platform-specific styles
  const getPlatformStyle = useCallback((style) => {
    const { OS } = Platform;
    return {
      ...style,
      ...Platform.select({
        ios: style.ios || {},
        android: style.android || {},
      }),
    };
  }, []);

  // Common styles
  const styles = {
    // Layout styles
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Typography styles
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: getColor('text'),
    },
    subtitle: {
      fontSize: 18,
      color: getColor('text'),
    },
    body: {
      fontSize: 16,
      color: getColor('text'),
    },
    caption: {
      fontSize: 14,
      color: getColor('text'),
    },

    // Card styles
    card: {
      backgroundColor: getColor('surface'),
      borderRadius: themes[getThemeMode()].roundness,
      padding: 16,
      marginVertical: 8,
      ...Platform.select({
        ios: {
          shadowColor: getColor('text'),
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },

    // Button styles
    button: {
      backgroundColor: getColor('primary'),
      borderRadius: themes[getThemeMode()].roundness,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },

    // Input styles
    input: {
      backgroundColor: getColor('surface'),
      borderColor: getColor('border'),
      borderWidth: 1,
      borderRadius: themes[getThemeMode()].roundness,
      padding: 12,
      color: getColor('text'),
    },
  };

  return {
    // Theme state
    currentTheme: getTheme(),
    themeMode: getThemeMode(),
    isDark: getTheme().dark,

    // Theme actions
    setThemeMode,

    // Style helpers
    getColor,
    getStyle,
    getResponsiveStyle,
    getPlatformStyle,

    // Common styles
    styles,

    // Theme definitions
    themes,
    colors,
  };
};

// Example usage with component styles
export const useComponentStyles = () => {
  const theme = useTheme();

  const getComponentStyle = useCallback((component, variant = 'default') => {
    const baseStyle = theme.styles[component] || {};
    const variantStyle = theme.styles[`${component}_${variant}`] || {};

    return {
      ...baseStyle,
      ...variantStyle,
      ...theme.getResponsiveStyle(baseStyle),
      ...theme.getPlatformStyle(baseStyle),
    };
  }, [theme]);

  return {
    ...theme,
    getComponentStyle,
  };
};

export default useTheme;

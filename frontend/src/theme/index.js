import { DefaultTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  web: {
    regular: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '100',
    },
  },
  ios: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
  },
  android: {
    regular: {
      fontFamily: 'sans-serif',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'sans-serif-medium',
      fontWeight: 'normal',
    },
    light: {
      fontFamily: 'sans-serif-light',
      fontWeight: 'normal',
    },
    thin: {
      fontFamily: 'sans-serif-thin',
      fontWeight: 'normal',
    },
  },
};

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1E88E5', // Blue
    accent: '#FFC107', // Amber
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#212121',
    error: '#D32F2F',
    success: '#43A047',
    warning: '#FFA000',
    info: '#1976D2',
    disabled: '#9E9E9E',
    placeholder: '#BDBDBD',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#E91E63',
    // Custom colors
    card: '#FFFFFF',
    border: '#E0E0E0',
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    // Status colors
    live: '#F44336',
    upcoming: '#4CAF50',
    completed: '#9E9E9E',
    // Trading colors
    profit: '#43A047',
    loss: '#D32F2F',
    neutral: '#757575',
  },
  fonts: configureFonts(fontConfig),
  roundness: 8,
  animation: {
    scale: 1.0,
  },
  // Custom theme properties
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.37,
      shadowRadius: 7.49,
      elevation: 6,
    },
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
      letterSpacing: -1,
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
      letterSpacing: -0.5,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      letterSpacing: 0,
    },
    subtitle1: {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.15,
    },
    subtitle2: {
      fontSize: 14,
      fontWeight: '500',
      letterSpacing: 0.1,
    },
    body1: {
      fontSize: 16,
      letterSpacing: 0.5,
    },
    body2: {
      fontSize: 14,
      letterSpacing: 0.25,
    },
    button: {
      fontSize: 14,
      fontWeight: '500',
      letterSpacing: 1.25,
      textTransform: 'uppercase',
    },
    caption: {
      fontSize: 12,
      letterSpacing: 0.4,
    },
    overline: {
      fontSize: 10,
      fontWeight: '500',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
  },
};

export default theme;

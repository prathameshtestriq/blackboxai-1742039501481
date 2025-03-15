import { useCallback } from 'react';
import { useNavigation as useReactNavigation, CommonActions } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import useAnalytics from './useAnalytics';

const useNavigation = () => {
  const navigation = useReactNavigation();
  const { trackScreen } = useAnalytics();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  // Navigate to a screen with tracking
  const navigateTo = useCallback((routeName, params) => {
    trackScreen(routeName);
    navigation.navigate(routeName, params);
  }, [navigation, trackScreen]);

  // Navigate and replace current screen
  const replaceTo = useCallback((routeName, params) => {
    trackScreen(routeName);
    navigation.replace(routeName, params);
  }, [navigation, trackScreen]);

  // Reset navigation stack
  const resetTo = useCallback((routeName, params) => {
    trackScreen(routeName);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: routeName, params }],
      })
    );
  }, [navigation, trackScreen]);

  // Go back
  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  // Pop to top of stack
  const popToTop = useCallback(() => {
    navigation.popToTop();
  }, [navigation]);

  // Navigate to auth screen
  const navigateToAuth = useCallback((screen = 'Login', params = {}) => {
    if (!isAuthenticated) {
      replaceTo(screen, params);
    }
  }, [isAuthenticated, replaceTo]);

  // Navigate to main app
  const navigateToApp = useCallback((screen = 'Home', params = {}) => {
    if (isAuthenticated) {
      resetTo('MainApp', { screen, params });
    }
  }, [isAuthenticated, resetTo]);

  // Navigation helpers for specific features
  const navigateToMatch = useCallback((matchId) => {
    navigateTo('Matches', {
      screen: 'MatchDetails',
      params: { matchId },
    });
  }, [navigateTo]);

  const navigateToPlayer = useCallback((playerId) => {
    navigateTo('Players', {
      screen: 'PlayerDetails',
      params: { playerId },
    });
  }, [navigateTo]);

  const navigateToWallet = useCallback((action) => {
    navigateTo('Wallet', { action });
  }, [navigateTo]);

  const navigateToProfile = useCallback(() => {
    navigateTo('Profile', {
      screen: 'ProfileMain',
    });
  }, [navigateTo]);

  const navigateToPortfolio = useCallback(() => {
    navigateTo('Profile', {
      screen: 'Portfolio',
    });
  }, [navigateTo]);

  const navigateToTransactionHistory = useCallback(() => {
    navigateTo('Profile', {
      screen: 'TransactionHistory',
    });
  }, [navigateTo]);

  const navigateToSettings = useCallback((section) => {
    navigateTo('Profile', {
      screen: section || 'Settings',
    });
  }, [navigateTo]);

  // Handle deep linking
  const handleDeepLink = useCallback((link) => {
    try {
      const url = new URL(link);
      const path = url.pathname;
      const params = Object.fromEntries(url.searchParams);

      // Handle different deep link paths
      switch (path) {
        case '/match':
          if (params.id) {
            navigateToMatch(params.id);
          }
          break;
        case '/player':
          if (params.id) {
            navigateToPlayer(params.id);
          }
          break;
        case '/wallet':
          navigateToWallet(params.action);
          break;
        case '/profile':
          navigateToProfile();
          break;
        case '/portfolio':
          navigateToPortfolio();
          break;
        case '/transactions':
          navigateToTransactionHistory();
          break;
        case '/settings':
          navigateToSettings(params.section);
          break;
        default:
          console.warn('Unknown deep link path:', path);
      }
    } catch (error) {
      console.error('Deep link handling error:', error);
    }
  }, [
    navigateToMatch,
    navigateToPlayer,
    navigateToWallet,
    navigateToProfile,
    navigateToPortfolio,
    navigateToTransactionHistory,
    navigateToSettings,
  ]);

  return {
    // Basic navigation
    navigateTo,
    replaceTo,
    resetTo,
    goBack,
    popToTop,

    // Auth navigation
    navigateToAuth,
    navigateToApp,

    // Feature-specific navigation
    navigateToMatch,
    navigateToPlayer,
    navigateToWallet,
    navigateToProfile,
    navigateToPortfolio,
    navigateToTransactionHistory,
    navigateToSettings,

    // Deep linking
    handleDeepLink,

    // Original navigation object
    navigation,
  };
};

// Route constants
export const ROUTES = {
  // Auth routes
  AUTH: {
    LOGIN: 'Login',
    SIGNUP: 'Signup',
    FORGOT_PASSWORD: 'ForgotPassword',
  },

  // Main app routes
  APP: {
    HOME: 'Home',
    MATCHES: 'Matches',
    PLAYERS: 'Players',
    WALLET: 'Wallet',
    PROFILE: 'Profile',
  },

  // Nested routes
  MATCHES: {
    LIST: 'MatchesList',
    DETAILS: 'MatchDetails',
  },

  PLAYERS: {
    LIST: 'PlayersList',
    DETAILS: 'PlayerDetails',
  },

  PROFILE: {
    MAIN: 'ProfileMain',
    PORTFOLIO: 'Portfolio',
    TRANSACTIONS: 'TransactionHistory',
    BANK_ACCOUNTS: 'BankAccounts',
    NOTIFICATIONS: 'NotificationSettings',
    SECURITY: 'SecuritySettings',
    SUPPORT: 'Support',
    ABOUT: 'About',
  },
};

export default useNavigation;

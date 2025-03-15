import { useEffect, useCallback, useState } from 'react';
import { Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useAnalytics from './useAnalytics';
import useAuth from './useAuth';

const useDeepLink = (options = {}) => {
  const {
    onLink,
    onError,
    requireAuth = true,
  } = options;

  const [initialURL, setInitialURL] = useState(null);
  const [lastURL, setLastURL] = useState(null);
  const navigation = useNavigation();
  const { trackEvent } = useAnalytics();
  const { isAuthenticated } = useAuth();

  // Parse deep link URL
  const parseURL = useCallback((url) => {
    try {
      const route = url.replace(/.*?:\/\//g, '');
      const [path, queryString] = route.split('?');
      const segments = path.split('/').filter(Boolean);

      // Parse query parameters
      const queryParams = {};
      if (queryString) {
        queryString.split('&').forEach(param => {
          const [key, value] = param.split('=');
          queryParams[decodeURIComponent(key)] = decodeURIComponent(value);
        });
      }

      return {
        url,
        path,
        segments,
        queryParams,
      };
    } catch (error) {
      console.error('Deep link parsing error:', error);
      return null;
    }
  }, []);

  // Handle deep link navigation
  const handleNavigation = useCallback((parsedURL) => {
    if (!parsedURL) return;

    const { segments, queryParams } = parsedURL;
    const [mainRoute, ...subRoutes] = segments;

    try {
      // Track deep link event
      trackEvent('deep_link_opened', {
        url: parsedURL.url,
        route: mainRoute,
        params: queryParams,
      });

      // Handle different routes
      switch (mainRoute) {
        case 'match':
          navigation.navigate('Matches', {
            screen: 'MatchDetails',
            params: { matchId: subRoutes[0] || queryParams.id },
          });
          break;

        case 'player':
          navigation.navigate('Players', {
            screen: 'PlayerDetails',
            params: { playerId: subRoutes[0] || queryParams.id },
          });
          break;

        case 'wallet':
          navigation.navigate('Wallet', {
            action: queryParams.action,
          });
          break;

        case 'profile':
          navigation.navigate('Profile', {
            screen: subRoutes[0] || 'ProfileMain',
          });
          break;

        case 'settings':
          navigation.navigate('Profile', {
            screen: 'Settings',
            params: { section: queryParams.section },
          });
          break;

        default:
          // Handle custom deep link handler if provided
          if (onLink) {
            onLink(parsedURL);
          }
      }
    } catch (error) {
      console.error('Deep link navigation error:', error);
      if (onError) {
        onError(error);
      }
    }
  }, [navigation, trackEvent, onLink, onError]);

  // Handle incoming URL
  const handleURL = useCallback(({ url }) => {
    // Check authentication if required
    if (requireAuth && !isAuthenticated) {
      // Store URL to handle after authentication
      setLastURL(url);
      navigation.navigate('Login');
      return;
    }

    const parsedURL = parseURL(url);
    if (parsedURL) {
      handleNavigation(parsedURL);
      setLastURL(url);
    }
  }, [requireAuth, isAuthenticated, parseURL, handleNavigation, navigation]);

  // Get initial URL
  useEffect(() => {
    const getInitialURL = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          setInitialURL(url);
          handleURL({ url });
        }
      } catch (error) {
        console.error('Get initial URL error:', error);
        if (onError) {
          onError(error);
        }
      }
    };

    getInitialURL();
  }, [handleURL, onError]);

  // Listen for deep links
  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleURL);

    return () => {
      subscription.remove();
    };
  }, [handleURL]);

  // Handle deep link after authentication
  useEffect(() => {
    if (isAuthenticated && lastURL && requireAuth) {
      handleURL({ url: lastURL });
    }
  }, [isAuthenticated, lastURL, requireAuth, handleURL]);

  // Create deep link
  const createDeepLink = useCallback((route, params = {}) => {
    try {
      const baseUrl = 'cricketstocks://';
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

      return `${baseUrl}${route}${queryString ? `?${queryString}` : ''}`;
    } catch (error) {
      console.error('Create deep link error:', error);
      return null;
    }
  }, []);

  // Open deep link
  const openDeepLink = useCallback(async (route, params = {}) => {
    try {
      const url = createDeepLink(route, params);
      if (url) {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Open deep link error:', error);
      if (onError) {
        onError(error);
      }
      return false;
    }
  }, [createDeepLink, onError]);

  return {
    initialURL,
    lastURL,
    parseURL,
    createDeepLink,
    openDeepLink,
  };
};

// Deep link constants
export const DEEP_LINK_ROUTES = {
  MATCH: 'match',
  PLAYER: 'player',
  WALLET: 'wallet',
  PROFILE: 'profile',
  SETTINGS: 'settings',
};

// Example usage with share functionality
export const useShareDeepLink = () => {
  const { createDeepLink } = useDeepLink();

  const shareMatch = useCallback(async (matchId) => {
    const url = createDeepLink(DEEP_LINK_ROUTES.MATCH, { id: matchId });
    if (url) {
      try {
        await Share.share({
          message: 'Check out this match!',
          url,
        });
        return true;
      } catch (error) {
        console.error('Share match error:', error);
        return false;
      }
    }
    return false;
  }, [createDeepLink]);

  const sharePlayer = useCallback(async (playerId) => {
    const url = createDeepLink(DEEP_LINK_ROUTES.PLAYER, { id: playerId });
    if (url) {
      try {
        await Share.share({
          message: 'Check out this player!',
          url,
        });
        return true;
      } catch (error) {
        console.error('Share player error:', error);
        return false;
      }
    }
    return false;
  }, [createDeepLink]);

  return {
    shareMatch,
    sharePlayer,
  };
};

export default useDeepLink;

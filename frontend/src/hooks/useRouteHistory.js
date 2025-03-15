import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import useStorage from './useStorage';
import useAnalytics from './useAnalytics';
import useDateTime from './useDateTime';

const MAX_HISTORY_LENGTH = 50;
const STORAGE_KEY = '@RouteHistory';

const useRouteHistory = (options = {}) => {
  const {
    maxLength = MAX_HISTORY_LENGTH,
    persistHistory = true,
    trackAnalytics = true,
  } = options;

  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isNavigating = useRef(false);

  const navigation = useNavigation();
  const route = useRoute();
  const storage = useStorage(STORAGE_KEY);
  const { trackEvent } = useAnalytics();
  const { formatDateTime } = useDateTime();

  // Initialize history
  const initializeHistory = useCallback(async () => {
    if (persistHistory) {
      const storedHistory = await storage.getItem('routes');
      if (storedHistory) {
        setHistory(storedHistory);
        setCurrentIndex(storedHistory.length - 1);
      }
    }
  }, [persistHistory, storage]);

  // Save history
  const saveHistory = useCallback(async (newHistory) => {
    if (persistHistory) {
      await storage.setItem('routes', newHistory);
    }
  }, [persistHistory, storage]);

  // Add route to history
  const addToHistory = useCallback(async (routeInfo) => {
    if (isNavigating.current) return;

    const timestamp = Date.now();
    const newEntry = {
      ...routeInfo,
      timestamp,
      formattedTime: formatDateTime(timestamp),
    };

    setHistory(current => {
      const newHistory = [...current.slice(0, currentIndex + 1), newEntry]
        .slice(-maxLength);
      saveHistory(newHistory);
      return newHistory;
    });

    setCurrentIndex(current => Math.min(current + 1, maxLength - 1));

    if (trackAnalytics) {
      trackEvent('route_visited', {
        route: routeInfo.name,
        params: routeInfo.params,
      });
    }
  }, [
    maxLength,
    currentIndex,
    saveHistory,
    trackAnalytics,
    trackEvent,
    formatDateTime,
  ]);

  // Navigate to route
  const navigateToRoute = useCallback(async (routeInfo) => {
    try {
      isNavigating.current = true;
      await navigation.navigate(routeInfo.name, routeInfo.params);
      await addToHistory(routeInfo);
      return true;
    } catch (error) {
      console.error('Navigation error:', error);
      return false;
    } finally {
      isNavigating.current = false;
    }
  }, [navigation, addToHistory]);

  // Go back in history
  const goBack = useCallback(async () => {
    if (currentIndex > 0) {
      const previousRoute = history[currentIndex - 1];
      await navigateToRoute(previousRoute);
      setCurrentIndex(current => current - 1);
      return true;
    }
    return false;
  }, [currentIndex, history, navigateToRoute]);

  // Go forward in history
  const goForward = useCallback(async () => {
    if (currentIndex < history.length - 1) {
      const nextRoute = history[currentIndex + 1];
      await navigateToRoute(nextRoute);
      setCurrentIndex(current => current + 1);
      return true;
    }
    return false;
  }, [currentIndex, history, navigateToRoute]);

  // Clear history
  const clearHistory = useCallback(async () => {
    setHistory([]);
    setCurrentIndex(-1);
    if (persistHistory) {
      await storage.removeItem('routes');
    }
    if (trackAnalytics) {
      trackEvent('route_history_cleared');
    }
  }, [persistHistory, storage, trackAnalytics, trackEvent]);

  // Get current route info
  const getCurrentRoute = useCallback(() => {
    return currentIndex >= 0 ? history[currentIndex] : null;
  }, [currentIndex, history]);

  // Get previous route info
  const getPreviousRoute = useCallback(() => {
    return currentIndex > 0 ? history[currentIndex - 1] : null;
  }, [currentIndex, history]);

  // Search history
  const searchHistory = useCallback((query) => {
    const searchTerm = query.toLowerCase();
    return history.filter(route => 
      route.name.toLowerCase().includes(searchTerm) ||
      JSON.stringify(route.params).toLowerCase().includes(searchTerm)
    );
  }, [history]);

  // Get route statistics
  const getRouteStats = useCallback(() => {
    const stats = {
      totalVisits: history.length,
      uniqueRoutes: new Set(history.map(route => route.name)).size,
      routeCounts: {},
      averageTimeSpent: {},
    };

    history.forEach((route, index) => {
      // Count route visits
      stats.routeCounts[route.name] = (stats.routeCounts[route.name] || 0) + 1;

      // Calculate time spent
      if (index < history.length - 1) {
        const timeSpent = history[index + 1].timestamp - route.timestamp;
        if (!stats.averageTimeSpent[route.name]) {
          stats.averageTimeSpent[route.name] = {
            total: 0,
            count: 0,
          };
        }
        stats.averageTimeSpent[route.name].total += timeSpent;
        stats.averageTimeSpent[route.name].count += 1;
      }
    });

    // Calculate averages
    Object.keys(stats.averageTimeSpent).forEach(routeName => {
      const { total, count } = stats.averageTimeSpent[routeName];
      stats.averageTimeSpent[routeName] = Math.round(total / count);
    });

    return stats;
  }, [history]);

  // Track route changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      if (!isNavigating.current) {
        addToHistory({
          name: route.name,
          params: route.params,
        });
      }
    });

    return unsubscribe;
  }, [navigation, route, addToHistory]);

  // Initialize on mount
  useEffect(() => {
    initializeHistory();
  }, [initializeHistory]);

  return {
    // Navigation
    navigateToRoute,
    goBack,
    goForward,

    // History management
    history,
    currentIndex,
    clearHistory,
    searchHistory,

    // Route info
    getCurrentRoute,
    getPreviousRoute,
    getRouteStats,

    // State
    canGoBack: currentIndex > 0,
    canGoForward: currentIndex < history.length - 1,
  };
};

// Example usage with screen tracking
export const useScreenTracking = () => {
  const routeHistory = useRouteHistory();
  const { trackEvent } = useAnalytics();

  const trackScreenView = useCallback((screenName, params = {}) => {
    trackEvent('screen_view', {
      screen: screenName,
      params,
      previousScreen: routeHistory.getPreviousRoute()?.name,
    });
  }, [trackEvent, routeHistory]);

  return {
    ...routeHistory,
    trackScreenView,
  };
};

// Example usage with breadcrumbs
export const useBreadcrumbs = () => {
  const routeHistory = useRouteHistory();

  const getBreadcrumbs = useCallback(() => {
    return routeHistory.history.map(route => ({
      name: route.name,
      params: route.params,
      timestamp: route.timestamp,
    }));
  }, [routeHistory.history]);

  return {
    ...routeHistory,
    breadcrumbs: getBreadcrumbs(),
  };
};

export default useRouteHistory;

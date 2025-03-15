import { useEffect, useCallback, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import useAnalytics from './useAnalytics';
import useNetwork from './useNetwork';
import useWebSocket from './useWebSocket';
import useCache from './useCache';

const useLifecycle = (options = {}) => {
  const {
    onForeground,
    onBackground,
    onInactive,
    onNetworkChange,
    onMemoryWarning,
    cleanupOnBackground = true,
  } = options;

  const appState = useRef(AppState.currentState);
  const lastActiveAt = useRef(Date.now());
  const { trackEvent } = useAnalytics();
  const { checkConnectivity } = useNetwork();
  const { disconnect: disconnectWebSocket } = useWebSocket();
  const { cleanup: cleanupCache } = useCache();

  // Handle app state changes
  const handleAppStateChange = useCallback(async (nextAppState) => {
    const previousAppState = appState.current;
    appState.current = nextAppState;

    const now = Date.now();
    const timeInState = now - lastActiveAt.current;
    lastActiveAt.current = now;

    // Track state change
    trackEvent('app_state_change', {
      previousState: previousAppState,
      nextState: nextAppState,
      timeInState,
    });

    // Handle different states
    if (nextAppState === 'active') {
      // App came to foreground
      const isConnected = await checkConnectivity();
      
      trackEvent('app_foreground', {
        timeInBackground: timeInState,
        isConnected,
      });

      if (onForeground) {
        onForeground({
          timeInBackground: timeInState,
          previousState: previousAppState,
          isConnected,
        });
      }
    } else if (nextAppState === 'background') {
      // App went to background
      trackEvent('app_background', {
        timeActive: timeInState,
      });

      if (cleanupOnBackground) {
        // Cleanup resources
        await Promise.all([
          disconnectWebSocket(),
          cleanupCache(),
        ]);
      }

      if (onBackground) {
        onBackground({
          timeActive: timeInState,
          previousState: previousAppState,
        });
      }
    } else if (nextAppState === 'inactive') {
      // App became inactive (iOS only)
      trackEvent('app_inactive', {
        timeActive: timeInState,
      });

      if (onInactive) {
        onInactive({
          timeActive: timeInState,
          previousState: previousAppState,
        });
      }
    }
  }, [
    trackEvent,
    checkConnectivity,
    disconnectWebSocket,
    cleanupCache,
    cleanupOnBackground,
    onForeground,
    onBackground,
    onInactive,
  ]);

  // Handle network changes
  const handleNetworkChange = useCallback(async (isConnected) => {
    trackEvent('network_change', {
      isConnected,
      appState: appState.current,
    });

    if (onNetworkChange) {
      onNetworkChange({
        isConnected,
        appState: appState.current,
      });
    }
  }, [trackEvent, onNetworkChange]);

  // Handle memory warnings
  const handleMemoryWarning = useCallback(() => {
    trackEvent('memory_warning', {
      appState: appState.current,
    });

    if (onMemoryWarning) {
      onMemoryWarning({
        appState: appState.current,
      });
    }

    // Cleanup cache to free memory
    cleanupCache();
  }, [trackEvent, onMemoryWarning, cleanupCache]);

  // Set up app state listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  // Set up network change listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      handleNetworkChange(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, [handleNetworkChange]);

  // Set up memory warning listener (iOS only)
  useEffect(() => {
    if (Platform.OS === 'ios') {
      const subscription = NativeEventEmitter.addListener(
        'memoryWarning',
        handleMemoryWarning
      );

      return () => {
        subscription.remove();
      };
    }
  }, [handleMemoryWarning]);

  return {
    // Current state
    currentState: appState.current,
    lastActiveAt: lastActiveAt.current,

    // State checks
    isActive: appState.current === 'active',
    isBackground: appState.current === 'background',
    isInactive: appState.current === 'inactive',

    // Manual triggers
    handleAppStateChange,
    handleNetworkChange,
    handleMemoryWarning,
  };
};

// Example usage with auto-refresh
export const useAutoRefresh = (refreshFunction, options = {}) => {
  const {
    refreshInterval = 30000, // 30 seconds
    refreshOnForeground = true,
    refreshOnNetworkReconnect = true,
  } = options;

  const refreshTimeoutRef = useRef(null);
  const lastRefreshRef = useRef(Date.now());

  const lifecycle = useLifecycle({
    onForeground: async ({ timeInBackground }) => {
      if (refreshOnForeground && timeInBackground > refreshInterval) {
        await refreshFunction();
      }
    },
    onNetworkChange: async ({ isConnected }) => {
      if (refreshOnNetworkReconnect && isConnected) {
        await refreshFunction();
      }
    },
  });

  // Set up refresh interval
  useEffect(() => {
    if (lifecycle.isActive) {
      refreshTimeoutRef.current = setInterval(async () => {
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshRef.current;

        if (timeSinceLastRefresh >= refreshInterval) {
          await refreshFunction();
          lastRefreshRef.current = now;
        }
      }, refreshInterval);
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
    };
  }, [lifecycle.isActive, refreshInterval, refreshFunction]);

  return {
    lastRefresh: lastRefreshRef.current,
    isActive: lifecycle.isActive,
  };
};

export default useLifecycle;

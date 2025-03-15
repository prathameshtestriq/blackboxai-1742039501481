import { useState, useCallback, useRef, useEffect } from 'react';
import { AppState } from 'react-native';
import useStorage from './useStorage';
import useAnalytics from './useAnalytics';
import useNetwork from './useNetwork';
import useCache from './useCache';
import useSync from './useSync';

const useAppState = (options = {}) => {
  const {
    persistState = true,
    storageKey = '@AppState',
    cleanupOnBackground = true,
    syncOnForeground = true,
  } = options;

  const [currentState, setCurrentState] = useState(AppState.currentState);
  const [lastActiveAt, setLastActiveAt] = useState(Date.now());
  const [isInitialized, setIsInitialized] = useState(false);
  const backgroundTaskRef = useRef(null);

  const storage = useStorage(storageKey);
  const { trackEvent } = useAnalytics();
  const network = useNetwork();
  const cache = useCache();
  const sync = useSync();

  // Initialize app state
  const initialize = useCallback(async () => {
    try {
      if (persistState) {
        const savedState = await storage.getItem('state');
        if (savedState) {
          setLastActiveAt(savedState.lastActiveAt);
        }
      }
      setIsInitialized(true);

      trackEvent('app_initialized', {
        network: network.isConnected,
      });

      return true;
    } catch (error) {
      console.error('Initialize app state error:', error);
      return false;
    }
  }, [persistState, storage, network.isConnected, trackEvent]);

  // Save app state
  const saveState = useCallback(async () => {
    if (!persistState) return;

    try {
      await storage.setItem('state', {
        lastActiveAt,
        currentState,
      });
      return true;
    } catch (error) {
      console.error('Save app state error:', error);
      return false;
    }
  }, [persistState, storage, lastActiveAt, currentState]);

  // Handle app state change
  const handleAppStateChange = useCallback(async (nextAppState) => {
    const previousState = currentState;
    setCurrentState(nextAppState);

    const now = Date.now();
    const timeInState = now - lastActiveAt;
    setLastActiveAt(now);

    // Track state change
    trackEvent('app_state_changed', {
      previousState,
      nextState: nextAppState,
      timeInState,
    });

    // Handle different states
    if (nextAppState === 'active') {
      // App came to foreground
      if (syncOnForeground && timeInState > 60000) { // 1 minute
        await sync.sync();
      }

      trackEvent('app_foregrounded', {
        timeInBackground: timeInState,
      });
    } else if (nextAppState === 'background') {
      // App went to background
      if (cleanupOnBackground) {
        await cleanup();
      }

      trackEvent('app_backgrounded', {
        timeActive: timeInState,
      });
    }

    await saveState();
  }, [
    currentState,
    lastActiveAt,
    syncOnForeground,
    cleanupOnBackground,
    sync,
    trackEvent,
    saveState,
  ]);

  // Cleanup resources
  const cleanup = useCallback(async () => {
    try {
      // Cancel any background tasks
      if (backgroundTaskRef.current) {
        clearTimeout(backgroundTaskRef.current);
        backgroundTaskRef.current = null;
      }

      // Clean up cache
      await cache.cleanup();

      // Save any pending changes
      await sync.processSyncQueue();

      trackEvent('app_cleanup_completed');
      return true;
    } catch (error) {
      console.error('Cleanup error:', error);
      return false;
    }
  }, [cache, sync, trackEvent]);

  // Get app state info
  const getStateInfo = useCallback(() => {
    return {
      currentState,
      lastActiveAt,
      isInitialized,
      timeInCurrentState: Date.now() - lastActiveAt,
      isActive: currentState === 'active',
      isBackground: currentState === 'background',
      isInactive: currentState === 'inactive',
    };
  }, [currentState, lastActiveAt, isInitialized]);

  // Schedule background task
  const scheduleBackgroundTask = useCallback((task, delay) => {
    if (backgroundTaskRef.current) {
      clearTimeout(backgroundTaskRef.current);
    }

    backgroundTaskRef.current = setTimeout(async () => {
      try {
        await task();
        trackEvent('background_task_completed');
      } catch (error) {
        console.error('Background task error:', error);
        trackEvent('background_task_failed', {
          error: error.message,
        });
      }
    }, delay);

    trackEvent('background_task_scheduled', {
      delay,
    });
  }, [trackEvent]);

  // Reset app state
  const resetState = useCallback(async () => {
    try {
      await cleanup();
      if (persistState) {
        await storage.removeItem('state');
      }
      setCurrentState(AppState.currentState);
      setLastActiveAt(Date.now());
      setIsInitialized(false);
      await initialize();

      trackEvent('app_state_reset');
      return true;
    } catch (error) {
      console.error('Reset state error:', error);
      return false;
    }
  }, [cleanup, persistState, storage, initialize, trackEvent]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Listen for app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      cleanup();
    };
  }, [handleAppStateChange, cleanup]);

  return {
    // State
    currentState,
    lastActiveAt,
    isInitialized,

    // State checks
    isActive: currentState === 'active',
    isBackground: currentState === 'background',
    isInactive: currentState === 'inactive',

    // Actions
    initialize,
    cleanup,
    resetState,
    scheduleBackgroundTask,

    // Info
    getStateInfo,
  };
};

// Example usage with auto-save
export const useAutoSave = (saveFunction, options = {}) => {
  const {
    saveInterval = 30000, // 30 seconds
    saveOnBackground = true,
  } = options;

  const appState = useAppState({
    cleanupOnBackground: saveOnBackground,
  });

  useEffect(() => {
    if (appState.isActive) {
      const interval = setInterval(saveFunction, saveInterval);
      return () => clearInterval(interval);
    }
  }, [appState.isActive, saveFunction, saveInterval]);

  return appState;
};

// Example usage with session tracking
export const useSessionTracking = () => {
  const appState = useAppState();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (appState.isActive) {
      trackEvent('session_started');
      return () => trackEvent('session_ended');
    }
  }, [appState.isActive, trackEvent]);

  return appState;
};

export default useAppState;

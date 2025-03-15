import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import useError from './useError';

const STORAGE_PREFIX = '@CricketStocks:';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

const useStorage = (key, options = {}) => {
  const {
    initialValue = null,
    persist = true,
    cache = false,
    expiryTime = CACHE_EXPIRY,
    onError,
  } = options;

  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const { handleError } = useError();

  const storageKey = STORAGE_PREFIX + key;

  // Store data with optional expiry
  const storeData = useCallback(async (data) => {
    try {
      const item = {
        value: data,
        timestamp: cache ? Date.now() : null,
      };
      const jsonValue = JSON.stringify(item);
      await AsyncStorage.setItem(storageKey, jsonValue);
      setValue(data);
      return true;
    } catch (error) {
      handleError(error);
      onError?.(error);
      return false;
    }
  }, [storageKey, cache, handleError, onError]);

  // Load data and check expiry
  const loadData = useCallback(async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(storageKey);
      if (jsonValue != null) {
        const item = JSON.parse(jsonValue);
        
        // Check cache expiry
        if (cache && item.timestamp) {
          const now = Date.now();
          const age = now - item.timestamp;
          if (age > expiryTime) {
            await AsyncStorage.removeItem(storageKey);
            setValue(initialValue);
            return null;
          }
        }
        
        setValue(item.value);
        return item.value;
      }
      setValue(initialValue);
      return null;
    } catch (error) {
      handleError(error);
      onError?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [storageKey, cache, expiryTime, initialValue, handleError, onError]);

  // Remove data
  const removeData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(storageKey);
      setValue(initialValue);
      return true;
    } catch (error) {
      handleError(error);
      onError?.(error);
      return false;
    }
  }, [storageKey, initialValue, handleError, onError]);

  // Update data
  const updateData = useCallback(async (updater) => {
    try {
      const currentValue = await loadData();
      const newValue = typeof updater === 'function' 
        ? updater(currentValue)
        : updater;
      await storeData(newValue);
      return true;
    } catch (error) {
      handleError(error);
      onError?.(error);
      return false;
    }
  }, [loadData, storeData, handleError, onError]);

  // Clear all app storage
  const clearAllData = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX));
      await AsyncStorage.multiRemove(appKeys);
      setValue(initialValue);
      // Dispatch logout action to clear redux state
      dispatch({ type: 'auth/logout' });
      return true;
    } catch (error) {
      handleError(error);
      onError?.(error);
      return false;
    }
  }, [initialValue, dispatch, handleError, onError]);

  // Load data on mount if persist is true
  useEffect(() => {
    if (persist) {
      loadData();
    }
  }, [persist, loadData]);

  return {
    value,
    setValue: storeData,
    remove: removeData,
    update: updateData,
    clear: clearAllData,
    isLoading,
    reload: loadData,
  };
};

// Storage keys
export const STORAGE_KEYS = {
  AUTH: 'auth',
  USER_PREFERENCES: 'userPreferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  NOTIFICATIONS: 'notifications',
  RECENT_SEARCHES: 'recentSearches',
  WATCHLIST: 'watchlist',
  CACHED_MATCHES: 'cachedMatches',
  CACHED_PLAYERS: 'cachedPlayers',
};

// Example usage with user preferences
export const useUserPreferences = () => {
  return useStorage(STORAGE_KEYS.USER_PREFERENCES, {
    initialValue: {
      theme: 'light',
      language: 'en',
      notifications: true,
      currency: 'INR',
    },
    persist: true,
  });
};

// Example usage with cached data
export const useCachedData = (key, initialValue = null) => {
  return useStorage(key, {
    initialValue,
    persist: true,
    cache: true,
    expiryTime: CACHE_EXPIRY,
  });
};

// Example usage with recent searches
export const useRecentSearches = (maxItems = 10) => {
  const storage = useStorage(STORAGE_KEYS.RECENT_SEARCHES, {
    initialValue: [],
    persist: true,
  });

  const addSearch = useCallback(async (search) => {
    await storage.update(searches => {
      const newSearches = [search, ...searches.filter(s => s !== search)];
      return newSearches.slice(0, maxItems);
    });
  }, [storage, maxItems]);

  const clearSearches = useCallback(async () => {
    await storage.remove();
  }, [storage]);

  return {
    searches: storage.value,
    addSearch,
    clearSearches,
    isLoading: storage.isLoading,
  };
};

export default useStorage;

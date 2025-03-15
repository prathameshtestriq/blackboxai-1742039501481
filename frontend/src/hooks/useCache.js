import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import useNetwork from './useNetwork';
import useError from './useError';
import useAnalytics from './useAnalytics';

const CACHE_PREFIX = '@CricketStocks:cache:';
const DEFAULT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB

const useCache = (options = {}) => {
  const {
    defaultExpiry = DEFAULT_EXPIRY,
    maxSize = MAX_CACHE_SIZE,
    namespace = '',
  } = options;

  const network = useNetwork();
  const { handleError } = useError();
  const { trackEvent } = useAnalytics();

  // Get cache key
  const getCacheKey = useCallback((key) => {
    return `${CACHE_PREFIX}${namespace}:${key}`;
  }, [namespace]);

  // Get file cache path
  const getFileCachePath = useCallback((key) => {
    return `${RNFS.CachesDirectoryPath}/${namespace}/${key}`;
  }, [namespace]);

  // Set cache item
  const setItem = useCallback(async (key, value, expiry = defaultExpiry) => {
    try {
      const cacheKey = getCacheKey(key);
      const item = {
        value,
        timestamp: Date.now(),
        expiry,
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(item));

      trackEvent('cache_set', {
        key,
        namespace,
        expiry,
      });

      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [getCacheKey, defaultExpiry, namespace, trackEvent, handleError]);

  // Get cache item
  const getItem = useCallback(async (key) => {
    try {
      const cacheKey = getCacheKey(key);
      const data = await AsyncStorage.getItem(cacheKey);

      if (!data) return null;

      const item = JSON.parse(data);
      const now = Date.now();
      const age = now - item.timestamp;

      // Check expiry
      if (age > item.expiry) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      trackEvent('cache_hit', {
        key,
        namespace,
        age,
      });

      return item.value;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [getCacheKey, namespace, trackEvent, handleError]);

  // Remove cache item
  const removeItem = useCallback(async (key) => {
    try {
      const cacheKey = getCacheKey(key);
      await AsyncStorage.removeItem(cacheKey);

      trackEvent('cache_remove', {
        key,
        namespace,
      });

      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [getCacheKey, namespace, trackEvent, handleError]);

  // Clear all cache
  const clear = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith(`${CACHE_PREFIX}${namespace}`)
      );

      await AsyncStorage.multiRemove(cacheKeys);
      await RNFS.unlink(`${RNFS.CachesDirectoryPath}/${namespace}`);

      trackEvent('cache_clear', {
        namespace,
        itemCount: cacheKeys.length,
      });

      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [namespace, trackEvent, handleError]);

  // Cache file
  const cacheFile = useCallback(async (url, key, expiry = defaultExpiry) => {
    try {
      const filePath = getFileCachePath(key);
      const fileExists = await RNFS.exists(filePath);

      if (fileExists) {
        const stats = await RNFS.stat(filePath);
        const age = Date.now() - stats.mtime;

        if (age <= expiry) {
          trackEvent('cache_file_hit', {
            key,
            namespace,
            age,
          });

          return filePath;
        }
      }

      // Download file
      await RNFS.downloadFile({
        fromUrl: url,
        toFile: filePath,
        background: true,
      }).promise;

      trackEvent('cache_file_set', {
        key,
        namespace,
        expiry,
      });

      return filePath;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [getFileCachePath, defaultExpiry, namespace, trackEvent, handleError]);

  // Cache API response
  const cacheApiResponse = useCallback(async (key, apiCall, expiry = defaultExpiry) => {
    try {
      // Try to get from cache first
      const cachedData = await getItem(key);
      if (cachedData) return cachedData;

      // If offline, return null
      if (!network.isConnected) return null;

      // Make API call
      const response = await apiCall();
      if (response) {
        await setItem(key, response, expiry);
      }

      return response;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [getItem, setItem, network.isConnected, defaultExpiry, handleError]);

  // Get cache size
  const getCacheSize = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith(`${CACHE_PREFIX}${namespace}`)
      );

      let totalSize = 0;
      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        totalSize += data ? data.length : 0;
      }

      // Add file cache size
      const fileCacheStats = await RNFS.stat(`${RNFS.CachesDirectoryPath}/${namespace}`);
      totalSize += parseInt(fileCacheStats.size, 10);

      return totalSize;
    } catch (error) {
      handleError(error);
      return 0;
    }
  }, [namespace, handleError]);

  // Clean up old cache items
  const cleanup = useCallback(async () => {
    try {
      const size = await getCacheSize();
      if (size <= maxSize) return;

      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith(`${CACHE_PREFIX}${namespace}`)
      );

      // Sort by age and remove oldest items
      const items = await Promise.all(
        cacheKeys.map(async key => {
          const data = await AsyncStorage.getItem(key);
          const item = JSON.parse(data);
          return { key, timestamp: item.timestamp };
        })
      );

      items.sort((a, b) => a.timestamp - b.timestamp);

      for (const item of items) {
        await removeItem(item.key);
        const newSize = await getCacheSize();
        if (newSize <= maxSize) break;
      }

      trackEvent('cache_cleanup', {
        namespace,
        initialSize: size,
        finalSize: await getCacheSize(),
      });
    } catch (error) {
      handleError(error);
    }
  }, [getCacheSize, maxSize, namespace, removeItem, trackEvent, handleError]);

  return {
    setItem,
    getItem,
    removeItem,
    clear,
    cacheFile,
    cacheApiResponse,
    getCacheSize,
    cleanup,
  };
};

// Example usage with match data caching
export const useMatchCache = () => {
  const cache = useCache({ namespace: 'matches' });

  const cacheMatch = useCallback(async (matchId, match) => {
    return cache.setItem(`match:${matchId}`, match);
  }, [cache]);

  const getCachedMatch = useCallback(async (matchId) => {
    return cache.getItem(`match:${matchId}`);
  }, [cache]);

  return {
    cacheMatch,
    getCachedMatch,
  };
};

// Example usage with player data caching
export const usePlayerCache = () => {
  const cache = useCache({ namespace: 'players' });

  const cachePlayer = useCallback(async (playerId, player) => {
    return cache.setItem(`player:${playerId}`, player);
  }, [cache]);

  const getCachedPlayer = useCallback(async (playerId) => {
    return cache.getItem(`player:${playerId}`);
  }, [cache]);

  return {
    cachePlayer,
    getCachedPlayer,
  };
};

export default useCache;

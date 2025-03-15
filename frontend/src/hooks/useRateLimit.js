import { useCallback, useRef } from 'react';
import useStorage from './useStorage';
import useAnalytics from './useAnalytics';
import useError from './useError';

const useRateLimit = (options = {}) => {
  const {
    key = 'default',
    maxRequests = 60,
    perInterval = 60000, // 1 minute
    burstLimit = 10,
    cooldownPeriod = 300000, // 5 minutes
    storagePrefix = '@RateLimit:',
  } = options;

  const requestsRef = useRef([]);
  const burstCountRef = useRef(0);
  const storage = useStorage(`${storagePrefix}${key}`);
  const { trackEvent } = useAnalytics();
  const { handleError } = useError();

  // Clean old requests
  const cleanOldRequests = useCallback(() => {
    const now = Date.now();
    requestsRef.current = requestsRef.current.filter(
      timestamp => now - timestamp < perInterval
    );
  }, [perInterval]);

  // Check if rate limited
  const isRateLimited = useCallback(async () => {
    try {
      cleanOldRequests();

      const now = Date.now();
      const recentRequests = requestsRef.current.length;

      // Check burst limit
      if (burstCountRef.current >= burstLimit) {
        const lastBurst = await storage.getItem('lastBurst');
        if (lastBurst && now - lastBurst < cooldownPeriod) {
          trackEvent('rate_limit_burst_exceeded', {
            key,
            burstCount: burstCountRef.current,
          });
          return true;
        }
        burstCountRef.current = 0;
        await storage.setItem('lastBurst', null);
      }

      // Check rate limit
      if (recentRequests >= maxRequests) {
        const oldestRequest = requestsRef.current[0];
        const timeUntilReset = (oldestRequest + perInterval) - now;

        trackEvent('rate_limit_exceeded', {
          key,
          requestCount: recentRequests,
          timeUntilReset,
        });

        return true;
      }

      return false;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [
    key,
    maxRequests,
    burstLimit,
    cooldownPeriod,
    storage,
    trackEvent,
    handleError,
    cleanOldRequests,
  ]);

  // Track request
  const trackRequest = useCallback(async () => {
    try {
      const now = Date.now();
      requestsRef.current.push(now);
      burstCountRef.current++;

      if (burstCountRef.current === burstLimit) {
        await storage.setItem('lastBurst', now);
      }

      await storage.setItem('lastRequest', now);
      
      trackEvent('rate_limit_request', {
        key,
        requestCount: requestsRef.current.length,
        burstCount: burstCountRef.current,
      });
    } catch (error) {
      handleError(error);
    }
  }, [key, burstLimit, storage, trackEvent, handleError]);

  // Reset rate limit
  const reset = useCallback(async () => {
    try {
      requestsRef.current = [];
      burstCountRef.current = 0;
      await storage.setItem('lastBurst', null);
      await storage.setItem('lastRequest', null);

      trackEvent('rate_limit_reset', { key });
    } catch (error) {
      handleError(error);
    }
  }, [key, storage, trackEvent, handleError]);

  // Get rate limit info
  const getRateLimitInfo = useCallback(() => {
    cleanOldRequests();

    const now = Date.now();
    const recentRequests = requestsRef.current.length;
    const remainingRequests = maxRequests - recentRequests;
    const oldestRequest = requestsRef.current[0];
    const timeUntilReset = oldestRequest 
      ? Math.max(0, (oldestRequest + perInterval) - now)
      : 0;

    return {
      remaining: remainingRequests,
      total: maxRequests,
      timeUntilReset,
      burstCount: burstCountRef.current,
      burstRemaining: burstLimit - burstCountRef.current,
    };
  }, [maxRequests, perInterval, burstLimit, cleanOldRequests]);

  // Rate limited function wrapper
  const withRateLimit = useCallback(async (fn) => {
    const limited = await isRateLimited();
    if (limited) {
      const info = getRateLimitInfo();
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(info.timeUntilReset / 1000)} seconds.`);
    }

    await trackRequest();
    return fn();
  }, [isRateLimited, getRateLimitInfo, trackRequest]);

  return {
    isRateLimited,
    trackRequest,
    reset,
    getRateLimitInfo,
    withRateLimit,
  };
};

// Example usage with API calls
export const useApiRateLimit = (endpoint, options = {}) => {
  const rateLimit = useRateLimit({
    key: `api:${endpoint}`,
    maxRequests: 100,
    perInterval: 60000, // 1 minute
    ...options,
  });

  const makeRequest = useCallback(async (requestFn) => {
    return rateLimit.withRateLimit(requestFn);
  }, [rateLimit]);

  return {
    ...rateLimit,
    makeRequest,
  };
};

// Example usage with user actions
export const useActionRateLimit = (actionType, options = {}) => {
  const rateLimit = useRateLimit({
    key: `action:${actionType}`,
    maxRequests: 10,
    perInterval: 60000, // 1 minute
    burstLimit: 3,
    ...options,
  });

  const performAction = useCallback(async (actionFn) => {
    return rateLimit.withRateLimit(actionFn);
  }, [rateLimit]);

  return {
    ...rateLimit,
    performAction,
  };
};

// Example usage with search
export const useSearchRateLimit = (options = {}) => {
  const rateLimit = useRateLimit({
    key: 'search',
    maxRequests: 30,
    perInterval: 60000, // 1 minute
    burstLimit: 5,
    ...options,
  });

  const search = useCallback(async (searchFn) => {
    return rateLimit.withRateLimit(searchFn);
  }, [rateLimit]);

  return {
    ...rateLimit,
    search,
  };
};

export default useRateLimit;

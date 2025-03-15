import { useState, useCallback, useEffect, useRef } from 'react';
import useWebSocket from './useWebSocket';
import useCache from './useCache';
import useRateLimit from './useRateLimit';
import useAnalytics from './useAnalytics';
import useError from './useError';

const CACHE_KEYS = {
  PRICES: 'market_prices',
  TRENDS: 'market_trends',
  VOLUMES: 'market_volumes',
};

const useMarketData = (options = {}) => {
  const {
    symbol,
    interval = 1000, // 1 second
    cacheTime = 300000, // 5 minutes
    enableRealtime = true,
  } = options;

  const [price, setPrice] = useState(null);
  const [trend, setTrend] = useState(null);
  const [volume, setVolume] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const lastUpdateRef = useRef(null);

  const ws = useWebSocket();
  const cache = useCache();
  const rateLimit = useRateLimit();
  const { trackEvent } = useAnalytics();
  const { handleError } = useError();

  // Subscribe to market data
  const subscribe = useCallback(async () => {
    if (!symbol || !enableRealtime) return;

    try {
      await ws.connect();
      await ws.subscribe(`market:${symbol}`, (data) => {
        handleMarketData(data);
      });

      trackEvent('market_data_subscribed', {
        symbol,
      });

      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [symbol, enableRealtime, ws, trackEvent, handleError]);

  // Unsubscribe from market data
  const unsubscribe = useCallback(async () => {
    if (!symbol) return;

    try {
      await ws.unsubscribe(`market:${symbol}`);
      await ws.disconnect();

      trackEvent('market_data_unsubscribed', {
        symbol,
      });

      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [symbol, ws, trackEvent, handleError]);

  // Handle incoming market data
  const handleMarketData = useCallback((data) => {
    try {
      const now = Date.now();
      const timeSinceLastUpdate = lastUpdateRef.current 
        ? now - lastUpdateRef.current 
        : Infinity;

      // Apply rate limiting
      if (timeSinceLastUpdate < interval) {
        return;
      }

      // Update state
      setPrice(data.price);
      setTrend(data.trend);
      setVolume(data.volume);
      lastUpdateRef.current = now;

      // Cache data
      cacheMarketData(data);

      trackEvent('market_data_updated', {
        symbol,
        price: data.price,
        trend: data.trend,
      });
    } catch (error) {
      handleError(error);
    }
  }, [interval, symbol, trackEvent, handleError]);

  // Cache market data
  const cacheMarketData = useCallback(async (data) => {
    try {
      await cache.setItem(`${CACHE_KEYS.PRICES}:${symbol}`, data.price, cacheTime);
      await cache.setItem(`${CACHE_KEYS.TRENDS}:${symbol}`, data.trend, cacheTime);
      await cache.setItem(`${CACHE_KEYS.VOLUMES}:${symbol}`, data.volume, cacheTime);
    } catch (error) {
      handleError(error);
    }
  }, [symbol, cache, cacheTime, handleError]);

  // Load cached market data
  const loadCachedData = useCallback(async () => {
    try {
      const [cachedPrice, cachedTrend, cachedVolume] = await Promise.all([
        cache.getItem(`${CACHE_KEYS.PRICES}:${symbol}`),
        cache.getItem(`${CACHE_KEYS.TRENDS}:${symbol}`),
        cache.getItem(`${CACHE_KEYS.VOLUMES}:${symbol}`),
      ]);

      if (cachedPrice) setPrice(cachedPrice);
      if (cachedTrend) setTrend(cachedTrend);
      if (cachedVolume) setVolume(cachedVolume);

      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [symbol, cache, handleError]);

  // Get price history
  const getPriceHistory = useCallback(async (period = '1d') => {
    try {
      const response = await fetch(`/api/market/${symbol}/history?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch price history');

      const history = await response.json();
      return history;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [symbol, handleError]);

  // Get market statistics
  const getMarketStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/market/${symbol}/stats`);
      if (!response.ok) throw new Error('Failed to fetch market stats');

      const stats = await response.json();
      return stats;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [symbol, handleError]);

  // Calculate price change
  const calculatePriceChange = useCallback(() => {
    if (!price || !trend?.openPrice) return null;

    const change = price - trend.openPrice;
    const changePercent = (change / trend.openPrice) * 100;

    return {
      change,
      changePercent,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    };
  }, [price, trend]);

  // Initialize market data
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        await loadCachedData();
        if (enableRealtime) {
          await subscribe();
        }
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    return () => {
      unsubscribe();
    };
  }, [symbol, enableRealtime, loadCachedData, subscribe, unsubscribe]);

  return {
    // Market data
    price,
    trend,
    volume,
    isLoading,

    // Price analysis
    priceChange: calculatePriceChange(),

    // Historical data
    getPriceHistory,
    getMarketStats,

    // Subscription control
    subscribe,
    unsubscribe,
  };
};

// Example usage with player stocks
export const usePlayerStock = (playerId) => {
  const marketData = useMarketData({
    symbol: `PLAYER:${playerId}`,
    interval: 1000,
  });

  const getPlayerPerformance = useCallback(async () => {
    try {
      const response = await fetch(`/api/players/${playerId}/performance`);
      if (!response.ok) throw new Error('Failed to fetch player performance');

      const performance = await response.json();
      return performance;
    } catch (error) {
      console.error('Get player performance error:', error);
      return null;
    }
  }, [playerId]);

  return {
    ...marketData,
    getPlayerPerformance,
  };
};

// Example usage with match markets
export const useMatchMarket = (matchId) => {
  const marketData = useMarketData({
    symbol: `MATCH:${matchId}`,
    interval: 5000, // 5 seconds
  });

  const getMatchPredictions = useCallback(async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}/predictions`);
      if (!response.ok) throw new Error('Failed to fetch match predictions');

      const predictions = await response.json();
      return predictions;
    } catch (error) {
      console.error('Get match predictions error:', error);
      return null;
    }
  }, [matchId]);

  return {
    ...marketData,
    getMatchPredictions,
  };
};

export default useMarketData;

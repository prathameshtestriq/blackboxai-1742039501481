import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import useStorage from './useStorage';
import useAnalytics from './useAnalytics';
import useDateTime from './useDateTime';

const useMetrics = (options = {}) => {
  const {
    namespace = 'app',
    flushInterval = 60000, // 1 minute
    maxBufferSize = 100,
    storageKey = '@Metrics',
  } = options;

  const [metrics, setMetrics] = useState({});
  const metricsBuffer = useRef([]);
  const storage = useStorage(storageKey);
  const { trackEvent } = useAnalytics();
  const { formatDateTime } = useDateTime();

  // Initialize metrics from storage
  useEffect(() => {
    const loadMetrics = async () => {
      const stored = await storage.getItem(namespace);
      if (stored) {
        setMetrics(stored);
      }
    };
    loadMetrics();
  }, [namespace, storage]);

  // Track metric
  const trackMetric = useCallback(async (name, value, tags = {}) => {
    const timestamp = Date.now();
    const metric = {
      name,
      value,
      tags: {
        ...tags,
        platform: Platform.OS,
        version: Platform.Version,
        namespace,
      },
      timestamp,
    };

    metricsBuffer.current.push(metric);

    // Update current metrics state
    setMetrics(prev => ({
      ...prev,
      [name]: {
        value,
        lastUpdated: timestamp,
        ...tags,
      },
    }));

    // Flush if buffer is full
    if (metricsBuffer.current.length >= maxBufferSize) {
      await flushMetrics();
    }

    return metric;
  }, [namespace, maxBufferSize, flushMetrics]);

  // Flush metrics to storage and analytics
  const flushMetrics = useCallback(async () => {
    if (metricsBuffer.current.length === 0) return;

    const metricsToFlush = [...metricsBuffer.current];
    metricsBuffer.current = [];

    try {
      // Store metrics
      await storage.setItem(namespace, metrics);

      // Send to analytics
      trackEvent('metrics_flush', {
        namespace,
        count: metricsToFlush.length,
        metrics: metricsToFlush,
      });

      return true;
    } catch (error) {
      console.error('Metrics flush error:', error);
      // Restore metrics to buffer
      metricsBuffer.current = [...metricsToFlush, ...metricsBuffer.current];
      return false;
    }
  }, [namespace, metrics, storage, trackEvent]);

  // Set up periodic flush
  useEffect(() => {
    const interval = setInterval(flushMetrics, flushInterval);
    return () => clearInterval(interval);
  }, [flushInterval, flushMetrics]);

  // Increment counter
  const incrementCounter = useCallback(async (name, amount = 1, tags = {}) => {
    const currentValue = metrics[name]?.value || 0;
    return trackMetric(name, currentValue + amount, {
      ...tags,
      type: 'counter',
    });
  }, [metrics, trackMetric]);

  // Record gauge
  const recordGauge = useCallback(async (name, value, tags = {}) => {
    return trackMetric(name, value, {
      ...tags,
      type: 'gauge',
    });
  }, [trackMetric]);

  // Record timing
  const recordTiming = useCallback(async (name, duration, tags = {}) => {
    return trackMetric(name, duration, {
      ...tags,
      type: 'timing',
    });
  }, [trackMetric]);

  // Start timer
  const startTimer = useCallback((name) => {
    const start = Date.now();
    return {
      stop: async (tags = {}) => {
        const duration = Date.now() - start;
        return recordTiming(name, duration, tags);
      },
    };
  }, [recordTiming]);

  // Get metric
  const getMetric = useCallback((name) => {
    return metrics[name];
  }, [metrics]);

  // Get metrics summary
  const getMetricsSummary = useCallback(() => {
    const summary = {
      counters: {},
      gauges: {},
      timings: {},
    };

    Object.entries(metrics).forEach(([name, metric]) => {
      const type = metric.type || 'counter';
      summary[`${type}s`][name] = metric;
    });

    return summary;
  }, [metrics]);

  // Reset metrics
  const resetMetrics = useCallback(async () => {
    metricsBuffer.current = [];
    setMetrics({});
    await storage.removeItem(namespace);
    
    trackEvent('metrics_reset', { namespace });
  }, [namespace, storage, trackEvent]);

  return {
    // Core functionality
    trackMetric,
    flushMetrics,
    resetMetrics,

    // Metric types
    incrementCounter,
    recordGauge,
    recordTiming,
    startTimer,

    // Getters
    getMetric,
    getMetricsSummary,
    metrics,
  };
};

// Example usage with performance metrics
export const usePerformanceMetrics = () => {
  const metrics = useMetrics({ namespace: 'performance' });

  const recordRenderTime = useCallback(async (componentName, duration) => {
    return metrics.recordTiming(`render_${componentName}`, duration, {
      component: componentName,
    });
  }, [metrics]);

  const recordApiTime = useCallback(async (endpoint, duration, status) => {
    return metrics.recordTiming(`api_${endpoint}`, duration, {
      endpoint,
      status,
    });
  }, [metrics]);

  const recordFrameRate = useCallback(async (fps) => {
    return metrics.recordGauge('fps', fps);
  }, [metrics]);

  return {
    ...metrics,
    recordRenderTime,
    recordApiTime,
    recordFrameRate,
  };
};

// Example usage with user metrics
export const useUserMetrics = () => {
  const metrics = useMetrics({ namespace: 'user' });

  const recordScreenView = useCallback(async (screenName, duration) => {
    return metrics.recordTiming(`screen_${screenName}`, duration, {
      screen: screenName,
    });
  }, [metrics]);

  const recordInteraction = useCallback(async (type, target) => {
    return metrics.incrementCounter(`interaction_${type}`, 1, {
      type,
      target,
    });
  }, [metrics]);

  const recordFeatureUsage = useCallback(async (featureName) => {
    return metrics.incrementCounter(`feature_${featureName}`, 1, {
      feature: featureName,
    });
  }, [metrics]);

  return {
    ...metrics,
    recordScreenView,
    recordInteraction,
    recordFeatureUsage,
  };
};

export default useMetrics;

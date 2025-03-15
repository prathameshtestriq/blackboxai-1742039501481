import { useState, useCallback, useEffect, useRef } from 'react';
import { InteractionManager, Platform } from 'react-native';
import { PerformanceObserver, performance } from 'react-native-performance';
import useAnalytics from './useAnalytics';
import useError from './useError';

const usePerformance = (options = {}) => {
  const {
    enableMetrics = true,
    sampleRate = 1.0, // 100% sampling
    minDuration = 16, // 1 frame @ 60fps
  } = options;

  const [metrics, setMetrics] = useState({});
  const metricsRef = useRef({});
  const marksRef = useRef(new Map());
  const measuresRef = useRef(new Map());
  
  const { trackEvent } = useAnalytics();
  const { handleError } = useError();

  // Initialize performance observer
  useEffect(() => {
    if (!enableMetrics) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration >= minDuration) {
          const metric = {
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration,
            entryType: entry.entryType,
          };

          metricsRef.current[entry.name] = metric;
          setMetrics((prev) => ({ ...prev, [entry.name]: metric }));

          trackEvent('performance_metric', metric);
        }
      });
    });

    observer.observe({ entryTypes: ['measure', 'mark'] });

    return () => observer.disconnect();
  }, [enableMetrics, minDuration, trackEvent]);

  // Start measuring
  const startMeasure = useCallback((name) => {
    if (!enableMetrics) return;

    try {
      const shouldSample = Math.random() < sampleRate;
      if (!shouldSample) return;

      const mark = `${name}_start`;
      performance.mark(mark);
      marksRef.current.set(name, mark);
    } catch (error) {
      handleError(error);
    }
  }, [enableMetrics, sampleRate, handleError]);

  // End measuring
  const endMeasure = useCallback((name) => {
    if (!enableMetrics) return;

    try {
      const startMark = marksRef.current.get(name);
      if (!startMark) return;

      const endMark = `${name}_end`;
      performance.mark(endMark);
      performance.measure(name, startMark, endMark);

      marksRef.current.delete(name);
      measuresRef.current.set(name, true);
    } catch (error) {
      handleError(error);
    }
  }, [enableMetrics, handleError]);

  // Measure async operation
  const measureAsync = useCallback(async (name, operation) => {
    startMeasure(name);
    try {
      const result = await operation();
      return result;
    } finally {
      endMeasure(name);
    }
  }, [startMeasure, endMeasure]);

  // Measure interaction
  const measureInteraction = useCallback((name, interaction) => {
    return InteractionManager.runAfterInteractions(() => {
      return measureAsync(name, interaction);
    });
  }, [measureAsync]);

  // Get metric
  const getMetric = useCallback((name) => {
    return metricsRef.current[name];
  }, []);

  // Clear metrics
  const clearMetrics = useCallback(() => {
    metricsRef.current = {};
    marksRef.current.clear();
    measuresRef.current.clear();
    setMetrics({});
    performance.clearMarks();
    performance.clearMeasures();
  }, []);

  // Report metrics
  const reportMetrics = useCallback(() => {
    const report = {
      timestamp: Date.now(),
      platform: Platform.OS,
      version: Platform.Version,
      metrics: { ...metricsRef.current },
    };

    trackEvent('performance_report', report);
    return report;
  }, [trackEvent]);

  // Performance monitoring helpers
  const monitors = {
    // Monitor render performance
    render: useCallback((Component) => {
      return function PerformanceMonitoredComponent(props) {
        const renderName = `render_${Component.name}`;
        startMeasure(renderName);

        useEffect(() => {
          endMeasure(renderName);
        });

        return <Component {...props} />;
      };
    }, [startMeasure, endMeasure]),

    // Monitor navigation performance
    navigation: useCallback((name) => {
      startMeasure(`navigation_${name}`);
      return () => endMeasure(`navigation_${name}`);
    }, [startMeasure, endMeasure]),

    // Monitor API call performance
    api: useCallback(async (name, apiCall) => {
      return measureAsync(`api_${name}`, apiCall);
    }, [measureAsync]),

    // Monitor animation performance
    animation: useCallback((name, animation) => {
      return measureInteraction(`animation_${name}`, animation);
    }, [measureInteraction]),
  };

  return {
    // Core functionality
    startMeasure,
    endMeasure,
    measureAsync,
    measureInteraction,

    // Metrics
    metrics,
    getMetric,
    clearMetrics,
    reportMetrics,

    // Monitors
    monitors,
  };
};

// Example usage with screen performance
export const useScreenPerformance = (screenName) => {
  const performance = usePerformance();

  useEffect(() => {
    performance.startMeasure(`screen_${screenName}_mount`);
    return () => {
      performance.endMeasure(`screen_${screenName}_mount`);
    };
  }, [screenName, performance]);

  return performance;
};

// Example usage with API performance
export const useApiPerformance = () => {
  const performance = usePerformance();

  const measureApiCall = useCallback(async (name, apiCall) => {
    return performance.monitors.api(name, apiCall);
  }, [performance]);

  return {
    measureApiCall,
  };
};

export default usePerformance;

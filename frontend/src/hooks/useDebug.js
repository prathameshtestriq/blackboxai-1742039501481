import { useCallback, useRef, useEffect } from 'react';
import { Platform, LogBox } from 'react-native';
import useStorage from './useStorage';
import useNetwork from './useNetwork';
import useAnalytics from './useAnalytics';

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
};

const useDebug = (options = {}) => {
  const {
    namespace = 'app',
    logLevel = __DEV__ ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR,
    maxLogSize = 1000,
    persistLogs = true,
    storageKey = '@Debug',
  } = options;

  const logs = useRef([]);
  const storage = useStorage(storageKey);
  const network = useNetwork();
  const { trackEvent } = useAnalytics();

  // Format log message
  const formatLog = useCallback((level, message, meta = {}) => {
    return {
      timestamp: new Date().toISOString(),
      level,
      namespace,
      message,
      meta: {
        ...meta,
        platform: Platform.OS,
        version: Platform.Version,
        isConnected: network.isConnected,
      },
    };
  }, [namespace, network.isConnected]);

  // Save logs to storage
  const saveLogs = useCallback(async () => {
    if (!persistLogs) return;

    try {
      await storage.setItem('logs', logs.current);
    } catch (error) {
      console.error('Error saving logs:', error);
    }
  }, [persistLogs, storage]);

  // Add log entry
  const addLog = useCallback(async (level, message, meta = {}) => {
    if (level < logLevel) return;

    const log = formatLog(level, message, meta);
    logs.current = [log, ...logs.current].slice(0, maxLogSize);

    if (__DEV__) {
      switch (level) {
        case LOG_LEVELS.DEBUG:
          console.debug(message, meta);
          break;
        case LOG_LEVELS.INFO:
          console.info(message, meta);
          break;
        case LOG_LEVELS.WARN:
          console.warn(message, meta);
          break;
        case LOG_LEVELS.ERROR:
          console.error(message, meta);
          break;
      }
    }

    await saveLogs();
    return log;
  }, [logLevel, formatLog, maxLogSize, saveLogs]);

  // Log methods
  const debug = useCallback((message, meta) => {
    return addLog(LOG_LEVELS.DEBUG, message, meta);
  }, [addLog]);

  const info = useCallback((message, meta) => {
    return addLog(LOG_LEVELS.INFO, message, meta);
  }, [addLog]);

  const warn = useCallback((message, meta) => {
    return addLog(LOG_LEVELS.WARN, message, meta);
  }, [addLog]);

  const error = useCallback((message, meta) => {
    return addLog(LOG_LEVELS.ERROR, message, meta);
  }, [addLog]);

  // Clear logs
  const clearLogs = useCallback(async () => {
    logs.current = [];
    if (persistLogs) {
      await storage.removeItem('logs');
    }
    trackEvent('debug_logs_cleared', { namespace });
  }, [persistLogs, storage, trackEvent, namespace]);

  // Get logs
  const getLogs = useCallback((options = {}) => {
    const {
      level,
      limit = maxLogSize,
      startTime,
      endTime,
    } = options;

    let filtered = [...logs.current];

    if (level !== undefined) {
      filtered = filtered.filter(log => log.level >= level);
    }

    if (startTime) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(startTime));
    }

    if (endTime) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(endTime));
    }

    return filtered.slice(0, limit);
  }, [maxLogSize]);

  // Export logs
  const exportLogs = useCallback(async (format = 'json') => {
    try {
      const allLogs = getLogs();
      
      switch (format) {
        case 'json':
          return JSON.stringify(allLogs, null, 2);
        case 'csv':
          const headers = ['timestamp', 'level', 'namespace', 'message'];
          const rows = allLogs.map(log => 
            headers.map(key => log[key]).join(',')
          );
          return [headers.join(','), ...rows].join('\n');
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
      return null;
    }
  }, [getLogs]);

  // Initialize debug system
  useEffect(() => {
    const initialize = async () => {
      if (persistLogs) {
        const storedLogs = await storage.getItem('logs');
        if (storedLogs) {
          logs.current = storedLogs;
        }
      }

      // Ignore specific warnings in development
      if (__DEV__) {
        LogBox.ignoreLogs([
          'Require cycle:',
          'ViewPropTypes will be removed',
        ]);
      }

      info('Debug system initialized', {
        logLevel,
        maxLogSize,
        persistLogs,
      });
    };

    initialize();
  }, [persistLogs, storage, info, logLevel, maxLogSize]);

  return {
    // Log methods
    debug,
    info,
    warn,
    error,

    // Log management
    clearLogs,
    getLogs,
    exportLogs,

    // Constants
    LOG_LEVELS,
  };
};

// Example usage with performance debugging
export const usePerformanceDebug = () => {
  const debug = useDebug({ namespace: 'performance' });

  const logRenderTime = useCallback((componentName, startTime) => {
    const duration = Date.now() - startTime;
    debug.info(`${componentName} render time`, { duration });
  }, [debug]);

  const logApiCall = useCallback((endpoint, startTime, status) => {
    const duration = Date.now() - startTime;
    debug.info(`API call to ${endpoint}`, { duration, status });
  }, [debug]);

  return {
    ...debug,
    logRenderTime,
    logApiCall,
  };
};

// Example usage with network debugging
export const useNetworkDebug = () => {
  const debug = useDebug({ namespace: 'network' });
  const network = useNetwork();

  useEffect(() => {
    debug.info('Network status changed', {
      isConnected: network.isConnected,
      type: network.connectionType,
    });
  }, [debug, network.isConnected, network.connectionType]);

  const logRequest = useCallback((config) => {
    debug.info('API request', {
      url: config.url,
      method: config.method,
      headers: config.headers,
    });
  }, [debug]);

  const logResponse = useCallback((response) => {
    debug.info('API response', {
      status: response.status,
      data: response.data,
    });
  }, [debug]);

  const logError = useCallback((error) => {
    debug.error('API error', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
    });
  }, [debug]);

  return {
    ...debug,
    logRequest,
    logResponse,
    logError,
  };
};

export default useDebug;

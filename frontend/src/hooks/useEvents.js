import { useCallback, useEffect, useRef } from 'react';
import EventEmitter from 'eventemitter3';
import useAnalytics from './useAnalytics';
import useDebug from './useDebug';

// Global event emitter instance
const eventEmitter = new EventEmitter();

// Event categories
const EVENT_CATEGORIES = {
  NAVIGATION: 'navigation',
  AUTH: 'auth',
  DATA: 'data',
  UI: 'ui',
  NETWORK: 'network',
  LIFECYCLE: 'lifecycle',
  ERROR: 'error',
  CUSTOM: 'custom',
};

const useEvents = (options = {}) => {
  const {
    namespace = 'app',
    trackAnalytics = true,
    debug = false,
  } = options;

  const subscriptions = useRef([]);
  const { trackEvent } = useAnalytics();
  const { debug: logDebug } = useDebug();

  // Emit event
  const emit = useCallback((eventName, data = {}) => {
    try {
      const event = {
        name: eventName,
        namespace,
        timestamp: Date.now(),
        data,
      };

      eventEmitter.emit(eventName, event);

      if (trackAnalytics) {
        trackEvent(`event_${eventName}`, {
          namespace,
          ...data,
        });
      }

      if (debug) {
        logDebug('Event emitted', {
          event,
          listeners: eventEmitter.listeners(eventName).length,
        });
      }

      return true;
    } catch (error) {
      console.error('Event emission error:', error);
      return false;
    }
  }, [namespace, trackAnalytics, debug, trackEvent, logDebug]);

  // Subscribe to event
  const on = useCallback((eventName, handler) => {
    try {
      eventEmitter.on(eventName, handler);
      subscriptions.current.push({ eventName, handler });

      if (debug) {
        logDebug('Event subscription added', {
          eventName,
          totalSubscriptions: subscriptions.current.length,
        });
      }

      return () => off(eventName, handler);
    } catch (error) {
      console.error('Event subscription error:', error);
      return () => {};
    }
  }, [debug, logDebug]);

  // Subscribe to event once
  const once = useCallback((eventName, handler) => {
    try {
      eventEmitter.once(eventName, handler);

      if (debug) {
        logDebug('One-time event subscription added', {
          eventName,
        });
      }

      return () => off(eventName, handler);
    } catch (error) {
      console.error('Event one-time subscription error:', error);
      return () => {};
    }
  }, [debug, logDebug]);

  // Unsubscribe from event
  const off = useCallback((eventName, handler) => {
    try {
      eventEmitter.off(eventName, handler);
      subscriptions.current = subscriptions.current.filter(
        sub => sub.eventName !== eventName || sub.handler !== handler
      );

      if (debug) {
        logDebug('Event subscription removed', {
          eventName,
          remainingSubscriptions: subscriptions.current.length,
        });
      }

      return true;
    } catch (error) {
      console.error('Event unsubscription error:', error);
      return false;
    }
  }, [debug, logDebug]);

  // Remove all subscriptions
  const removeAllSubscriptions = useCallback(() => {
    try {
      subscriptions.current.forEach(({ eventName, handler }) => {
        eventEmitter.off(eventName, handler);
      });
      subscriptions.current = [];

      if (debug) {
        logDebug('All event subscriptions removed');
      }

      return true;
    } catch (error) {
      console.error('Remove all subscriptions error:', error);
      return false;
    }
  }, [debug, logDebug]);

  // Get active subscriptions
  const getSubscriptions = useCallback(() => {
    return subscriptions.current.map(({ eventName }) => ({
      eventName,
      listenerCount: eventEmitter.listeners(eventName).length,
    }));
  }, []);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      removeAllSubscriptions();
    };
  }, [removeAllSubscriptions]);

  return {
    emit,
    on,
    once,
    off,
    removeAllSubscriptions,
    getSubscriptions,
    EVENT_CATEGORIES,
  };
};

// Example usage with navigation events
export const useNavigationEvents = () => {
  const events = useEvents({
    namespace: EVENT_CATEGORIES.NAVIGATION,
  });

  const emitScreenView = useCallback((screenName, params = {}) => {
    return events.emit('screen_view', {
      screen: screenName,
      params,
    });
  }, [events]);

  const emitNavigationError = useCallback((error, details = {}) => {
    return events.emit('navigation_error', {
      error: error.message,
      ...details,
    });
  }, [events]);

  return {
    ...events,
    emitScreenView,
    emitNavigationError,
  };
};

// Example usage with auth events
export const useAuthEvents = () => {
  const events = useEvents({
    namespace: EVENT_CATEGORIES.AUTH,
  });

  const emitLogin = useCallback((userId) => {
    return events.emit('login', { userId });
  }, [events]);

  const emitLogout = useCallback(() => {
    return events.emit('logout');
  }, [events]);

  const emitAuthError = useCallback((error) => {
    return events.emit('auth_error', {
      error: error.message,
    });
  }, [events]);

  return {
    ...events,
    emitLogin,
    emitLogout,
    emitAuthError,
  };
};

// Example usage with data events
export const useDataEvents = () => {
  const events = useEvents({
    namespace: EVENT_CATEGORIES.DATA,
  });

  const emitDataChange = useCallback((entity, action, data) => {
    return events.emit('data_change', {
      entity,
      action,
      data,
    });
  }, [events]);

  const emitSyncComplete = useCallback((details) => {
    return events.emit('sync_complete', details);
  }, [events]);

  const emitDataError = useCallback((error, entity) => {
    return events.emit('data_error', {
      error: error.message,
      entity,
    });
  }, [events]);

  return {
    ...events,
    emitDataChange,
    emitSyncComplete,
    emitDataError,
  };
};

export default useEvents;

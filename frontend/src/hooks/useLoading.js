import { useState, useCallback, useRef, useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useSelector } from 'react-redux';

const useLoading = (options = {}) => {
  const {
    initialState = false,
    preventBackButton = true,
    timeout = 30000, // 30 seconds default timeout
    onTimeout,
  } = options;

  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingMessage, setLoadingMessage] = useState('');
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(null);

  // Get global loading state from redux store
  const globalLoading = useSelector((state) => state.app.loading);

  // Start loading
  const startLoading = useCallback((message = '') => {
    setIsLoading(true);
    setLoadingMessage(message);
    startTimeRef.current = Date.now();

    // Set timeout
    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        stopLoading();
        if (onTimeout) {
          onTimeout();
        }
      }, timeout);
    }
  }, [timeout, onTimeout]);

  // Stop loading
  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage('');
    startTimeRef.current = null;

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Update loading message
  const updateLoadingMessage = useCallback((message) => {
    setLoadingMessage(message);
  }, []);

  // Get loading duration
  const getLoadingDuration = useCallback(() => {
    if (!startTimeRef.current) return 0;
    return Date.now() - startTimeRef.current;
  }, []);

  // Wrap async function with loading state
  const withLoading = useCallback(async (asyncFn, message = '') => {
    try {
      startLoading(message);
      const result = await asyncFn();
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  // Handle back button during loading
  useEffect(() => {
    let backHandler;
    if (preventBackButton && isLoading) {
      backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    }
    return () => {
      if (backHandler) {
        backHandler.remove();
      }
    };
  }, [preventBackButton, isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Loading states for different scenarios
  const loadingStates = {
    // API loading state
    api: {
      start: (message = 'Loading...') => startLoading(message),
      stop: stopLoading,
      isLoading,
      message: loadingMessage,
    },

    // Form submission loading state
    form: {
      start: (message = 'Submitting...') => startLoading(message),
      stop: stopLoading,
      isLoading,
      message: loadingMessage,
    },

    // Data fetching loading state
    fetch: {
      start: (message = 'Fetching data...') => startLoading(message),
      stop: stopLoading,
      isLoading,
      message: loadingMessage,
    },

    // Upload loading state
    upload: {
      start: (message = 'Uploading...') => startLoading(message),
      stop: stopLoading,
      isLoading,
      message: loadingMessage,
    },

    // Download loading state
    download: {
      start: (message = 'Downloading...') => startLoading(message),
      stop: stopLoading,
      isLoading,
      message: loadingMessage,
    },

    // Processing loading state
    process: {
      start: (message = 'Processing...') => startLoading(message),
      stop: stopLoading,
      isLoading,
      message: loadingMessage,
    },
  };

  // Loading messages for different scenarios
  const LoadingMessages = {
    API: {
      FETCHING: 'Fetching data...',
      SUBMITTING: 'Submitting...',
      UPDATING: 'Updating...',
      DELETING: 'Deleting...',
    },
    AUTH: {
      LOGGING_IN: 'Logging in...',
      SIGNING_UP: 'Creating account...',
      LOGGING_OUT: 'Logging out...',
    },
    DATA: {
      LOADING: 'Loading...',
      REFRESHING: 'Refreshing...',
      SYNCING: 'Syncing...',
    },
    UPLOAD: {
      IMAGE: 'Uploading image...',
      FILE: 'Uploading file...',
      DOCUMENT: 'Uploading document...',
    },
    DOWNLOAD: {
      FILE: 'Downloading file...',
      DOCUMENT: 'Downloading document...',
      UPDATE: 'Downloading update...',
    },
    PROCESS: {
      ANALYZING: 'Analyzing...',
      CALCULATING: 'Calculating...',
      VALIDATING: 'Validating...',
    },
  };

  return {
    // Basic loading state
    isLoading: isLoading || globalLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    updateLoadingMessage,
    getLoadingDuration,
    withLoading,

    // Scenario-specific loading states
    loadingStates,
    LoadingMessages,
  };
};

// Loading state provider component
export const LoadingProvider = ({ children }) => {
  const { isLoading, loadingMessage } = useLoading();

  if (!isLoading) return children;

  return (
    <>
      {children}
      <LoadingOverlay message={loadingMessage} />
    </>
  );
};

// Loading overlay component
const LoadingOverlay = ({ message }) => (
  <View style={styles.overlay}>
    <ActivityIndicator size="large" color="#ffffff" />
    {message ? <Text style={styles.message}>{message}</Text> : null}
  </View>
);

const styles = {
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
};

export default useLoading;

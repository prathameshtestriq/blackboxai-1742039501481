import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import useError from './useError';

const useNetwork = (options = {}) => {
  const {
    onConnected,
    onDisconnected,
    checkInterval = 10000, // Check connectivity every 10 seconds
    requireStrongConnection = false,
  } = options;

  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [connectionType, setConnectionType] = useState(null);
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [isStrongConnection, setIsStrongConnection] = useState(true);
  const { handleError } = useError();

  // Handle connection change
  const handleConnectionChange = useCallback((state) => {
    setIsConnected(state.isConnected);
    setIsInternetReachable(state.isInternetReachable);
    setConnectionType(state.type);
    setConnectionDetails(state.details);

    // Check connection strength
    const isStrong = state.isConnected && (
      state.type === 'wifi' ||
      (state.type === 'cellular' && 
       (state.details?.cellularGeneration === '4g' || 
        state.details?.cellularGeneration === '5g'))
    );
    setIsStrongConnection(isStrong);

    // Call callbacks
    if (state.isConnected) {
      onConnected?.();
    } else {
      onDisconnected?.();
    }
  }, [onConnected, onDisconnected]);

  // Check internet connectivity
  const checkConnectivity = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();
      handleConnectionChange(state);
      return state.isConnected && state.isInternetReachable;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [handleConnectionChange, handleError]);

  // Ping server to verify connection
  const pingServer = useCallback(async () => {
    try {
      const response = await fetch('https://www.google.com', {
        method: 'GET',
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }, []);

  // Check if connection meets requirements
  const isConnectionValid = useCallback(() => {
    if (!isConnected || !isInternetReachable) return false;
    if (requireStrongConnection && !isStrongConnection) return false;
    return true;
  }, [isConnected, isInternetReachable, requireStrongConnection, isStrongConnection]);

  // Get connection info
  const getConnectionInfo = useCallback(() => {
    return {
      isConnected,
      isInternetReachable,
      connectionType,
      connectionDetails,
      isStrongConnection,
    };
  }, [
    isConnected,
    isInternetReachable,
    connectionType,
    connectionDetails,
    isStrongConnection,
  ]);

  // Get connection status message
  const getConnectionStatus = useCallback(() => {
    if (!isConnected) {
      return 'No network connection';
    }
    if (!isInternetReachable) {
      return 'No internet access';
    }
    if (requireStrongConnection && !isStrongConnection) {
      return 'Weak network connection';
    }
    if (connectionType === 'cellular') {
      return `Connected to mobile data (${connectionDetails?.cellularGeneration || 'unknown'})`;
    }
    if (connectionType === 'wifi') {
      return 'Connected to WiFi';
    }
    return 'Connected';
  }, [
    isConnected,
    isInternetReachable,
    requireStrongConnection,
    isStrongConnection,
    connectionType,
    connectionDetails,
  ]);

  // Set up network listeners
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(handleConnectionChange);

    // Set up periodic connectivity check
    let intervalId;
    if (checkInterval > 0) {
      intervalId = setInterval(checkConnectivity, checkInterval);
    }

    // Initial check
    checkConnectivity();

    return () => {
      unsubscribe();
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [handleConnectionChange, checkConnectivity, checkInterval]);

  return {
    // Connection state
    isConnected,
    isInternetReachable,
    connectionType,
    connectionDetails,
    isStrongConnection,

    // Connection checks
    checkConnectivity,
    pingServer,
    isConnectionValid,

    // Connection info
    getConnectionInfo,
    getConnectionStatus,
  };
};

// Network retry helper
export const withNetworkRetry = async (
  operation,
  options = {}
) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
    requireConnection = true,
  } = options;

  const network = useNetwork();
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      if (requireConnection && !network.isConnectionValid()) {
        throw new Error('No valid network connection');
      }

      return await operation();
    } catch (error) {
      attempts++;
      
      if (attempts === maxRetries) {
        throw error;
      }

      onRetry?.(error, attempts);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

// Example usage with API calls
export const useNetworkAwareApi = (apiFunction, options = {}) => {
  const network = useNetwork();
  const { handleError } = useError();

  const executeApiCall = useCallback(async (...args) => {
    if (!network.isConnectionValid()) {
      handleError(new Error('No network connection'));
      return null;
    }

    try {
      return await withNetworkRetry(
        () => apiFunction(...args),
        options
      );
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [network, apiFunction, options, handleError]);

  return {
    execute: executeApiCall,
    ...network,
  };
};

export default useNetwork;

import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Sentry from '@sentry/react-native';
import useAnalytics from './useAnalytics';
import useAuth from './useAuth';

const useError = (options = {}) => {
  const {
    showAlert = true,
    captureException = true,
    logToAnalytics = true,
  } = options;

  const [error, setError] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);
  const { trackError } = useAnalytics();
  const { logout } = useAuth();

  // Handle API errors
  const handleApiError = useCallback((error) => {
    const errorMessage = error.response?.data?.message || error.message;
    const errorCode = error.response?.status;

    // Handle specific error codes
    switch (errorCode) {
      case 401:
        // Unauthorized - clear auth state
        logout();
        break;
      case 403:
        // Forbidden
        Alert.alert(
          'Access Denied',
          'You do not have permission to perform this action.'
        );
        break;
      case 404:
        // Not Found
        Alert.alert(
          'Not Found',
          'The requested resource was not found.'
        );
        break;
      case 422:
        // Validation Error
        Alert.alert(
          'Validation Error',
          errorMessage || 'Please check your input and try again.'
        );
        break;
      case 429:
        // Rate Limited
        Alert.alert(
          'Too Many Requests',
          'Please wait a moment before trying again.'
        );
        break;
      case 500:
        // Server Error
        Alert.alert(
          'Server Error',
          'An unexpected error occurred. Please try again later.'
        );
        break;
      default:
        if (showAlert) {
          Alert.alert(
            'Error',
            errorMessage || 'An unexpected error occurred.'
          );
        }
    }

    // Log error
    if (captureException) {
      Sentry.captureException(error, {
        extra: {
          code: errorCode,
          message: errorMessage,
          url: error.config?.url,
          method: error.config?.method,
        },
      });
    }

    if (logToAnalytics) {
      trackError(error, 'api_error');
    }

    return error;
  }, [logout, showAlert, captureException, logToAnalytics, trackError]);

  // Handle form validation errors
  const handleValidationError = useCallback((errors) => {
    if (showAlert) {
      Alert.alert(
        'Validation Error',
        Object.values(errors).join('\n')
      );
    }

    if (logToAnalytics) {
      trackError({ message: 'Validation Error', errors }, 'validation_error');
    }

    return errors;
  }, [showAlert, logToAnalytics, trackError]);

  // Handle runtime errors
  const handleRuntimeError = useCallback((error, errorInfo) => {
    setError(error);
    setErrorInfo(errorInfo);

    if (showAlert) {
      Alert.alert(
        'Application Error',
        'An unexpected error occurred. The app will try to recover.'
      );
    }

    if (captureException) {
      Sentry.captureException(error, {
        extra: errorInfo,
      });
    }

    if (logToAnalytics) {
      trackError(error, 'runtime_error');
    }

    return error;
  }, [showAlert, captureException, logToAnalytics, trackError]);

  // Handle network errors
  const handleNetworkError = useCallback((error) => {
    if (showAlert) {
      Alert.alert(
        'Network Error',
        'Please check your internet connection and try again.'
      );
    }

    if (logToAnalytics) {
      trackError(error, 'network_error');
    }

    return error;
  }, [showAlert, logToAnalytics, trackError]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
    setErrorInfo(null);
  }, []);

  // Error boundary fallback UI
  const ErrorFallback = useCallback(({ resetError }) => {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Oops! Something went wrong.</Text>
        <Text style={styles.message}>{error?.message}</Text>
        <Button
          title="Try Again"
          onPress={() => {
            clearError();
            resetError();
          }}
        />
      </View>
    );
  }, [error, clearError]);

  // Initialize error tracking
  useEffect(() => {
    if (captureException) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        enableAutoSessionTracking: true,
      });
    }
  }, [captureException]);

  return {
    error,
    errorInfo,
    handleApiError,
    handleValidationError,
    handleRuntimeError,
    handleNetworkError,
    clearError,
    ErrorFallback,
  };
};

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
};

// Error boundary component
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <this.props.ErrorFallback resetError={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}

export default useError;

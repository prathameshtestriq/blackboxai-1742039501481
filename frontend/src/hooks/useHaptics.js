import { useCallback } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { Platform } from 'react-native';
import useSettings from './useSettings';

const useHaptics = (options = {}) => {
  const {
    enableVibration = true,
    defaultOptions = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    },
  } = options;

  const { settings } = useSettings();
  const isHapticsEnabled = settings?.haptics ?? true;

  // Configure haptic feedback
  const hapticOptions = {
    ...defaultOptions,
    enableVibrateFallback: Platform.OS === 'android' && enableVibration,
  };

  // Trigger haptic feedback
  const trigger = useCallback((type = 'impactLight') => {
    if (!isHapticsEnabled) return;

    try {
      ReactNativeHapticFeedback.trigger(type, hapticOptions);
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  }, [isHapticsEnabled, hapticOptions]);

  // Impact feedback
  const impact = useCallback((intensity = 'light') => {
    const types = {
      light: 'impactLight',
      medium: 'impactMedium',
      heavy: 'impactHeavy',
    };
    trigger(types[intensity] || types.light);
  }, [trigger]);

  // Selection feedback
  const selection = useCallback(() => {
    trigger('selection');
  }, [trigger]);

  // Success feedback
  const success = useCallback(() => {
    trigger('notificationSuccess');
  }, [trigger]);

  // Warning feedback
  const warning = useCallback(() => {
    trigger('notificationWarning');
  }, [trigger]);

  // Error feedback
  const error = useCallback(() => {
    trigger('notificationError');
  }, [trigger]);

  // Custom patterns
  const patterns = {
    // Button press feedback
    buttonPress: useCallback(() => {
      impact('light');
    }, [impact]),

    // Toggle switch feedback
    toggleSwitch: useCallback(() => {
      selection();
    }, [selection]),

    // Refresh feedback
    refresh: useCallback(() => {
      impact('medium');
    }, [impact]),

    // Transaction success feedback
    transactionSuccess: useCallback(() => {
      success();
    }, [success]),

    // Transaction failure feedback
    transactionFailure: useCallback(() => {
      error();
    }, [error]),

    // Price alert feedback
    priceAlert: useCallback(() => {
      warning();
    }, [warning]),

    // Match start feedback
    matchStart: useCallback(() => {
      impact('heavy');
    }, [impact]),

    // Score update feedback
    scoreUpdate: useCallback(() => {
      impact('medium');
    }, [impact]),

    // Wicket feedback
    wicket: useCallback(() => {
      const sequence = async () => {
        impact('heavy');
        await new Promise(resolve => setTimeout(resolve, 100));
        impact('medium');
      };
      sequence();
    }, [impact]),

    // Boundary feedback
    boundary: useCallback(() => {
      const sequence = async () => {
        impact('medium');
        await new Promise(resolve => setTimeout(resolve, 100));
        impact('light');
      };
      sequence();
    }, [impact]),

    // Six feedback
    six: useCallback(() => {
      const sequence = async () => {
        impact('heavy');
        await new Promise(resolve => setTimeout(resolve, 100));
        impact('medium');
        await new Promise(resolve => setTimeout(resolve, 100));
        impact('light');
      };
      sequence();
    }, [impact]),
  };

  return {
    // Basic feedback
    trigger,
    impact,
    selection,
    success,
    warning,
    error,

    // Custom patterns
    patterns,

    // State
    isEnabled: isHapticsEnabled,
  };
};

// Example usage with button interactions
export const useButtonHaptics = () => {
  const haptics = useHaptics();

  const handlePress = useCallback(() => {
    haptics.patterns.buttonPress();
  }, [haptics]);

  const handleLongPress = useCallback(() => {
    haptics.impact('medium');
  }, [haptics]);

  return {
    handlePress,
    handleLongPress,
  };
};

// Example usage with match events
export const useMatchHaptics = () => {
  const haptics = useHaptics();

  const handleMatchStart = useCallback(() => {
    haptics.patterns.matchStart();
  }, [haptics]);

  const handleScoreUpdate = useCallback(() => {
    haptics.patterns.scoreUpdate();
  }, [haptics]);

  const handleWicket = useCallback(() => {
    haptics.patterns.wicket();
  }, [haptics]);

  const handleBoundary = useCallback(() => {
    haptics.patterns.boundary();
  }, [haptics]);

  const handleSix = useCallback(() => {
    haptics.patterns.six();
  }, [haptics]);

  return {
    handleMatchStart,
    handleScoreUpdate,
    handleWicket,
    handleBoundary,
    handleSix,
  };
};

// Example usage with transactions
export const useTransactionHaptics = () => {
  const haptics = useHaptics();

  const handleSuccess = useCallback(() => {
    haptics.patterns.transactionSuccess();
  }, [haptics]);

  const handleFailure = useCallback(() => {
    haptics.patterns.transactionFailure();
  }, [haptics]);

  return {
    handleSuccess,
    handleFailure,
  };
};

export default useHaptics;

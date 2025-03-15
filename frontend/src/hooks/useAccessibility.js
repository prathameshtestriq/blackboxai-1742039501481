import { useState, useCallback, useEffect } from 'react';
import { AccessibilityInfo, Platform, findNodeHandle } from 'react-native';
import useSettings from './useSettings';
import useAnalytics from './useAnalytics';

const useAccessibility = (options = {}) => {
  const {
    announceTimeout = 1000,
    screenReaderRefreshInterval = 1000,
  } = options;

  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const [isBoldTextEnabled, setIsBoldTextEnabled] = useState(false);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  const [isReduceTransparencyEnabled, setIsReduceTransparencyEnabled] = useState(false);
  const [isInvertColorsEnabled, setIsInvertColorsEnabled] = useState(false);

  const { settings } = useSettings();
  const { trackEvent } = useAnalytics();

  // Check screen reader status
  const checkScreenReader = useCallback(async () => {
    try {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(enabled);
      return enabled;
    } catch (error) {
      console.error('Screen reader check error:', error);
      return false;
    }
  }, []);

  // Check bold text status
  const checkBoldText = useCallback(async () => {
    try {
      const enabled = await AccessibilityInfo.isBoldTextEnabled();
      setIsBoldTextEnabled(enabled);
      return enabled;
    } catch (error) {
      console.error('Bold text check error:', error);
      return false;
    }
  }, []);

  // Check reduce motion status
  const checkReduceMotion = useCallback(async () => {
    try {
      const enabled = await AccessibilityInfo.isReduceMotionEnabled();
      setIsReduceMotionEnabled(enabled);
      return enabled;
    } catch (error) {
      console.error('Reduce motion check error:', error);
      return false;
    }
  }, []);

  // Check reduce transparency status
  const checkReduceTransparency = useCallback(async () => {
    try {
      const enabled = await AccessibilityInfo.isReduceTransparencyEnabled();
      setIsReduceTransparencyEnabled(enabled);
      return enabled;
    } catch (error) {
      console.error('Reduce transparency check error:', error);
      return false;
    }
  }, []);

  // Check invert colors status
  const checkInvertColors = useCallback(async () => {
    try {
      const enabled = await AccessibilityInfo.isInvertColorsEnabled();
      setIsInvertColorsEnabled(enabled);
      return enabled;
    } catch (error) {
      console.error('Invert colors check error:', error);
      return false;
    }
  }, []);

  // Announce screen reader message
  const announce = useCallback(async (message, queueMode = 'assert') => {
    try {
      if (!isScreenReaderEnabled) return false;

      await AccessibilityInfo.announceForAccessibility(message);
      
      trackEvent('accessibility_announce', {
        message,
        queueMode,
      });

      return true;
    } catch (error) {
      console.error('Announce error:', error);
      return false;
    }
  }, [isScreenReaderEnabled, trackEvent]);

  // Focus accessibility element
  const focusElement = useCallback((ref) => {
    try {
      if (!ref.current) return false;

      const node = findNodeHandle(ref.current);
      if (node) {
        AccessibilityInfo.setAccessibilityFocus(node);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Focus element error:', error);
      return false;
    }
  }, []);

  // Get accessibility status
  const getAccessibilityStatus = useCallback(() => {
    return {
      isScreenReaderEnabled,
      isBoldTextEnabled,
      isReduceMotionEnabled,
      isReduceTransparencyEnabled,
      isInvertColorsEnabled,
    };
  }, [
    isScreenReaderEnabled,
    isBoldTextEnabled,
    isReduceMotionEnabled,
    isReduceTransparencyEnabled,
    isInvertColorsEnabled,
  ]);

  // Check if animations should be enabled
  const shouldEnableAnimations = useCallback(() => {
    return !isReduceMotionEnabled && settings.enableAnimations;
  }, [isReduceMotionEnabled, settings.enableAnimations]);

  // Get accessibility props for an element
  const getAccessibilityProps = useCallback((options = {}) => {
    const {
      label,
      role,
      hint,
      state = {},
      actions = {},
      testID,
    } = options;

    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityRole: role,
      accessibilityHint: hint,
      accessibilityState: state,
      accessibilityActions: actions,
      testID,
    };
  }, []);

  // Initialize accessibility listeners
  useEffect(() => {
    const subscriptions = [];

    // Screen reader status change
    subscriptions.push(
      AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
        setIsScreenReaderEnabled(enabled);
        trackEvent('accessibility_screen_reader_changed', { enabled });
      })
    );

    // Bold text status change
    if (Platform.OS === 'ios') {
      subscriptions.push(
        AccessibilityInfo.addEventListener('boldTextChanged', (enabled) => {
          setIsBoldTextEnabled(enabled);
          trackEvent('accessibility_bold_text_changed', { enabled });
        })
      );
    }

    // Reduce motion status change
    subscriptions.push(
      AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
        setIsReduceMotionEnabled(enabled);
        trackEvent('accessibility_reduce_motion_changed', { enabled });
      })
    );

    // Initial checks
    checkScreenReader();
    checkBoldText();
    checkReduceMotion();
    checkReduceTransparency();
    checkInvertColors();

    // Periodic refresh for screen reader status
    const refreshInterval = setInterval(() => {
      checkScreenReader();
    }, screenReaderRefreshInterval);

    return () => {
      subscriptions.forEach(subscription => subscription.remove());
      clearInterval(refreshInterval);
    };
  }, [
    trackEvent,
    checkScreenReader,
    checkBoldText,
    checkReduceMotion,
    checkReduceTransparency,
    checkInvertColors,
    screenReaderRefreshInterval,
  ]);

  return {
    // Status
    isScreenReaderEnabled,
    isBoldTextEnabled,
    isReduceMotionEnabled,
    isReduceTransparencyEnabled,
    isInvertColorsEnabled,

    // Actions
    announce,
    focusElement,
    getAccessibilityStatus,
    shouldEnableAnimations,
    getAccessibilityProps,

    // Checks
    checkScreenReader,
    checkBoldText,
    checkReduceMotion,
    checkReduceTransparency,
    checkInvertColors,
  };
};

// Example usage with screen reader announcements
export const useScreenReader = () => {
  const accessibility = useAccessibility();

  const announceScreenChange = useCallback((screenName) => {
    accessibility.announce(`Navigated to ${screenName} screen`);
  }, [accessibility]);

  const announceError = useCallback((message) => {
    accessibility.announce(`Error: ${message}`, 'alert');
  }, [accessibility]);

  const announceSuccess = useCallback((message) => {
    accessibility.announce(`Success: ${message}`);
  }, [accessibility]);

  return {
    ...accessibility,
    announceScreenChange,
    announceError,
    announceSuccess,
  };
};

// Example usage with animations
export const useAccessibleAnimations = () => {
  const accessibility = useAccessibility();

  const getAnimationConfig = useCallback((defaultConfig = {}) => {
    if (!accessibility.shouldEnableAnimations()) {
      return {
        ...defaultConfig,
        duration: 0,
      };
    }
    return defaultConfig;
  }, [accessibility]);

  return {
    ...accessibility,
    getAnimationConfig,
  };
};

export default useAccessibility;

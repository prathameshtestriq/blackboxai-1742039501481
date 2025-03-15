import { useState, useEffect, useCallback } from 'react';
import { Keyboard, Platform, KeyboardAvoidingView, Dimensions } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';

const useKeyboard = (options = {}) => {
  const {
    onShow,
    onHide,
    adjustScreenOnShow = true,
    avoidOffset = 0,
  } = options;

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const headerHeight = useHeaderHeight();
  const { height: screenHeight } = Dimensions.get('window');

  // Handle keyboard show
  const handleKeyboardShow = useCallback((event) => {
    const keyboardHeight = event.endCoordinates.height;
    setIsKeyboardVisible(true);
    setKeyboardHeight(keyboardHeight);
    if (onShow) {
      onShow(keyboardHeight);
    }
  }, [onShow]);

  // Handle keyboard hide
  const handleKeyboardHide = useCallback(() => {
    setIsKeyboardVisible(false);
    setKeyboardHeight(0);
    if (onHide) {
      onHide();
    }
  }, [onHide]);

  // Set up keyboard listeners
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      handleKeyboardShow
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      handleKeyboardHide
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [handleKeyboardShow, handleKeyboardHide]);

  // Dismiss keyboard
  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  // Get keyboard avoiding behavior based on platform
  const getKeyboardAvoidingBehavior = useCallback(() => {
    return Platform.OS === 'ios' ? 'padding' : 'height';
  }, []);

  // Calculate keyboard avoiding view style
  const getKeyboardAvoidingStyle = useCallback(() => {
    if (!adjustScreenOnShow) return {};

    const totalOffset = keyboardHeight + (avoidOffset || 0);
    const adjustedScreenHeight = screenHeight - headerHeight - totalOffset;

    return {
      height: isKeyboardVisible ? adjustedScreenHeight : '100%',
    };
  }, [
    adjustScreenOnShow,
    keyboardHeight,
    avoidOffset,
    screenHeight,
    headerHeight,
    isKeyboardVisible,
  ]);

  // KeyboardAvoidingView wrapper component
  const KeyboardAwareView = useCallback(({ children, style, ...props }) => (
    <KeyboardAvoidingView
      behavior={getKeyboardAvoidingBehavior()}
      style={[style, getKeyboardAvoidingStyle()]}
      keyboardVerticalOffset={headerHeight + avoidOffset}
      {...props}
    >
      {children}
    </KeyboardAvoidingView>
  ), [getKeyboardAvoidingBehavior, getKeyboardAvoidingStyle, headerHeight, avoidOffset]);

  // Handle input focus
  const handleInputFocus = useCallback((inputRef, scrollViewRef, offset = 0) => {
    if (!inputRef.current || !scrollViewRef.current) return;

    // Wait for keyboard animation to complete
    setTimeout(() => {
      inputRef.current.measureInWindow((x, y, width, height) => {
        const inputBottom = y + height;
        const visibleHeight = screenHeight - keyboardHeight - headerHeight;

        if (inputBottom > visibleHeight) {
          scrollViewRef.current.scrollTo({
            y: inputBottom - visibleHeight + offset,
            animated: true,
          });
        }
      });
    }, Platform.OS === 'ios' ? 250 : 100);
  }, [screenHeight, keyboardHeight, headerHeight]);

  return {
    // State
    isKeyboardVisible,
    keyboardHeight,

    // Actions
    dismissKeyboard,
    handleInputFocus,

    // Components
    KeyboardAwareView,

    // Helpers
    getKeyboardAvoidingBehavior,
    getKeyboardAvoidingStyle,
  };
};

// Example usage with form inputs
export const useFormKeyboard = (formRef, scrollViewRef) => {
  const keyboard = useKeyboard();
  const [focusedInput, setFocusedInput] = useState(null);

  const handleInputFocus = useCallback((inputName) => {
    setFocusedInput(inputName);
    if (formRef.current && scrollViewRef.current) {
      const inputRef = formRef.current[inputName];
      keyboard.handleInputFocus(inputRef, scrollViewRef);
    }
  }, [keyboard, formRef, scrollViewRef]);

  const handleInputBlur = useCallback(() => {
    setFocusedInput(null);
  }, []);

  return {
    ...keyboard,
    focusedInput,
    handleInputFocus,
    handleInputBlur,
  };
};

// Example usage with search input
export const useSearchKeyboard = (searchInputRef) => {
  const keyboard = useKeyboard({
    onShow: () => {
      // Focus search input when keyboard shows
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    },
  });

  const showSearchKeyboard = useCallback(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchInputRef]);

  const hideSearchKeyboard = useCallback(() => {
    keyboard.dismissKeyboard();
  }, [keyboard]);

  return {
    ...keyboard,
    showSearchKeyboard,
    hideSearchKeyboard,
  };
};

export default useKeyboard;

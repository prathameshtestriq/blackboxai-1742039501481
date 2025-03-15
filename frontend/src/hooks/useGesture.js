import { useRef, useState, useCallback } from 'react';
import { PanResponder, Animated } from 'react-native';

const useGesture = (options = {}) => {
  const {
    onSwipe,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    swipeThreshold = 50,
    onPinch,
    onRotate,
    onLongPress,
    longPressDelay = 500,
    enablePan = true,
    enablePinch = false,
    enableRotate = false,
  } = options;

  // Animation values
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  // Gesture states
  const [isActive, setIsActive] = useState(false);
  const initialTouches = useRef([]);
  const previousDistance = useRef(0);
  const previousAngle = useRef(0);

  // Calculate distance between two touches
  const getDistance = useCallback((touch1, touch2) => {
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Calculate angle between two touches
  const getAngle = useCallback((touch1, touch2) => {
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.atan2(dy, dx) * 180 / Math.PI;
  }, []);

  // Handle swipe gesture
  const handleSwipe = useCallback((gestureState) => {
    const { dx, dy } = gestureState;
    const isHorizontalSwipe = Math.abs(dx) > Math.abs(dy);
    
    if (Math.abs(dx) > swipeThreshold || Math.abs(dy) > swipeThreshold) {
      if (isHorizontalSwipe) {
        if (dx > 0) {
          onSwipeRight && onSwipeRight();
        } else {
          onSwipeLeft && onSwipeLeft();
        }
      } else {
        if (dy > 0) {
          onSwipeDown && onSwipeDown();
        } else {
          onSwipeUp && onSwipeUp();
        }
      }
      onSwipe && onSwipe({ dx, dy });
    }
  }, [onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, swipeThreshold]);

  // Create pan responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => enablePan,
      
      onPanResponderGrant: (evt, gestureState) => {
        setIsActive(true);
        initialTouches.current = evt.nativeEvent.touches;
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        // Handle pan gesture
        if (enablePan && touches.length === 1) {
          Animated.event(
            [null, { dx: pan.x, dy: pan.y }],
            { useNativeDriver: false }
          )(evt, gestureState);
        }

        // Handle pinch gesture
        if (enablePinch && touches.length === 2) {
          const currentDistance = getDistance(touches[0], touches[1]);
          if (previousDistance.current !== 0) {
            const newScale = (currentDistance / previousDistance.current) * scale._value;
            scale.setValue(Math.max(0.5, Math.min(newScale, 2)));
            onPinch && onPinch(newScale);
          }
          previousDistance.current = currentDistance;
        }

        // Handle rotate gesture
        if (enableRotate && touches.length === 2) {
          const currentAngle = getAngle(touches[0], touches[1]);
          if (previousAngle.current !== 0) {
            const newRotation = (currentAngle - previousAngle.current + rotate._value) % 360;
            rotate.setValue(newRotation);
            onRotate && onRotate(newRotation);
          }
          previousAngle.current = currentAngle;
        }
      },

      onPanResponderRelease: (evt, gestureState) => {
        setIsActive(false);
        pan.flattenOffset();
        previousDistance.current = 0;
        previousAngle.current = 0;

        // Handle swipe
        handleSwipe(gestureState);

        // Reset animations
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: false,
          }),
          Animated.spring(rotate, {
            toValue: 0,
            useNativeDriver: false,
          }),
        ]).start();
      },

      onPanResponderTerminate: () => {
        setIsActive(false);
        previousDistance.current = 0;
        previousAngle.current = 0;
      },

      onShouldBlockNativeResponder: () => false,
    })
  ).current;

  // Get transform style
  const getTransformStyle = useCallback(() => {
    const transform = [
      { translateX: pan.x },
      { translateY: pan.y },
    ];

    if (enablePinch) {
      transform.push({ scale: scale });
    }

    if (enableRotate) {
      transform.push({
        rotate: rotate.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        }),
      });
    }

    return { transform };
  }, [pan, scale, rotate, enablePinch, enableRotate]);

  return {
    // Pan responder
    panResponder: panResponder.panHandlers,

    // Animation values
    pan,
    scale,
    rotate,

    // Gesture state
    isActive,

    // Styles
    style: getTransformStyle(),

    // Reset animations
    reset: useCallback(() => {
      pan.setValue({ x: 0, y: 0 });
      scale.setValue(1);
      rotate.setValue(0);
    }, [pan, scale, rotate]),
  };
};

// Example usage with swipeable card
export const useSwipeableCard = (onSwipeLeft, onSwipeRight) => {
  return useGesture({
    onSwipeLeft,
    onSwipeRight,
    swipeThreshold: 120,
  });
};

// Example usage with zoomable image
export const useZoomableImage = () => {
  return useGesture({
    enablePan: true,
    enablePinch: true,
    enableRotate: true,
  });
};

export default useGesture;

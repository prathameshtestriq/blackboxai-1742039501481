import { useRef, useCallback } from 'react';
import { Animated, Easing } from 'react-native';

const useAnimation = (options = {}) => {
  const {
    initialValue = 0,
    duration = 300,
    easing = Easing.ease,
    useNativeDriver = true,
  } = options;

  // Animation value refs
  const fadeAnim = useRef(new Animated.Value(initialValue)).current;
  const scaleAnim = useRef(new Animated.Value(initialValue)).current;
  const translateYAnim = useRef(new Animated.Value(initialValue)).current;
  const translateXAnim = useRef(new Animated.Value(initialValue)).current;
  const rotateAnim = useRef(new Animated.Value(initialValue)).current;

  // Basic animations
  const fade = useCallback((toValue = 1, customDuration) => (
    Animated.timing(fadeAnim, {
      toValue,
      duration: customDuration || duration,
      easing,
      useNativeDriver,
    })
  ), [fadeAnim, duration, easing, useNativeDriver]);

  const scale = useCallback((toValue = 1, customDuration) => (
    Animated.timing(scaleAnim, {
      toValue,
      duration: customDuration || duration,
      easing,
      useNativeDriver,
    })
  ), [scaleAnim, duration, easing, useNativeDriver]);

  const translateY = useCallback((toValue = 0, customDuration) => (
    Animated.timing(translateYAnim, {
      toValue,
      duration: customDuration || duration,
      easing,
      useNativeDriver,
    })
  ), [translateYAnim, duration, easing, useNativeDriver]);

  const translateX = useCallback((toValue = 0, customDuration) => (
    Animated.timing(translateXAnim, {
      toValue,
      duration: customDuration || duration,
      easing,
      useNativeDriver,
    })
  ), [translateXAnim, duration, easing, useNativeDriver]);

  const rotate = useCallback((toValue = 1, customDuration) => (
    Animated.timing(rotateAnim, {
      toValue,
      duration: customDuration || duration,
      easing,
      useNativeDriver,
    })
  ), [rotateAnim, duration, easing, useNativeDriver]);

  // Animation combiners
  const sequence = useCallback((...animations) => (
    Animated.sequence(animations)
  ), []);

  const parallel = useCallback((...animations) => (
    Animated.parallel(animations)
  ), []);

  const spring = useCallback((animatedValue, toValue, config = {}) => (
    Animated.spring(animatedValue, {
      toValue,
      useNativeDriver,
      ...config,
    })
  ), [useNativeDriver]);

  // Animation presets
  const presets = {
    fadeIn: useCallback((customDuration) => (
      fade(1, customDuration)
    ), [fade]),

    fadeOut: useCallback((customDuration) => (
      fade(0, customDuration)
    ), [fade]),

    popIn: useCallback((customDuration) => (
      parallel(
        scale(1, customDuration),
        fade(1, customDuration)
      )
    ), [parallel, scale, fade]),

    popOut: useCallback((customDuration) => (
      parallel(
        scale(0, customDuration),
        fade(0, customDuration)
      )
    ), [parallel, scale, fade]),

    slideInBottom: useCallback((customDuration) => (
      sequence(
        translateY(100, 0),
        parallel(
          translateY(0, customDuration),
          fade(1, customDuration)
        )
      )
    ), [sequence, parallel, translateY, fade]),

    slideOutBottom: useCallback((customDuration) => (
      parallel(
        translateY(100, customDuration),
        fade(0, customDuration)
      )
    ), [parallel, translateY, fade]),

    bounce: useCallback(() => (
      spring(scaleAnim, 1, {
        tension: 40,
        friction: 3,
      })
    ), [spring, scaleAnim]),

    pulse: useCallback(() => (
      Animated.loop(
        sequence([
          spring(scaleAnim, 1.2),
          spring(scaleAnim, 1),
        ])
      )
    ), [sequence, spring, scaleAnim]),

    shake: useCallback(() => (
      sequence([
        translateX(-10),
        translateX(10),
        translateX(-10),
        translateX(10),
        translateX(0),
      ])
    ), [sequence, translateX]),
  };

  // Animation styles
  const styles = {
    fade: fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    scale: scaleAnim,
    translateY: translateYAnim,
    translateX: translateXAnim,
    rotate: rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    }),
  };

  return {
    // Animation values
    fadeAnim,
    scaleAnim,
    translateYAnim,
    translateXAnim,
    rotateAnim,

    // Basic animations
    fade,
    scale,
    translateY,
    translateX,
    rotate,

    // Animation combiners
    sequence,
    parallel,
    spring,

    // Animation presets
    presets,

    // Animation styles
    styles,
  };
};

export default useAnimation;

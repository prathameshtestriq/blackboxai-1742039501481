import { useState, useCallback, useEffect, useRef } from 'react';
import Video from 'react-native-video';
import Sound from 'react-native-sound';
import { Platform } from 'react-native';
import useSettings from './useSettings';
import useAnalytics from './useAnalytics';
import useError from './useError';

const useMedia = (options = {}) => {
  const {
    autoPlay = false,
    loop = false,
    muted = false,
    volume = 1.0,
    playInBackground = false,
    playWhenInactive = false,
    onError: onErrorCallback,
  } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState(null);

  const mediaRef = useRef(null);
  const { settings } = useSettings();
  const { trackEvent } = useAnalytics();
  const { handleError } = useError();

  // Load media
  const loadMedia = useCallback(async (source) => {
    setIsLoading(true);
    setError(null);

    try {
      if (typeof source === 'string') {
        // URL source
        mediaRef.current = new Video({
          source: { uri: source },
          autoPlay,
          loop,
          muted: muted || !settings.soundEnabled,
          volume,
          playInBackground,
          playWhenInactive,
        });
      } else {
        // Local source
        mediaRef.current = new Video({
          source: source,
          autoPlay,
          loop,
          muted: muted || !settings.soundEnabled,
          volume,
          playInBackground,
          playWhenInactive,
        });
      }

      trackEvent('media_loaded', {
        type: source.type || 'video',
        source: typeof source === 'string' ? 'remote' : 'local',
      });

      if (autoPlay) {
        await play();
      }

      return true;
    } catch (error) {
      handleError(error);
      setError(error);
      if (onErrorCallback) {
        onErrorCallback(error);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [
    autoPlay,
    loop,
    muted,
    volume,
    playInBackground,
    playWhenInactive,
    settings.soundEnabled,
    trackEvent,
    handleError,
    onErrorCallback,
  ]);

  // Play media
  const play = useCallback(async () => {
    try {
      if (!mediaRef.current) return false;

      await mediaRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);

      trackEvent('media_play', {
        currentTime,
        duration,
      });

      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [currentTime, duration, trackEvent, handleError]);

  // Pause media
  const pause = useCallback(async () => {
    try {
      if (!mediaRef.current) return false;

      await mediaRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);

      trackEvent('media_pause', {
        currentTime,
        duration,
      });

      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [currentTime, duration, trackEvent, handleError]);

  // Stop media
  const stop = useCallback(async () => {
    try {
      if (!mediaRef.current) return false;

      await mediaRef.current.stop();
      setIsPlaying(false);
      setIsPaused(true);
      setCurrentTime(0);

      trackEvent('media_stop', {
        currentTime,
        duration,
      });

      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [currentTime, duration, trackEvent, handleError]);

  // Seek to position
  const seekTo = useCallback(async (time) => {
    try {
      if (!mediaRef.current) return false;

      await mediaRef.current.seek(time);
      setCurrentTime(time);

      trackEvent('media_seek', {
        from: currentTime,
        to: time,
        duration,
      });

      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [currentTime, duration, trackEvent, handleError]);

  // Set volume
  const setVolume = useCallback(async (newVolume) => {
    try {
      if (!mediaRef.current) return false;

      await mediaRef.current.setVolume(newVolume);
      trackEvent('media_volume_change', {
        from: volume,
        to: newVolume,
      });

      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [volume, trackEvent, handleError]);

  // Handle progress
  const handleProgress = useCallback(({ currentTime: time }) => {
    setCurrentTime(time);
  }, []);

  // Handle load
  const handleLoad = useCallback(({ duration: totalDuration }) => {
    setDuration(totalDuration);
    setIsLoading(false);
  }, []);

  // Handle buffer
  const handleBuffer = useCallback(({ isBuffering }) => {
    setBuffering(isBuffering);
  }, []);

  // Handle end
  const handleEnd = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(true);
    setCurrentTime(duration);

    trackEvent('media_complete', {
      duration,
    });

    if (loop) {
      seekTo(0);
      play();
    }
  }, [duration, loop, seekTo, play, trackEvent]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (mediaRef.current) {
        stop();
        mediaRef.current = null;
      }
    };
  }, [stop]);

  return {
    // State
    isPlaying,
    isPaused,
    isLoading,
    duration,
    currentTime,
    buffering,
    error,

    // Controls
    loadMedia,
    play,
    pause,
    stop,
    seekTo,
    setVolume,

    // Event handlers
    onProgress: handleProgress,
    onLoad: handleLoad,
    onBuffer: handleBuffer,
    onEnd: handleEnd,

    // Media ref
    mediaRef,
  };
};

// Example usage with match highlights
export const useMatchHighlights = (matchId) => {
  const media = useMedia({
    autoPlay: false,
    loop: false,
    playInBackground: false,
  });

  const loadHighlights = useCallback(async () => {
    const highlightsUrl = `https://api.cricketstocks.com/matches/${matchId}/highlights`;
    return await media.loadMedia(highlightsUrl);
  }, [matchId, media]);

  return {
    ...media,
    loadHighlights,
  };
};

// Example usage with player interviews
export const usePlayerInterviews = (playerId) => {
  const media = useMedia({
    autoPlay: true,
    loop: false,
    playInBackground: true,
  });

  const loadInterview = useCallback(async () => {
    const interviewUrl = `https://api.cricketstocks.com/players/${playerId}/interview`;
    return await media.loadMedia(interviewUrl);
  }, [playerId, media]);

  return {
    ...media,
    loadInterview,
  };
};

export default useMedia;

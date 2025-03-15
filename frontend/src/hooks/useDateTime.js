import { useCallback } from 'react';
import { format, formatDistance, formatRelative, differenceInDays, parseISO } from 'date-fns';
import { useSettings } from './useSettings';

const useDateTime = (options = {}) => {
  const {
    defaultFormat = 'PP',
    defaultTimeFormat = 'p',
    defaultDateTimeFormat = 'PPp',
    relativeThreshold = 7, // days
  } = options;

  const { settings } = useSettings();
  const locale = settings?.language || 'en';

  // Format date
  const formatDate = useCallback((date, formatStr = defaultFormat) => {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, formatStr, { locale });
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  }, [defaultFormat, locale]);

  // Format time
  const formatTime = useCallback((date, formatStr = defaultTimeFormat) => {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, formatStr, { locale });
    } catch (error) {
      console.error('Time formatting error:', error);
      return '';
    }
  }, [defaultTimeFormat, locale]);

  // Format date and time
  const formatDateTime = useCallback((date, formatStr = defaultDateTimeFormat) => {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, formatStr, { locale });
    } catch (error) {
      console.error('DateTime formatting error:', error);
      return '';
    }
  }, [defaultDateTimeFormat, locale]);

  // Get relative time
  const getRelativeTime = useCallback((date, baseDate = new Date()) => {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      const baseDateObj = typeof baseDate === 'string' ? parseISO(baseDate) : baseDate;
      
      const daysDiff = Math.abs(differenceInDays(dateObj, baseDateObj));
      
      if (daysDiff > relativeThreshold) {
        return formatDate(dateObj);
      }
      
      return formatDistance(dateObj, baseDateObj, {
        addSuffix: true,
        locale,
      });
    } catch (error) {
      console.error('Relative time error:', error);
      return '';
    }
  }, [formatDate, relativeThreshold, locale]);

  // Get relative date
  const getRelativeDate = useCallback((date, baseDate = new Date()) => {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      const baseDateObj = typeof baseDate === 'string' ? parseISO(baseDate) : baseDate;
      
      return formatRelative(dateObj, baseDateObj, { locale });
    } catch (error) {
      console.error('Relative date error:', error);
      return '';
    }
  }, [locale]);

  // Format duration
  const formatDuration = useCallback((milliseconds) => {
    try {
      const seconds = Math.floor(milliseconds / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        return `${days}d ${hours % 24}h`;
      }
      if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
      }
      if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
      }
      return `${seconds}s`;
    } catch (error) {
      console.error('Duration formatting error:', error);
      return '';
    }
  }, []);

  // Format match time
  const formatMatchTime = useCallback((startTime, endTime = null) => {
    try {
      const start = typeof startTime === 'string' ? parseISO(startTime) : startTime;
      
      if (!endTime) {
        return formatDateTime(start);
      }

      const end = typeof endTime === 'string' ? parseISO(endTime) : endTime;
      const duration = end.getTime() - start.getTime();

      return {
        startTime: formatDateTime(start),
        endTime: formatDateTime(end),
        duration: formatDuration(duration),
      };
    } catch (error) {
      console.error('Match time formatting error:', error);
      return {};
    }
  }, [formatDateTime, formatDuration]);

  // Format transaction time
  const formatTransactionTime = useCallback((timestamp) => {
    try {
      const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
      const now = new Date();
      const daysDiff = Math.abs(differenceInDays(date, now));

      if (daysDiff > relativeThreshold) {
        return formatDateTime(date);
      }

      return getRelativeTime(date);
    } catch (error) {
      console.error('Transaction time formatting error:', error);
      return '';
    }
  }, [formatDateTime, getRelativeTime, relativeThreshold]);

  // Date formatting presets
  const presets = {
    shortDate: 'dd/MM/yy',
    mediumDate: 'dd MMM yyyy',
    longDate: 'dd MMMM yyyy',
    shortTime: 'HH:mm',
    mediumTime: 'HH:mm:ss',
    longTime: 'HH:mm:ss.SSS',
    shortDateTime: 'dd/MM/yy HH:mm',
    mediumDateTime: 'dd MMM yyyy HH:mm',
    longDateTime: 'dd MMMM yyyy HH:mm:ss',
    iso: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  };

  return {
    // Basic formatting
    formatDate,
    formatTime,
    formatDateTime,
    
    // Relative formatting
    getRelativeTime,
    getRelativeDate,
    
    // Special formatting
    formatDuration,
    formatMatchTime,
    formatTransactionTime,
    
    // Presets
    presets,
  };
};

// Example usage with match times
export const useMatchTimes = () => {
  const dateTime = useDateTime();

  const formatMatchSchedule = useCallback((match) => {
    const { startTime, endTime } = match;
    const formattedTime = dateTime.formatMatchTime(startTime, endTime);

    return {
      ...formattedTime,
      isLive: !endTime && new Date(startTime) <= new Date(),
      isUpcoming: new Date(startTime) > new Date(),
      isCompleted: !!endTime,
    };
  }, [dateTime]);

  return {
    formatMatchSchedule,
  };
};

export default useDateTime;

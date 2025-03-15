import { useCallback } from 'react';
import { Platform, NativeModules } from 'react-native';
import * as RNLocalize from 'react-native-localize';
import useSettings from './useSettings';
import useAnalytics from './useAnalytics';

const DEFAULT_LOCALE = 'en-US';
const DEFAULT_CURRENCY = 'INR';
const DEFAULT_TIMEZONE = 'Asia/Kolkata';

const useLocale = (options = {}) => {
  const {
    fallbackLocale = DEFAULT_LOCALE,
    fallbackCurrency = DEFAULT_CURRENCY,
    fallbackTimezone = DEFAULT_TIMEZONE,
  } = options;

  const { settings } = useSettings();
  const { trackEvent } = useAnalytics();

  // Get device locale
  const getDeviceLocale = useCallback(() => {
    try {
      const deviceLocale = RNLocalize.getLocales()[0];
      return deviceLocale?.languageTag || fallbackLocale;
    } catch (error) {
      console.error('Get device locale error:', error);
      return fallbackLocale;
    }
  }, [fallbackLocale]);

  // Get current locale
  const getCurrentLocale = useCallback(() => {
    return settings.language ? `${settings.language}-${settings.region}` : getDeviceLocale();
  }, [settings, getDeviceLocale]);

  // Get device timezone
  const getDeviceTimezone = useCallback(() => {
    try {
      return RNLocalize.getTimeZone() || fallbackTimezone;
    } catch (error) {
      console.error('Get device timezone error:', error);
      return fallbackTimezone;
    }
  }, [fallbackTimezone]);

  // Get current timezone
  const getCurrentTimezone = useCallback(() => {
    return settings.timezone || getDeviceTimezone();
  }, [settings, getDeviceTimezone]);

  // Get device currency
  const getDeviceCurrency = useCallback(() => {
    try {
      const deviceLocale = RNLocalize.getLocales()[0];
      return deviceLocale?.currencyCode || fallbackCurrency;
    } catch (error) {
      console.error('Get device currency error:', error);
      return fallbackCurrency;
    }
  }, [fallbackCurrency]);

  // Get current currency
  const getCurrentCurrency = useCallback(() => {
    return settings.currency || getDeviceCurrency();
  }, [settings, getDeviceCurrency]);

  // Format number
  const formatNumber = useCallback((number, options = {}) => {
    try {
      const locale = getCurrentLocale();
      return new Intl.NumberFormat(locale, options).format(number);
    } catch (error) {
      console.error('Format number error:', error);
      return number.toString();
    }
  }, [getCurrentLocale]);

  // Format currency
  const formatCurrency = useCallback((amount, options = {}) => {
    try {
      const locale = getCurrentLocale();
      const currency = getCurrentCurrency();
      
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        ...options,
      }).format(amount);
    } catch (error) {
      console.error('Format currency error:', error);
      return amount.toString();
    }
  }, [getCurrentLocale, getCurrentCurrency]);

  // Format percentage
  const formatPercent = useCallback((number, options = {}) => {
    try {
      const locale = getCurrentLocale();
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options,
      }).format(number / 100);
    } catch (error) {
      console.error('Format percent error:', error);
      return `${number}%`;
    }
  }, [getCurrentLocale]);

  // Format date
  const formatDate = useCallback((date, options = {}) => {
    try {
      const locale = getCurrentLocale();
      const timezone = getCurrentTimezone();
      
      return new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        ...options,
      }).format(date);
    } catch (error) {
      console.error('Format date error:', error);
      return date.toString();
    }
  }, [getCurrentLocale, getCurrentTimezone]);

  // Format time
  const formatTime = useCallback((date, options = {}) => {
    try {
      const locale = getCurrentLocale();
      const timezone = getCurrentTimezone();
      
      return new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        ...options,
      }).format(date);
    } catch (error) {
      console.error('Format time error:', error);
      return date.toString();
    }
  }, [getCurrentLocale, getCurrentTimezone]);

  // Format relative time
  const formatRelativeTime = useCallback((value, unit, options = {}) => {
    try {
      const locale = getCurrentLocale();
      return new Intl.RelativeTimeFormat(locale, {
        numeric: 'auto',
        ...options,
      }).format(value, unit);
    } catch (error) {
      console.error('Format relative time error:', error);
      return `${value} ${unit}`;
    }
  }, [getCurrentLocale]);

  // Format list
  const formatList = useCallback((items, options = {}) => {
    try {
      const locale = getCurrentLocale();
      return new Intl.ListFormat(locale, {
        style: 'long',
        type: 'conjunction',
        ...options,
      }).format(items);
    } catch (error) {
      console.error('Format list error:', error);
      return items.join(', ');
    }
  }, [getCurrentLocale]);

  // Format phone number
  const formatPhoneNumber = useCallback((number, options = {}) => {
    try {
      const locale = getCurrentLocale();
      const region = locale.split('-')[1];
      
      // Use libphonenumber-js or similar library for proper formatting
      // This is a basic example
      if (region === 'US') {
        return number.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
      }
      return number;
    } catch (error) {
      console.error('Format phone number error:', error);
      return number;
    }
  }, [getCurrentLocale]);

  // Track locale change
  const trackLocaleChange = useCallback((newLocale) => {
    trackEvent('locale_changed', {
      from: getCurrentLocale(),
      to: newLocale,
    });
  }, [getCurrentLocale, trackEvent]);

  return {
    // Current settings
    locale: getCurrentLocale(),
    timezone: getCurrentTimezone(),
    currency: getCurrentCurrency(),

    // Device info
    deviceLocale: getDeviceLocale(),
    deviceTimezone: getDeviceTimezone(),
    deviceCurrency: getDeviceCurrency(),

    // Formatters
    formatNumber,
    formatCurrency,
    formatPercent,
    formatDate,
    formatTime,
    formatRelativeTime,
    formatList,
    formatPhoneNumber,

    // Tracking
    trackLocaleChange,
  };
};

// Example usage with match times
export const useMatchTimes = () => {
  const locale = useLocale();

  const formatMatchTime = useCallback((startTime, endTime = null) => {
    const date = locale.formatDate(startTime, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    
    const time = locale.formatTime(startTime);
    
    if (!endTime) {
      return `${date} at ${time}`;
    }

    const duration = Math.floor((endTime - startTime) / (1000 * 60));
    return `${date} at ${time} (${duration} mins)`;
  }, [locale]);

  return {
    ...locale,
    formatMatchTime,
  };
};

// Example usage with player stats
export const usePlayerStats = () => {
  const locale = useLocale();

  const formatStats = useCallback((stats) => {
    return {
      average: locale.formatNumber(stats.average, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      strikeRate: locale.formatNumber(stats.strikeRate, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
      value: locale.formatCurrency(stats.value, {
        notation: 'compact',
      }),
      change: locale.formatPercent(stats.change),
    };
  }, [locale]);

  return {
    ...locale,
    formatStats,
  };
};

export default useLocale;

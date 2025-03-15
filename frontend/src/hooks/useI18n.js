import { useCallback } from 'react';
import { I18n } from 'i18n-js';
import * as RNLocalize from 'react-native-localize';
import useSettings from './useSettings';
import useStorage from './useStorage';

// Initialize i18n instance
const i18n = new I18n();

// Default language
const DEFAULT_LANGUAGE = 'en';

// Available languages
const AVAILABLE_LANGUAGES = {
  en: {
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
  },
  hi: {
    name: 'Hindi',
    nativeName: 'हिन्दी',
    direction: 'ltr',
  },
  bn: {
    name: 'Bengali',
    nativeName: 'বাংলা',
    direction: 'ltr',
  },
  ta: {
    name: 'Tamil',
    nativeName: 'தமிழ்',
    direction: 'ltr',
  },
};

const useI18n = () => {
  const { settings, saveSettings } = useSettings();
  const storage = useStorage('language');

  // Get device locale
  const getDeviceLocale = useCallback(() => {
    const locales = RNLocalize.getLocales();
    if (locales.length > 0) {
      return locales[0].languageCode;
    }
    return DEFAULT_LANGUAGE;
  }, []);

  // Load translations
  const loadTranslations = useCallback(async (language) => {
    try {
      const translations = await import(`../translations/${language}.json`);
      i18n.translations[language] = translations.default;
      return true;
    } catch (error) {
      console.error(`Failed to load translations for ${language}:`, error);
      return false;
    }
  }, []);

  // Set language
  const setLanguage = useCallback(async (language) => {
    try {
      if (!AVAILABLE_LANGUAGES[language]) {
        throw new Error(`Language ${language} is not supported`);
      }

      const loaded = await loadTranslations(language);
      if (!loaded) {
        throw new Error(`Failed to load translations for ${language}`);
      }

      i18n.locale = language;
      await storage.setValue(language);
      await saveSettings({ ...settings, language });

      return true;
    } catch (error) {
      console.error('Set language error:', error);
      return false;
    }
  }, [settings, saveSettings, storage, loadTranslations]);

  // Initialize i18n
  const initialize = useCallback(async () => {
    try {
      // Get stored or device language
      const storedLanguage = await storage.value;
      const deviceLanguage = getDeviceLocale();
      const language = storedLanguage || deviceLanguage;

      // Load translations and set language
      await setLanguage(language);

      // Set fallbacks
      i18n.enableFallback = true;
      i18n.defaultLocale = DEFAULT_LANGUAGE;

      return true;
    } catch (error) {
      console.error('I18n initialization error:', error);
      return false;
    }
  }, [storage, getDeviceLocale, setLanguage]);

  // Translate text
  const translate = useCallback((key, options = {}) => {
    try {
      return i18n.t(key, options);
    } catch (error) {
      console.error('Translation error:', error);
      return key;
    }
  }, []);

  // Format number
  const formatNumber = useCallback((number, options = {}) => {
    try {
      return new Intl.NumberFormat(i18n.locale, options).format(number);
    } catch (error) {
      console.error('Number formatting error:', error);
      return number.toString();
    }
  }, []);

  // Format currency
  const formatCurrency = useCallback((amount, currency = 'INR') => {
    try {
      return new Intl.NumberFormat(i18n.locale, {
        style: 'currency',
        currency,
      }).format(amount);
    } catch (error) {
      console.error('Currency formatting error:', error);
      return amount.toString();
    }
  }, []);

  // Format percentage
  const formatPercent = useCallback((number, decimals = 2) => {
    try {
      return new Intl.NumberFormat(i18n.locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(number / 100);
    } catch (error) {
      console.error('Percentage formatting error:', error);
      return `${number}%`;
    }
  }, []);

  // Get text direction
  const getDirection = useCallback(() => {
    return AVAILABLE_LANGUAGES[i18n.locale]?.direction || 'ltr';
  }, []);

  // Check if current locale is RTL
  const isRTL = useCallback(() => {
    return getDirection() === 'rtl';
  }, [getDirection]);

  return {
    // Core functionality
    translate,
    setLanguage,
    initialize,

    // Formatting
    formatNumber,
    formatCurrency,
    formatPercent,

    // Language info
    currentLanguage: i18n.locale,
    defaultLanguage: DEFAULT_LANGUAGE,
    availableLanguages: AVAILABLE_LANGUAGES,
    
    // Direction
    getDirection,
    isRTL,
  };
};

// Example usage with number formatting
export const useNumberFormat = () => {
  const { formatNumber, formatCurrency, formatPercent } = useI18n();

  const formatStockPrice = useCallback((price) => {
    return formatCurrency(price);
  }, [formatCurrency]);

  const formatPriceChange = useCallback((change) => {
    return formatPercent(change);
  }, [formatPercent]);

  const formatVolume = useCallback((volume) => {
    return formatNumber(volume, {
      notation: 'compact',
      maximumFractionDigits: 1,
    });
  }, [formatNumber]);

  return {
    formatStockPrice,
    formatPriceChange,
    formatVolume,
  };
};

export default useI18n;

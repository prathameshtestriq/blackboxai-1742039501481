import { useCallback } from 'react';
import analytics from '@react-native-firebase/analytics';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

const useAnalytics = () => {
  const user = useSelector((state) => state.auth.user);

  // Track screen view
  const trackScreen = useCallback(async (screenName, screenClass) => {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (error) {
      console.error('Analytics error (trackScreen):', error);
    }
  }, []);

  // Track user action/event
  const trackEvent = useCallback(async (eventName, params = {}) => {
    try {
      await analytics().logEvent(eventName, {
        ...params,
        platform: Platform.OS,
        userId: user?._id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Analytics error (trackEvent):', error);
    }
  }, [user]);

  // Track user properties
  const setUserProperties = useCallback(async (properties) => {
    try {
      Object.entries(properties).forEach(async ([key, value]) => {
        await analytics().setUserProperty(key, value?.toString());
      });
    } catch (error) {
      console.error('Analytics error (setUserProperties):', error);
    }
  }, []);

  // Track authentication events
  const trackAuth = useCallback(async (method, success) => {
    try {
      await analytics().logEvent(success ? 'login_success' : 'login_failure', {
        method,
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Analytics error (trackAuth):', error);
    }
  }, []);

  // Track transactions
  const trackTransaction = useCallback(async (transaction) => {
    try {
      await analytics().logPurchase({
        transaction_id: transaction._id,
        value: transaction.amount,
        currency: 'INR',
        items: [{
          item_id: transaction.details?.player?._id,
          item_name: transaction.details?.player?.name,
          item_category: 'player_stock',
          quantity: transaction.details?.quantity || 1,
          price: transaction.details?.pricePerUnit,
        }],
      });
    } catch (error) {
      console.error('Analytics error (trackTransaction):', error);
    }
  }, []);

  // Track errors
  const trackError = useCallback(async (error, context) => {
    try {
      await analytics().logEvent('app_error', {
        error_message: error.message,
        error_code: error.code,
        error_context: context,
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Analytics error (trackError):', err);
    }
  }, []);

  // Predefined analytics events
  const Events = {
    // Authentication events
    LOGIN: 'login',
    SIGNUP: 'signup',
    LOGOUT: 'logout',
    PASSWORD_RESET: 'password_reset',

    // Navigation events
    VIEW_SCREEN: 'view_screen',
    NAVIGATION: 'navigation',

    // Match events
    VIEW_MATCH: 'view_match',
    FOLLOW_MATCH: 'follow_match',
    UNFOLLOW_MATCH: 'unfollow_match',

    // Player events
    VIEW_PLAYER: 'view_player',
    ADD_TO_WATCHLIST: 'add_to_watchlist',
    REMOVE_FROM_WATCHLIST: 'remove_from_watchlist',

    // Trading events
    BUY_STOCK: 'buy_stock',
    SELL_STOCK: 'sell_stock',
    SET_PRICE_ALERT: 'set_price_alert',

    // Wallet events
    ADD_MONEY: 'add_money',
    WITHDRAW_MONEY: 'withdraw_money',

    // User events
    UPDATE_PROFILE: 'update_profile',
    CHANGE_SETTINGS: 'change_settings',
    ENABLE_NOTIFICATIONS: 'enable_notifications',
    DISABLE_NOTIFICATIONS: 'disable_notifications',

    // Error events
    APP_ERROR: 'app_error',
    API_ERROR: 'api_error',
    VALIDATION_ERROR: 'validation_error',
  };

  // Common analytics parameters
  const Params = {
    // Screen parameters
    SCREEN_NAME: 'screen_name',
    SCREEN_CLASS: 'screen_class',
    PREVIOUS_SCREEN: 'previous_screen',

    // User parameters
    USER_ID: 'user_id',
    USER_TYPE: 'user_type',
    USER_LEVEL: 'user_level',

    // Content parameters
    CONTENT_TYPE: 'content_type',
    CONTENT_ID: 'content_id',
    ITEM_ID: 'item_id',
    ITEM_NAME: 'item_name',
    ITEM_CATEGORY: 'item_category',

    // Action parameters
    ACTION_TYPE: 'action_type',
    ACTION_TARGET: 'action_target',
    ACTION_RESULT: 'action_result',

    // Transaction parameters
    TRANSACTION_ID: 'transaction_id',
    TRANSACTION_TYPE: 'transaction_type',
    AMOUNT: 'amount',
    CURRENCY: 'currency',

    // Technical parameters
    PLATFORM: 'platform',
    APP_VERSION: 'app_version',
    DEVICE_TYPE: 'device_type',
    OS_VERSION: 'os_version',
  };

  return {
    trackScreen,
    trackEvent,
    setUserProperties,
    trackAuth,
    trackTransaction,
    trackError,
    Events,
    Params,
  };
};

export default useAnalytics;

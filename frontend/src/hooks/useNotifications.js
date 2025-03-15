import { useEffect, useCallback, useState } from 'react';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import { useDispatch } from 'react-redux';
import useSettings from './useSettings';
import useApi from './useApi';
import { updateNotificationToken } from '../store/slices/userSlice';

const useNotifications = () => {
  const dispatch = useDispatch();
  const { settings } = useSettings();
  const [token, setToken] = useState(null);
  const api = useApi('/notifications/token');

  // Initialize notifications
  const initialize = useCallback(async () => {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('User notification permissions denied');
        return false;
      }
    }

    // Configure local notifications
    PushNotification.configure({
      onNotification: function (notification) {
        console.log('LOCAL NOTIFICATION:', notification);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    return true;
  }, []);

  // Get FCM token
  const getToken = useCallback(async () => {
    try {
      const fcmToken = await messaging().getToken();
      setToken(fcmToken);
      
      // Update token on server
      await api.post({ token: fcmToken });
      dispatch(updateNotificationToken(fcmToken));
      
      return fcmToken;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }, [api, dispatch]);

  // Handle incoming notifications when app is in foreground
  const handleForegroundMessage = useCallback((remoteMessage) => {
    if (!settings.notifications.enabled) return;

    const { title, body, data } = remoteMessage.notification;
    
    // Check notification preferences
    if (data.type && !settings.notifications.preferences[data.type]) return;

    PushNotification.localNotification({
      title,
      message: body,
      playSound: true,
      soundName: 'default',
      userInteraction: false,
      data: data,
    });
  }, [settings]);

  // Handle notification tap
  const handleNotificationTap = useCallback((remoteMessage) => {
    const { data } = remoteMessage;

    // Navigate based on notification type
    switch (data.type) {
      case 'match':
        navigation.navigate('Matches', {
          screen: 'MatchDetails',
          params: { matchId: data.matchId },
        });
        break;
      case 'player':
        navigation.navigate('Players', {
          screen: 'PlayerDetails',
          params: { playerId: data.playerId },
        });
        break;
      case 'transaction':
        navigation.navigate('Wallet', {
          screen: 'TransactionDetails',
          params: { transactionId: data.transactionId },
        });
        break;
      // Add more cases as needed
    }
  }, []);

  // Schedule local notification
  const scheduleNotification = useCallback(({
    title,
    message,
    data = {},
    date = new Date(Date.now() + 1000), // Default to 1 second from now
  }) => {
    if (!settings.notifications.enabled) return;

    PushNotification.localNotificationSchedule({
      title,
      message,
      date,
      allowWhileIdle: true,
      playSound: true,
      soundName: 'default',
      userInteraction: false,
      data,
    });
  }, [settings]);

  // Cancel all notifications
  const cancelAllNotifications = useCallback(() => {
    PushNotification.cancelAllLocalNotifications();
  }, []);

  // Cancel specific notification
  const cancelNotification = useCallback((id) => {
    PushNotification.cancelLocalNotifications({ id });
  }, []);

  // Set up notification listeners
  useEffect(() => {
    const initializeNotifications = async () => {
      const enabled = await initialize();
      if (!enabled) return;

      await getToken();

      // Listen for FCM token refresh
      const tokenRefreshUnsubscribe = messaging().onTokenRefresh((fcmToken) => {
        setToken(fcmToken);
        api.post({ token: fcmToken });
        dispatch(updateNotificationToken(fcmToken));
      });

      // Handle foreground messages
      const foregroundUnsubscribe = messaging().onMessage(handleForegroundMessage);

      // Handle notification tap when app is in background
      const backgroundUnsubscribe = messaging().onNotificationOpenedApp(handleNotificationTap);

      // Handle notification tap when app is closed
      messaging()
        .getInitialNotification()
        .then((remoteMessage) => {
          if (remoteMessage) {
            handleNotificationTap(remoteMessage);
          }
        });

      return () => {
        tokenRefreshUnsubscribe();
        foregroundUnsubscribe();
        backgroundUnsubscribe();
      };
    };

    initializeNotifications();
  }, [initialize, getToken, handleForegroundMessage, handleNotificationTap]);

  return {
    token,
    initialize,
    getToken,
    scheduleNotification,
    cancelAllNotifications,
    cancelNotification,
  };
};

// Example notification templates
export const NotificationTemplates = {
  MATCH_START: {
    title: 'Match Starting Soon',
    message: (match) => `${match.teams[0].name} vs ${match.teams[1].name} starts in 15 minutes!`,
  },
  PRICE_ALERT: {
    title: 'Price Alert',
    message: (player, price, change) =>
      `${player.name}'s stock ${change > 0 ? 'rose to' : 'fell to'} ₹${price} (${change}%)`,
  },
  TRANSACTION_SUCCESS: {
    title: 'Transaction Successful',
    message: (type, amount) => `Your ${type} of ₹${amount} was successful`,
  },
  STOCK_UPDATE: {
    title: 'Portfolio Update',
    message: (holding, change) =>
      `Your holding in ${holding.player.name} has ${change > 0 ? 'gained' : 'lost'} ${Math.abs(change)}%`,
  },
};

export default useNotifications;

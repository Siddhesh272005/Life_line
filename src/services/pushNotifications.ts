import { PermissionsAndroid, Platform } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  hasPermission as hasMessagingPermission,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  requestPermission as requestMessagingPermission,
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { apiDelete, apiPut } from '../api/client';

let currentToken: string | null = null;
const messaging = getMessaging(getApp());

const ensureAndroidChannel = async () => {
  if (Platform.OS !== 'android') return;
  await notifee.createChannel({
    id: 'csp_default',
    name: 'CSP Notifications',
    importance: AndroidImportance.HIGH,
  });
};

const requestAndroidNotificationPermission = async () => {
  if (Platform.OS !== 'android') return true;
  if (Platform.Version < 33) return true;
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
};

const hasNotificationPermission = async () => {
  const status = await hasMessagingPermission(messaging);
  return (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  );
};

const requestNotificationPermission = async () => {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return false;
  const status = await requestMessagingPermission(messaging);
  return (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  );
};

export const registerDeviceForPush = async () => {
  await ensureAndroidChannel();
  const androidGranted = await requestAndroidNotificationPermission();
  if (!androidGranted) return;
  const granted =
    (await hasNotificationPermission()) || (await requestNotificationPermission());
  if (!granted) return;

  await registerDeviceForRemoteMessages(messaging);
  const token = await getToken(messaging);
  if (!token) return;

  currentToken = token;
  await apiPut('/api/users/push-token', { token });
};

export const unregisterDeviceForPush = async () => {
  const token = currentToken || (await getToken(messaging).catch(() => null));
  if (!token) return;

  await apiDelete(`/api/users/push-token?token=${encodeURIComponent(token)}`);
  currentToken = null;
};

type SetupOptions = {
  onNotificationOpen?: () => void;
  onNotificationReceived?: () => void;
};

export const setupPushListeners = async ({
  onNotificationOpen,
  onNotificationReceived,
}: SetupOptions = {}) => {
  await ensureAndroidChannel();

  const unsubscribeMessage = onMessage(messaging, async (remoteMessage: any) => {
    const title = remoteMessage.notification?.title || 'Notification';
    const body = remoteMessage.notification?.body || '';
    await notifee.displayNotification({
      title,
      body,
      data: remoteMessage.data,
      android: {
        channelId: 'csp_default',
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
      },
    });
    if (onNotificationReceived) {
      onNotificationReceived();
    }
  });

  const unsubscribeOpenedApp = onNotificationOpenedApp(messaging, () => {
    if (onNotificationOpen) onNotificationOpen();
  });

  const initialRemoteMessage = await getInitialNotification(messaging);
  if (initialRemoteMessage && onNotificationOpen) {
    onNotificationOpen();
  }

  const initialNotifeeNotification = await notifee.getInitialNotification();
  if (initialNotifeeNotification && onNotificationOpen) {
    onNotificationOpen();
  }

  const unsubscribeForegroundEvents = notifee.onForegroundEvent(({ type }: any) => {
    if (type === EventType.PRESS && onNotificationOpen) {
      onNotificationOpen();
    }
  });

  const unsubscribeRefresh = onTokenRefresh(messaging, async (token: string) => {
    currentToken = token;
    try {
      await apiPut('/api/users/push-token', { token });
    } catch {}
  });

  return () => {
    unsubscribeMessage();
    unsubscribeOpenedApp();
    unsubscribeForegroundEvents();
    unsubscribeRefresh();
  };
};

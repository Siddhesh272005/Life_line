import { PermissionsAndroid, Platform } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import {
  AuthorizationStatus,
  getMessaging,
  hasPermission as hasMessagingPermission,
} from '@react-native-firebase/messaging';
import { registerDeviceForPush } from './pushNotifications';

export type PermissionState = 'granted' | 'denied' | 'unavailable';

const messaging = getMessaging(getApp());

export const getNotificationPermissionState = async (): Promise<PermissionState> => {
  if (Platform.OS === 'android' && Platform.Version < 33) {
    return 'granted';
  }
  const status = await hasMessagingPermission(messaging);
  if (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  ) {
    return 'granted';
  }
  return 'denied';
};

export const requestNotificationPermission = async (): Promise<PermissionState> => {
  let syncError: Error | null = null;
  try {
    await registerDeviceForPush();
  } catch (error) {
    syncError = error instanceof Error ? error : new Error('Unable to complete notification setup.');
  }
  const state = await getNotificationPermissionState();
  if (syncError && state === 'granted') {
    throw new Error(
      'Notification permission granted, but server sync failed. Check internet and try again.'
    );
  }
  if (syncError) {
    throw syncError;
  }
  return state;
};

export const getLocationPermissionState = async (): Promise<PermissionState> => {
  if (Platform.OS !== 'android') return 'unavailable';
  const granted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
  return granted ? 'granted' : 'denied';
};

export const requestLocationPermission = async (): Promise<PermissionState> => {
  if (Platform.OS !== 'android') return 'unavailable';
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
  return result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
};

export const getFilePermissionState = async (): Promise<PermissionState> => {
  // Document picker uses SAF on modern Android; runtime storage permission is not required.
  if (Platform.OS !== 'android') return 'unavailable';
  if (Platform.Version >= 33) return 'granted';
  const granted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
  );
  return granted ? 'granted' : 'denied';
};

export const requestFilePermission = async (): Promise<PermissionState> => {
  if (Platform.OS !== 'android') return 'unavailable';
  if (Platform.Version >= 33) return 'granted';
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
  );
  return result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
};

import 'react-native-gesture-handler';
import { AppRegistry, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import App from './src/App';
import { name as appName } from './app.json';

LogBox.ignoreLogs([
  'InteractionManager has been deprecated and will be removed in a future release.',
]);

const Root = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <App />
  </GestureHandlerRootView>
);

const messaging = getMessaging(getApp());
const CHANNEL_ID = 'csp_default';
const CHANNEL_NAME = 'CSP Notifications';

setBackgroundMessageHandler(messaging, async remoteMessage => {
  try {
    const existing = await notifee.getChannel(CHANNEL_ID);
    if (existing && !existing.sound) {
      await notifee.deleteChannel(CHANNEL_ID);
    }
  } catch {}

  await notifee.createChannel({
    id: CHANNEL_ID,
    name: CHANNEL_NAME,
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    lights: true,
  });

  await notifee.displayNotification({
    title: remoteMessage.notification?.title || 'Notification',
    body: remoteMessage.notification?.body || '',
    data: remoteMessage.data,
    android: {
      channelId: CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default' },
    },
  });
});

AppRegistry.registerComponent(appName, () => Root);

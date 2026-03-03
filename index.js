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

setBackgroundMessageHandler(messaging, async remoteMessage => {
  await notifee.createChannel({
    id: 'csp_default',
    name: 'CSP Notifications',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title: remoteMessage.notification?.title || 'Notification',
    body: remoteMessage.notification?.body || '',
    data: remoteMessage.data,
    android: {
      channelId: 'csp_default',
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default' },
    },
  });
});

AppRegistry.registerComponent(appName, () => Root);

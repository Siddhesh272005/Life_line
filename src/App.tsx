import React, {useEffect} from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import {StatusBar} from 'react-native';
import { NavigationContainer, RouteProp, useNavigation, DrawerActions, createNavigationContainerRef } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator,  DrawerNavigationProp } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { enableScreens } from 'react-native-screens';
import Ionicons from '@react-native-vector-icons/ionicons';
import ImmersiveMode from 'react-native-immersive-mode';

import Splashscreen from './introduction_pages/Splashscreen';
import Intro1 from './introduction_pages/Intro1';
import Intro2 from './introduction_pages/Intro2';
import Intro3 from './introduction_pages/Intro3';
import Domain from './introduction_pages/Domain';

import Login from './credentials_pages/Login';
import Signup from './credentials_pages/Signup';
import Forget from './credentials_pages/Forget';
import Newpass from './credentials_pages/Newpass';
import Details from './credentials_pages/Details';


import Home from './Bottom_pages/Home';
import Request from './Bottom_pages/Request';
import Search from './Bottom_pages/Search';
import Notification from './Bottom_pages/Notification';

import Profile from './Drawer_pages/Profile';
import Rewards from './Drawer_pages/Rewards';
import AboutUs from './Drawer_pages/Aboutus';
import Logout from './Drawer_pages/logout';
import UploadCertificates from './Drawer_pages/UploadCertificates';
import EarnCertificates from './Drawer_pages/EarnCertificates';
import MyRequests from './Drawer_pages/MyRequests';
import MyDonations from './Drawer_pages/MyDonations';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { registerDeviceForPush, setupPushListeners } from './services/pushNotifications';
import { openNotificationsScreen, setOpenNotificationsHandler } from './services/pushNavigation';
import PostLoginPermissionModal from './componenets/PostLoginPermissionModal';
import {
  getFilePermissionState,
  getLocationPermissionState,
  getNotificationPermissionState,
} from './services/appPermissions';
import { getPersistedValue, setPersistedValue } from './context/AuthContext';


import { RootStackParamList, DrawerParamList, BottomTabParamList } from './types';

enableScreens(false);

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

type AppDrawerRouteProp = RouteProp<RootStackParamList, 'AppDrawer'>;
type BottomTabRouteProp = RouteProp<DrawerParamList, 'BottomTabs'>;

type AppDrawerProps = {
  route: AppDrawerRouteProp;
};

type BottomTabsProps = {
  route: BottomTabRouteProp;
};



function CustomHeaderLeft() {
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();

  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      >
        <Ionicons name="menu-outline" size={28} color="#000" />
      </TouchableOpacity>
      <View style={styles.logoRow}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
        <Text style={styles.logoText}>Life Line</Text>
      </View>      

    </View>
  );
}



function BottomTabs({ route }: BottomTabsProps) {
  const { userType } = route.params;
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home-outline';

          if (route.name === 'Home') iconName = 'home-outline';
          if (route.name === 'Request') iconName = 'document-outline';
          if (route.name === 'Search')iconName ='search-outline';
          if (route.name === 'Notification') iconName ='notifications-outline'
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,              // Android shadow
        },

        tabBarBackground: () => null,

        tabBarActiveTintColor: '#C11717',
        tabBarInactiveTintColor: '#999',
        tabBarBadge:
          route.name === 'Notification' && unreadCount > 0
            ? unreadCount > 99
              ? '99+'
              : unreadCount
            : undefined,
      })}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        initialParams={{ userType }}
      />
      <Tab.Screen name="Request" component={Request}/>
      <Tab.Screen name='Search' component={Search}/>
      <Tab.Screen name='Notification' component={Notification} initialParams={{userType}}/>
    </Tab.Navigator>
  );
}




function AppDrawer({route}: AppDrawerProps) {

  const { userType } = route.params;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <Logout {...props} />}
      screenOptions={{
        headerShown: true,
        headerLeft: () => <CustomHeaderLeft />,
        drawerActiveTintColor: '#C11717',

        drawerStyle: {
          width: 280,
          backgroundColor: '#FFFFFF',
          
        },

        headerStyle:{
          elevation: 0,
        },

        headerTitle: '',
      }}
    >
      <Drawer.Screen
        name="BottomTabs"
        component={BottomTabs}
        initialParams={{ userType }}
        options={{
          drawerItemStyle: { height: 0 }, // hides from drawer
          title: '',                      // no label
        }}
      />

      <Drawer.Screen
        name="Profile"
        component={Profile}
        initialParams={{userType}}
        options={{
          drawerIcon: ({color, size}) => (
            <Ionicons name="person-outline" size={size} color={color}/>
          ),
        }}
      />
      {(userType === 'hospital' || userType === 'ngo') && (
        <Drawer.Screen
          name="UploadCertificates"
          component={UploadCertificates}
          initialParams={{ userType }}
          options={{
            title: 'Upload Certificates',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="cloud-upload-outline" size={size} color={color} />
            ),
          }}
        />
      )}
      {userType === 'civilian' && (
        <Drawer.Screen
          name="EarnCertificates"
          component={EarnCertificates}
          initialParams={{ userType }}
          options={{
            title: 'My Certificates',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="ribbon-outline" size={size} color={color} />
            ),
          }}
        />
      )}
      {userType === 'civilian' && (
        <Drawer.Screen
          name="MyDonations"
          component={MyDonations}
          options={{
            title: 'My Donations',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="water-outline" size={size} color={color} />
            ),
          }}
        />
      )}
      <Drawer.Screen
        name="Rewards"
        component={Rewards}
        initialParams={{userType}}
        options={{
          drawerIcon: ({color, size}) => (
            <Ionicons name="trophy-outline" size={size} color={color}/>
          ),
        }}
      />
      <Drawer.Screen
        name="MyRequests"
        component={MyRequests}
        options={{
          title: 'My Requests',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Aboutus"
        component={AboutUs}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="information-circle-outline" size={size} color={color} />
          ),
        }}
      />

    </Drawer.Navigator>
  );
}

function AppNavigation() {
  const { fetchNotifications } = useNotifications();
  const { token, user } = useAuth();
  const navigationRef = React.useRef(createNavigationContainerRef<RootStackParamList>());
  const [permissionVisible, setPermissionVisible] = React.useState(false);
  const permissionDoneKey = user?.id ? `@csp_permissions_done_${String(user.id)}` : '';

  useEffect(() => {
    setOpenNotificationsHandler(() => {
      const ref = navigationRef.current;
      if (!ref.isReady()) return;
      ref.navigate('AppDrawer', {
        screen: 'BottomTabs',
        params: {
          screen: 'Notification',
        },
      } as any);
    });
    return () => {
      setOpenNotificationsHandler(null);
    };
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    setupPushListeners({
      onNotificationOpen: openNotificationsScreen,
      onNotificationReceived: () => {
        void fetchNotifications().catch(() => {});
      },
    })
      .then(unsubscribe => {
        cleanup = unsubscribe;
      })
      .catch(() => {});
    return () => {
      if (cleanup) cleanup();
    };
  }, [fetchNotifications]);

  useEffect(() => {
    const userId = user?.id ? String(user.id) : '';
    if (!token || !userId || !permissionDoneKey) {
      setPermissionVisible(false);
      return;
    }
    let cancelled = false;
    const check = async () => {
      try {
        const done = await getPersistedValue(permissionDoneKey);
        if (done === '1') {
          if (!cancelled) setPermissionVisible(false);
          return;
        }
        const [noti, loc, file] = await Promise.all([
          getNotificationPermissionState(),
          getLocationPermissionState(),
          getFilePermissionState(),
        ]);
        const ready =
          noti === 'granted' &&
          (loc === 'granted' || loc === 'unavailable') &&
          (file === 'granted' || file === 'unavailable');
        if (ready) {
          await setPersistedValue(permissionDoneKey, '1');
          if (!cancelled) setPermissionVisible(false);
          return;
        }
        if (!cancelled) setPermissionVisible(true);
      } catch {
        if (!cancelled) setPermissionVisible(true);
      }
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, [token, user?.id, permissionDoneKey]);

  useEffect(() => {
    if (!token) return;
    void registerDeviceForPush().catch(() => {});
  }, [token]);

  return (
    <>
      <NavigationContainer ref={navigationRef.current}>
        <Stack.Navigator initialRouteName="Splashscreen" screenOptions={{ headerShown: false, animation: 'none' }}>
          <Stack.Screen name="Splashscreen" component={Splashscreen} />
          <Stack.Screen name="Intro1" component={Intro1} />
          <Stack.Screen name="Intro2" component= {Intro2}/>
          <Stack.Screen name="Intro3" component={Intro3}/>
          <Stack.Screen name="Domain" component={Domain}/>

          <Stack.Screen name="Login" component={Login}/>
          <Stack.Screen name="Signup" component={Signup}/>
          <Stack.Screen name="Forget" component={Forget}/>
          <Stack.Screen name="Newpass" component={Newpass}/>
          <Stack.Screen name="Details" component={Details}/>

          <Stack.Screen name="AppDrawer" component={AppDrawer} />

        </Stack.Navigator>
      </NavigationContainer>
      <PostLoginPermissionModal
        visible={permissionVisible}
        onDone={(completed) => {
          if (completed && permissionDoneKey) {
            void setPersistedValue(permissionDoneKey, '1');
          }
          setPermissionVisible(false);
        }}
      />
    </>
  );
}



export default function App() {
  useEffect(() => {
    ImmersiveMode.setBarColor('#FFFFFF');
    ImmersiveMode.setBarStyle('Dark');
  }, []);

  return (
    <>
      {/* 🔹 Global StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"   // Android only
        translucent={false}
      />
      <AuthProvider>
        <NotificationProvider>
          <AppNavigation />
        </NotificationProvider>
      </AuthProvider>
    </>
  );
}




const styles = StyleSheet.create({

  header: {
    
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    height: 36,
    width: 36,
  },

  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#C11717',
    marginLeft: 6,
  },

  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  image: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: 10,
  },
  text: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '600',
  },
});

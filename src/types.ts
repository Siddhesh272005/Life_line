// types.ts or navigationTypes.ts
export type UserType = 'hospital' | 'civilian' | 'ngo';

export type RootStackParamList = {
  Splashscreen: undefined;
  Intro1: undefined;
  Intro2: undefined;
  Intro3: undefined;
  Domain: undefined;

  Login:   { userType: 'hospital' | 'civilian' | 'ngo' };
  Signup:  { userType: 'hospital' | 'civilian' | 'ngo' };
  Forget:  { userType: 'hospital' | 'civilian' | 'ngo' };
  Newpass: { userType: 'hospital' | 'civilian' | 'ngo' };
  Details: { userType: 'hospital' | 'civilian' | 'ngo'; signupEmail?: string; signupPassword?: string };

  AppDrawer: { userType: UserType };
};

export type DrawerParamList = {
  BottomTabs: { userType: UserType };
  Profile: {userType: UserType}
  Rewards: {userType: UserType};
  UploadCertificates: {userType: UserType};
  EarnCertificates: {userType: UserType};
  MyRequests: undefined;
  MyDonations: undefined;
  Aboutus: undefined;
};

export type BottomTabParamList = {
  Home: { userType: 'hospital' | 'civilian' | 'ngo' };
  Request: { request?: any } | undefined;
  Search: undefined;
  Notification: { userType: 'hospital' |'civilian'|'ngo'}
}


// ✅ Correct imports
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';


// ✅ Correct navigation prop types
export type AppNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

export type AppDrawerNavigationProp =
  DrawerNavigationProp<DrawerParamList>;

export type AppBottomTabNavigationProp = 
  BottomTabNavigationProp<BottomTabParamList>;

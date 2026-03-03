import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppNavigationProp } from '../types'; // adjust path if needed
import { useAuth } from '../context/AuthContext';

export default function Logout(props: any) {
  const navigation = useNavigation<AppNavigationProp>();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // 🔐 Clear auth storage here (later)
            // AsyncStorage.clear();

            logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Domain' }],
            });
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Normal drawer items */}
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* 🔴 Logout fixed at bottom */}
      <View style={[styles.logoutContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#C11717" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoutContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#E5E5E5',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#C11717',
  },
});

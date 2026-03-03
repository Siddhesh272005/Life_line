import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../types';
import { useAuth } from '../context/AuthContext';

export default function Splashscreen() {
  const navigation = useNavigation<AppNavigationProp>();
  const { token, user, isHydrated, hasLoggedInBefore } = useAuth();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Fade and slide animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

  }, [fadeAnim, translateY]);

  useEffect(() => {
    if (!isHydrated) return;
    const timer = setTimeout(() => {
      if (token && user?.role) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'AppDrawer', params: { userType: user.role } }],
        });
        return;
      }
      navigation.replace(hasLoggedInBefore ? 'Domain' : 'Intro1');
    }, 3500);

    return () => clearTimeout(timer);
  }, [navigation, isHydrated, token, user?.role, hasLoggedInBefore]);

  return (
    <SafeAreaView style={styles.background}>
      <View style={styles.container}>
        <Animated.Image
          source={require('../../assets/logo.png')}
          style={[
            styles.logo,
            {
              opacity: fadeAnim,
              transform: [{ translateY }],
            },
          ]}
          resizeMode="contain"
        />
        <Animated.Text
          style={[
            styles.txt,
            {
              opacity: fadeAnim,
              transform: [{ translateY }],
            },
          ]}
        >
          Welcome to <Text style={styles.highlight}>Life Line</Text>
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    transform: [{ translateY: -40 }],
  },
  logo: {
    height: 250,
    width: 250,
    marginBottom: 20,
  },
  txt: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  highlight: {
    color: '#E63946',
  },
});

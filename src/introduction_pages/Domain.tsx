import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../types';

export default function Domain() {
  const navigation = useNavigation<AppNavigationProp>();

  return (
    <SafeAreaView style={styles.background}>
      {/* Header Section */}
      <View style={styles.upperContainer}>
        <Text style={styles.headerTitle}>Account Type</Text>
        <Text style={styles.headerSubtitle}>
          Choose your account type
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          Are you a Civilian, Hospital, or NGO?
        </Text>

        <Text style={styles.subtitle}>
          Select the option that best describes you
        </Text>

        {/* Card Buttons */}
        <TouchableOpacity
          style={styles.cardButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Login',{userType: 'civilian'})}
        >
          <Text style={styles.cardButtonText}>
            Civilian (Donor or Requestor)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cardButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Login',{userType: 'hospital'})}
        >
          <Text style={styles.cardButtonText}>Hospital</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cardButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Login',{userType: 'ngo'})}
        >
          <Text style={styles.cardButtonText}>NGO</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* Background */
  background: {
    flex: 1,
    backgroundColor: '#E6E6E6',
  },

  /* Header */
  upperContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
    color: '#444',
  },

  /* Content */
  contentContainer: {
    flex: 1,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 28,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginBottom: 28,
  },

  /* Android Card Buttons */
  cardButton: {
    width: '100%',
    height: 62,
    backgroundColor: '#D83737',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,

    // Android shadow only
    elevation: 4,
  },
  cardButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

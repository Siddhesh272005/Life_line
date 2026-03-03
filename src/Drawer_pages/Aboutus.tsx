import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutUs() {
  return (
    <SafeAreaView style={styles.background}>

      {/* ===== CONTENT ===== */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ===== HERO CARD ===== */}
        <View style={styles.heroCard}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.heroLogo}
            resizeMode="contain"
          />
          <Text style={styles.title}>About Life Line</Text>
          <Text style={styles.description}>
            Life Line is a unified blood donation platform that connects
            civilians, hospitals, and NGOs to save lives faster and more
            efficiently.
          </Text>
        </View>

        {/* ===== INFO CARD ===== */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Mission</Text>
          <Text style={styles.cardText}>
            To create a seamless, transparent, and accessible blood donation
            ecosystem — empowering communities and ensuring that no life is
            lost due to lack of blood.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Team</Text>
          <Text style={styles.cardText}>
            We are a passionate team of developers, healthcare professionals,
            and volunteers working together to bridge the gap between donors
            and those in urgent need.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Us</Text>
          <Text style={styles.cardText}>📧 support@bloodconnect.org</Text>
          <Text style={styles.cardText}>📞 +91 98765 43210</Text>
        </View>

        <Text style={styles.footer}>
          © 2025 Life Line. All Rights Reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#FFFDD8',
  },

  /* HEADER */
  header: {
    height: 56,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    height: 30,
    width: 30,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#C11717',
    marginLeft: 6,
  },

  /* CONTENT */
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },

  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 6,
  },
  heroLogo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C11717',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  cardText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },

  footer: {
    marginTop: 20,
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
});

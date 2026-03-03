import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { apiGet, getAuthToken, getBaseUrl } from '../api/client';

type EarnedItem = {
  id: string;
  title: string;
  date: string;
  hospital: string;
  status: 'Issued' | 'Pending';
};

export default function EarnCertificates() {
  const [certs, setCerts] = React.useState<EarnedItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet('/api/certificates/my');
      setCerts(
        Array.isArray(data)
          ? data.map((item: any) => ({
              id: String(item._id),
              title: item.title || 'Certificate',
              date: new Date(item.createdAt || Date.now()).toLocaleDateString(),
              hospital: item?.issuedBy?.name || 'Hospital/NGO',
              status: item.status === 'issued' ? 'Issued' : 'Pending',
            }))
          : []
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load certificates';
      Alert.alert('Certificates Error', message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Certificates</Text>
          <Text style={styles.subtitle}>
            View your earned certificates and status
          </Text>
        </View>

        {loading ? <Text style={styles.subtitle}>Loading certificates...</Text> : null}
        {!loading && certs.length === 0 ? (
          <Text style={styles.subtitle}>No certificates yet.</Text>
        ) : null}

        {certs.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="ribbon-outline"
                size={22}
                color={item.status === 'Issued' ? '#16A34A' : '#F59E0B'}
              />
              <Text style={styles.cardTitle}>{item.title}</Text>
            </View>
            <Text style={styles.cardMeta}>{item.hospital}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardDate}>{item.date}</Text>
              <View style={styles.footerRight}>
                <View
                  style={[
                    styles.statusPill,
                    item.status === 'Issued' ? styles.issued : styles.pending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.status === 'Issued' ? styles.issuedText : styles.pendingText,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
                {item.status === 'Issued' && (
                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={() => {
                      const token = getAuthToken();
                      if (!token) return;
                      const url = `${getBaseUrl()}/api/certificates/${item.id}/download?token=${token}`;
                      Linking.openURL(url);
                    }}
                  >
                    <Text style={styles.downloadText}>Download</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  container: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  subtitle: {
    marginTop: 4,
    color: '#666',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '700',
  },
  cardMeta: {
    marginTop: 6,
    color: '#666',
  },
  cardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDate: {
    color: '#444',
    fontSize: 12,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  issued: {
    backgroundColor: '#DCFCE7',
  },
  pending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  issuedText: {
    color: '#15803D',
  },
  pendingText: {
    color: '#B45309',
  },
  downloadBtn: {
    marginLeft: 10,
    backgroundColor: '#C11717',
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
  },
  downloadText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

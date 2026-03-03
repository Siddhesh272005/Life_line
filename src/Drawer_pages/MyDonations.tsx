import React from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiGet } from '../api/client';

type DonationItem = {
  _id: string;
  patientName: string;
  bloodGroup: string;
  hospitalName?: string;
  units?: number;
  status?: string;
  myDonationStatus?: 'responded' | 'donated' | null;
  myRespondedAt?: string | null;
  myDonatedAt?: string | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

export default function MyDonations() {
  const [items, setItems] = React.useState<DonationItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/requests/my-donations');
      if (Array.isArray(data)) {
        setItems(data as DonationItem[]);
      } else {
        setItems([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load donations';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Donations</Text>
      <FlatList
        data={items}
        keyExtractor={item => item._id}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={<Text style={styles.empty}>No responded or donated requests yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.patientName}</Text>
              <Text
                style={[
                  styles.statusBadge,
                  item.myDonationStatus === 'donated' ? styles.statusDonated : styles.statusResponded,
                ]}
              >
                {item.myDonationStatus === 'donated' ? 'Donated' : 'Responded'}
              </Text>
            </View>
            <Text style={styles.meta}>Blood Group: {item.bloodGroup}</Text>
            <Text style={styles.meta}>Hospital: {item.hospitalName || '-'}</Text>
            <Text style={styles.meta}>Units Required: {item.units || 1}</Text>
            <Text style={styles.meta}>Request Status: {item.status || 'open'}</Text>
            <Text style={styles.meta}>Responded At: {formatDate(item.myRespondedAt)}</Text>
            {item.myDonationStatus === 'donated' ? (
              <Text style={styles.meta}>Donated At: {formatDate(item.myDonatedAt)}</Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    color: '#000',
  },
  empty: {
    marginTop: 40,
    textAlign: 'center',
    color: '#777',
  },
  card: {
    backgroundColor: '#FFFDF4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginRight: 8,
  },
  statusBadge: {
    color: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  statusResponded: {
    backgroundColor: '#2E7D32',
  },
  statusDonated: {
    backgroundColor: '#C11717',
  },
  meta: {
    marginTop: 3,
    color: '#555',
  },
});

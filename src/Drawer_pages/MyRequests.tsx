import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { apiDelete, apiGet, apiPut } from '../api/client';

type MyRequest = {
  _id: string;
  patientName: string;
  bloodGroup: string;
  condition: string;
  hospitalName?: string;
  units?: number;
  address?: string;
  notes?: string;
  location?: { coordinates?: [number, number] };
  status?: string;
};

export default function MyRequests() {
  const navigation = useNavigation<any>();
  const [items, setItems] = React.useState<MyRequest[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/requests/mine');
      if (Array.isArray(data)) {
        setItems(data);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load requests';
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

  const onDelete = (id: string) => {
    Alert.alert('Delete request', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDelete(`/api/requests/${id}`);
            setItems(prev => prev.filter(item => item._id !== id));
          } catch (err) {
            const message =
              err instanceof Error ? err.message : 'Delete failed';
            Alert.alert('Delete failed', message);
          }
        },
      },
    ]);
  };

  const onResponded = (id: string) => {
    Alert.alert('Mark responded', 'Mark this request as responded?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Responded',
        onPress: async () => {
          try {
            await apiPut(`/api/requests/${id}`, { status: 'responded' });
            setItems(prev => prev.filter(item => item._id !== id));
          } catch (err) {
            const message =
              err instanceof Error ? err.message : 'Update failed';
            Alert.alert('Update failed', message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Requests</Text>
      <FlatList
        data={items}
        keyExtractor={item => item._id}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No requests yet.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.patientName}</Text>
              <Text style={styles.badge}>{item.bloodGroup}</Text>
            </View>
            <Text style={styles.meta}>
              {item.hospitalName || 'Hospital'} • {item.status || 'open'}
            </Text>
            <Text style={styles.meta}>
              Units: {item.units || 1}
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() =>
                  navigation.navigate('BottomTabs', {
                    screen: 'Request',
                    params: {
                      request: {
                        id: item._id,
                        patientName: item.patientName,
                        bloodGroup: item.bloodGroup,
                        condition: item.condition,
                        hospitalName: item.hospitalName,
                        units: item.units,
                        address: item.address,
                        notes: item.notes,
                        location: item.location,
                      },
                    },
                  })
                }
              >
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.respondedBtn}
                onPress={() => onResponded(item._id)}
              >
                <Text style={styles.respondedText}>Responded</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => onDelete(item._id)}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
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
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#C11717',
    color: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: '700',
  },
  meta: {
    color: '#555',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  respondedBtn: {
    flex: 1,
    backgroundColor: '#86C122',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#E53935',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  editText: {
    color: '#333',
    fontWeight: '700',
  },
  respondedText: {
    color: '#FFF',
    fontWeight: '700',
  },
  deleteText: {
    color: '#FFF',
    fontWeight: '700',
  },
});

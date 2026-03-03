import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useNotifications } from '../context/NotificationContext';

export default function Notification() {
  const { notifications, loading, fetchNotifications, markAsRead, clearAll } = useNotifications();
  const handleMarkAsRead = React.useCallback(
    (id: string) => {
      void markAsRead(id).catch(error => {
        const message = error instanceof Error ? error.message : 'Unable to update notification.';
        Alert.alert('Error', message);
      });
    },
    [markAsRead]
  );
  const handleClearAll = React.useCallback(() => {
    void clearAll().catch(error => {
      const message = error instanceof Error ? error.message : 'Unable to clear notifications.';
      Alert.alert('Error', message);
    });
  }, [clearAll]);

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications().catch(error => {
        const message = error instanceof Error ? error.message : 'Unable to fetch notifications.';
        Alert.alert('Error', message);
      });
      return () => {};
    }, [fetchNotifications])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.maincontainer}>
          <Text style={styles.title}>Notifications</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#C11717" style={{ marginTop: 50 }} />
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={60} color="#C4C4C4" />
              <Text style={styles.emptyText}>No new notifications</Text>
            </View>
          ) : (
            notifications.map(item => (
              <View
                key={item.id}
                style={[styles.notificationCard, item.read && { backgroundColor: '#EFEFEF' }]}
              >
                <View style={styles.notificationHeader}>
                  <Ionicons
                    name="notifications-outline"
                    size={24}
                    color={item.read ? '#888' : '#C11717'}
                  />
                  <Text style={[styles.notificationTitle, item.read && { color: '#666' }]}>
                    {item.title}
                  </Text>
                </View>

                <Text style={styles.notificationMessage}>{item.message}</Text>
                <View style={styles.notificationFooter}>
                  <Text style={styles.notificationDate}>{item.date}</Text>
                  {!item.read && (
                    <TouchableOpacity onPress={() => handleMarkAsRead(item.id)}>
                      <Text style={styles.markRead}>Mark as read</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}

          {notifications.length > 0 && !loading && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  maincontainer: { padding: 15 },
  scroll: { paddingBottom: 90 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  notificationCard: {
    backgroundColor: '#FFF8C4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  notificationTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 6 },
  notificationMessage: { fontSize: 14, color: '#333', marginLeft: 30 },
  notificationFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginLeft: 30 },
  notificationDate: { fontSize: 12, color: '#666' },
  markRead: { fontSize: 13, color: '#C11717', fontWeight: 'bold' },
  clearBtn: {
    backgroundColor: '#C11717',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
    width: '60%',
  },
  clearText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 6 },
  emptyContainer: { justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 10 },
});

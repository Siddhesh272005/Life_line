import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabParamList } from '../types';
import Flatrender from '../componenets/Flatrender';
import PatientDetailsModal from '../componenets/PatientDetailsModal';
import { apiGet } from '../api/client';
import { useAuth } from '../context/AuthContext';

/* ================= MAIN ================= */

export default function Home() {
  const route = useRoute<RouteProp<BottomTabParamList, 'Home'>>();
  const { user } = useAuth();
  const userType = user?.role || route.params?.userType || 'civilian';
  const [selectedPatient, setSelectedPatient] = React.useState<Requests | null>(null);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [requests, setRequests] = React.useState<Requests[]>([]);
  const [me, setMe] = React.useState<any>(null);
  const [profile, setProfile] = React.useState<any>(null);
  const [dashboard, setDashboard] = React.useState<any>(null);

  const formatDate = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '--';
    return d.toLocaleDateString();
  };

  const isValidDateString = React.useCallback((value?: string) => {
    if (!value) return false;
    const d = new Date(value);
    return !Number.isNaN(d.getTime());
  }, []);

  const formatRelativeTime = React.useCallback((value?: string) => {
    if (!value) return '--';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '--';
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    if (diffMins < 60) return `${diffMins} mins`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hrs`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days`;
  }, []);

  const mapBackendRequest = React.useCallback((item: any, currentUserId?: string): Requests => {
    const fallback: [number, number] = [78.01, 11.27];
    const coords: [number, number] =
      Array.isArray(item?.location?.coordinates) && item.location.coordinates.length === 2
        ? [item.location.coordinates[0], item.location.coordinates[1]]
        : fallback;
    const responder: [number, number] = [coords[0] - 0.01, coords[1] - 0.01];
    const respondersRaw = Array.isArray(item?.responders) ? item.responders : [];
    const nowMs = Date.now();
    const respondersCount =
      typeof item?.respondersCount === 'number'
        ? item.respondersCount
        : respondersRaw.filter((responderItem: any) => {
            const status = responderItem?.status || 'responded';
            const expiresAt = responderItem?.expiresAt ? new Date(responderItem.expiresAt).getTime() : null;
            if (status !== 'responded') return false;
            if (!expiresAt) return true;
            return expiresAt > nowMs;
          }).length;
    const respondersLimit = typeof item?.respondersLimit === 'number' ? item.respondersLimit : 3;
    const responderForCurrentUser = respondersRaw.find((responderItem: any) => {
      const responderId =
        typeof responderItem === 'string'
          ? responderItem
          : responderItem?.userId || responderItem?._id || responderItem?.id;
      return currentUserId ? String(responderId) === String(currentUserId) : false;
    });
    const currentStatus: string | null = responderForCurrentUser?.status || null;
    const hasResponded =
      typeof item?.hasResponded === 'boolean'
        ? item.hasResponded
        : Boolean(currentStatus === 'responded' || currentStatus === 'donated');
    const hasDonated =
      typeof item?.hasDonated === 'boolean' ? item.hasDonated : currentStatus === 'donated';
    const slotsRemaining =
      typeof item?.slotsRemaining === 'number'
        ? item.slotsRemaining
        : Math.max(0, respondersLimit - respondersCount);

    return {
      id: item._id,
      requestId: item._id,
      name: item.patientName || 'Patient',
      bloodGroup: item.bloodGroup || 'O+',
      place: item.hospitalName || 'Hospital',
      condition: item.condition || 'Critical',
      requestType: item.requestType || 'Request',
      location: item.address || 'Location',
      time: formatRelativeTime(item.createdAt),
      age: 0,
      gender: 'Other',
      units: item.units || 1,
      phone: item.phone || '',
      hospital: item.hospitalName || '',
      address: item.address || '',
      notes: item.notes || '',
      patientCoordinate: coords,
      responderCoordinate: responder,
      respondersCount,
      respondersLimit,
      slotsRemaining,
      requestStatus: item.status || 'open',
      hasResponded,
      hasDonated,
      currentResponderStatus: item.currentResponderStatus || currentStatus,
      currentResponderExpiresAt: item.currentResponderExpiresAt || responderForCurrentUser?.expiresAt || null,
    };
  }, [formatRelativeTime]);

  const load = React.useCallback(async () => {
    try {
      const meData = await apiGet('/api/users/me');
      setMe(meData?.user || null);
      setProfile(meData?.profile || null);
      const currentUserId = meData?.user?._id ? String(meData.user._id) : '';
      const dashboardData = await apiGet('/api/users/dashboard');
      setDashboard(dashboardData || null);

      const requestData = await apiGet('/api/requests');
      if (Array.isArray(requestData)) {
        const filtered = requestData.filter(item => {
          if (item?.status === 'closed') return false;
          const slotsRemaining = Number(item?.slotsRemaining ?? 0);
          const hasResponded = Boolean(item?.hasResponded);
          return slotsRemaining > 0 || hasResponded;
        });
        setRequests(filtered.map(item => mapBackendRequest(item, currentUserId)));
      }
    } catch {}
  }, [mapBackendRequest]);

  useFocusEffect(
    React.useCallback(() => {
      load();
      return () => {};
    }, [load])
  );

  const displayName = dashboard?.name || me?.name || 'User';
  const displayBadge = dashboard?.badge || profile?.bloodGroup || '--';
  const roleLabel = String(userType).toUpperCase();
  const roleIcon =
    userType === 'hospital'
      ? require('../../assets/hospital_icon.png')
      : require('../../assets/ngo_icon.png');
  const statOne = dashboard?.stats?.[0] || { label: 'Status', value: 'N/A' };
  const statTwo = dashboard?.stats?.[1] || { label: 'Info', value: 'N/A' };
  const hasNextDonationDate = userType === 'civilian' && isValidDateString(String(statTwo?.value || ''));

  return (
    <SafeAreaView style={styles.background}>

      {/* ===== SCROLLABLE CONTENT ===== */}
      <FlatList
        data={requests}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No active requests right now.
          </Text>
        }
        renderItem={({ item }) => (
          <Flatrender
            {...item}
            responderCount={item.respondersCount}
            responderLimit={item.respondersLimit}
            canRespond={item.hasResponded || (item.slotsRemaining || 0) > 0}
            hasResponded={item.hasResponded}
            hasDonated={item.hasDonated}
            onRespondNow={() => {
              setSelectedPatient(item);
              setModalVisible(true);
            }}
          />
        )}
        ListHeaderComponent={
          <>
            {/* ===== WELCOME CARD ===== */}
            <View style={styles.welcomeCard}>
              <View style={styles.welcomeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.welcomeText}>
                    Welcome back, {displayName}
                  </Text>
                  <Text style={styles.subText}>
                    Ready to save lives today?
                  </Text>
                </View>

                <View style={styles.roleBox}>
                  {userType === 'civilian' ? (
                    <View style={styles.bloodBadge}>
                      <Text style={styles.bloodText}>{displayBadge}</Text>
                    </View>
                  ) : (
                    <Image source={roleIcon} style={styles.roleIcon} />
                  )}
                  <Text style={styles.roleText}>{roleLabel}</Text>
                </View>
              </View>

              {/* ===== STATUS ===== */}
              <View style={styles.statusRow}>
                <View style={styles.statusBox}>
                  <Text style={styles.statusValue}>
                    {String(statOne.value || '--')}
                  </Text>
                  {statOne.label && (
                    <Text style={styles.statusLabel}>
                      {String(statOne.label)}
                    </Text>
                  )}
                </View>

                <View style={styles.statusBox}>
                  <Text style={styles.statusValue}>
                    {hasNextDonationDate
                      ? `Next: ${formatDate(String(statTwo.value))}`
                      : userType === 'civilian'
                        ? 'Eligible now'
                        : String(statTwo.value || '--')}
                  </Text>
                  {statTwo.label && (
                    <Text style={styles.statusLabel}>
                      {String(statTwo.label)}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Urgent Requests</Text>
          </>
        }
      />

      <PatientDetailsModal
        visible={modalVisible}
        patient={selectedPatient}
        onActionComplete={load}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  iconCircle: {
    height: 42,
    width: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },


  listContent: {
    paddingHorizontal: '5%',
    paddingBottom: 20,
  },

  welcomeCard: {
    backgroundColor: '#FFFDF4',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    elevation: 6,
  },

  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  subText: {
    fontSize: 14,
    color: '#666',
  },

  roleBox: {
    alignItems: 'center',
  },

  bloodBadge: {
    height: 56,
    width: 56,
    borderRadius: 28,
    backgroundColor: '#C11717',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bloodText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  roleIcon: {
    height: 50,
    width: 50,
  },

  roleText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },

  statusRow: {
    flexDirection: 'row',
    marginTop: 14,
    backgroundColor: '#86C122',
    borderRadius: 14,
    overflow: 'hidden',
  },

  statusBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },

  statusValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },

  statusLabel: {
    fontSize: 12,
    color: '#F1F1F1',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginBottom: 16,
  },
});

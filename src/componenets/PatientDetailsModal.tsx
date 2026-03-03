import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import Mapbox from '@rnmapbox/maps';
import Map from './Map';
import { apiGet, apiPost } from '../api/client';

type Props = {
  visible: boolean;
  patient: Requests | null;
  onClose: () => void;
  onActionComplete?: () => void;
};

export default function PatientDetailsModal({ visible, patient, onClose, onActionComplete }: Props) {
  const [showFullMap, setShowFullMap] = React.useState(false);
  const [routeCoords, setRouteCoords] = React.useState<[number, number][]>([]);
  const [markingResponded, setMarkingResponded] = React.useState(false);
  const [markingDonated, setMarkingDonated] = React.useState(false);
  const [responded, setResponded] = React.useState(false);
  const [donated, setDonated] = React.useState(false);

  React.useEffect(() => {
    if (!visible) {
      setShowFullMap(false);
      setRouteCoords([]);
      setMarkingResponded(false);
      setMarkingDonated(false);
      setResponded(false);
      setDonated(false);
    }
  }, [visible]);

  React.useEffect(() => {
    if (patient) {
      setResponded(Boolean(patient.hasResponded));
      setDonated(Boolean(patient.hasDonated));
    }
  }, [patient]);

  React.useEffect(() => {
    const loadRoute = async () => {
      if (!patient) return;
      try {
        const start = `${patient.responderCoordinate[0]},${patient.responderCoordinate[1]}`;
        const end = `${patient.patientCoordinate[0]},${patient.patientCoordinate[1]}`;
        const data = await apiGet(`/api/routes/directions?start=${start}&end=${end}`);
        const coords = data?.route?.geometry?.coordinates;
        if (Array.isArray(coords)) {
          setRouteCoords(coords);
        }
      } catch {}
    };
    if (visible) {
      loadRoute();
    }
  }, [visible, patient]);

  if (!patient) return null;

  const bloodGroup = patient.bloodGroup ?? patient.blodgroup ?? '--';
  const closeAll = () => {
    setShowFullMap(false);
    onClose();
  };

  const markAsResponded = async () => {
    if (!patient.requestId || responded || markingResponded) {
      return;
    }
    try {
      setMarkingResponded(true);
      const response = await apiPost(`/api/requests/${patient.requestId}/respond`, {});
      setResponded(true);
      setDonated(false);
      onActionComplete?.();
      const slotsRemaining =
        typeof response?.slotsRemaining === 'number' ? response.slotsRemaining : null;
      Alert.alert(
        'Response submitted',
        slotsRemaining !== null
          ? `${slotsRemaining} responder slot${slotsRemaining === 1 ? '' : 's'} remaining.`
          : 'Your response has been recorded.'
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark responded';
      Alert.alert('Update failed', message);
    } finally {
      setMarkingResponded(false);
    }
  };

  const markDonation = async () => {
    if (!patient.requestId || markingDonated || donated) {
      return;
    }
    try {
      setMarkingDonated(true);
      const response = await apiPost(`/api/requests/${patient.requestId}/donate`, {});
      setDonated(true);
      onActionComplete?.();
      Alert.alert('Donation confirmed', response?.message || 'Donation confirmation saved.');
      closeAll();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to confirm donation';
      Alert.alert('Update failed', message);
    } finally {
      setMarkingDonated(false);
    }
  };

  const slotsRemaining = Number(patient.slotsRemaining || 0);
  const canRespond = !responded && slotsRemaining > 0;

  return (
    <>
      <Modal visible={visible && !showFullMap} animationType="none" transparent>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>Patient Details</Text>
              <TouchableOpacity onPress={closeAll} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#111" />
              </TouchableOpacity>
            </View>

            <View style={styles.mapWrap}>
              <Map
                patientCoordinate={patient.patientCoordinate}
                responderCoordinate={patient.responderCoordinate}
                routeCoordinates={routeCoords}
              />
              <View style={styles.mapBadge}>
                <Ionicons name="navigate-outline" size={14} color="#FFF" />
                <Text style={styles.mapBadgeText}>Route Preview</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={async () => {
                if (Platform.OS === 'android') {
                  try {
                    const granted = await Mapbox.requestAndroidLocationPermissions();
                    if (!granted) {
                      Alert.alert(
                        'Location permission required',
                        'Please allow location access to start the route.'
                      );
                      return;
                    }
                  } catch {
                    Alert.alert(
                      'Location permission required',
                      'Please allow location access to start the route.'
                    );
                    return;
                  }
                }
                setShowFullMap(true);
              }}
            >
              <Ionicons name="location-outline" size={18} color="#FFF" />
              <Text style={styles.startButtonText}>Start Route</Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.row}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{bloodGroup}</Text>
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.name}>{patient.name}</Text>
                  <Text style={styles.metaText}>
                    {patient.age} yrs - {patient.gender}
                  </Text>
                  <Text style={styles.metaText}>{patient.condition}</Text>
                </View>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Units Needed</Text>
                  <Text style={styles.detailValue}>{patient.units}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Distance</Text>
                  <Text style={styles.detailValue}>{patient.location}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Time Left</Text>
                  <Text style={styles.detailValue}>{patient.time}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Hospital</Text>
                  <Text style={styles.detailValue}>{patient.hospital}</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact</Text>
                <Text style={styles.sectionValue}>{patient.phone}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Address</Text>
                <Text style={styles.sectionValue}>{patient.address}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.sectionValue}>{patient.notes}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={visible && showFullMap} animationType="none">
        <View style={styles.fullMapContainer}>
          <Map
            patientCoordinate={patient.patientCoordinate}
            responderCoordinate={patient.responderCoordinate}
            routeCoordinates={routeCoords}
          />
          <View style={styles.fullMapHeader}>
            <Text style={styles.fullMapTitle}>Route</Text>
            <TouchableOpacity onPress={() => setShowFullMap(false)} style={styles.fullMapClose}>
              <Ionicons name="close" size={20} color="#111" />
            </TouchableOpacity>
          </View>
          <View style={styles.fullMapFooter}>
            <TouchableOpacity
              style={[styles.respondButton, responded && styles.respondedButton]}
              onPress={markAsResponded}
              disabled={markingResponded || !canRespond}
            >
              <Text style={styles.respondButtonText}>
                {donated
                  ? 'Donation Confirmed'
                  : responded
                  ? 'Response Submitted'
                  : !slotsRemaining
                    ? 'Responder Slots Full'
                  : markingResponded
                    ? 'Marking...'
                    : 'Mark as Responded'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.donateButton, (!responded || markingDonated || donated) && styles.donateButtonDisabled]}
              onPress={markDonation}
              disabled={markingDonated || !responded || donated}
            >
              <Text style={styles.donateButtonText}>
                {donated ? 'Donation Confirmed' : markingDonated ? 'Submitting...' : 'I Donated Blood'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  closeButton: {
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: '#F3F3F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapWrap: {
    height: 210,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  mapBadge: {
    position: 'absolute',
    right: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mapBadgeText: {
    color: '#FFF',
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F82306',
    borderRadius: 10,
    height: 42,
    marginBottom: 12,
  },
  startButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  fullMapContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullMapHeader: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fullMapTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fullMapClose: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullMapFooter: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 22,
  },
  respondButton: {
    height: 46,
    borderRadius: 10,
    backgroundColor: '#F82306',
    alignItems: 'center',
    justifyContent: 'center',
  },
  respondedButton: {
    backgroundColor: '#3E9D47',
  },
  respondButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  donateButton: {
    marginTop: 10,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2F6BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donateButtonDisabled: {
    opacity: 0.55,
  },
  donateButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    height: 50,
    width: 50,
    borderRadius: 25,
    backgroundColor: '#C11717',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  patientInfo: {
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  metaText: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  detailsGrid: {
    backgroundColor: '#FFF8F7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  detailItem: {
    marginBottom: 8,
  },
  detailLabel: {
    color: '#777',
    fontSize: 12,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
  },
  sectionValue: {
    marginTop: 4,
    color: '#555',
  },
});

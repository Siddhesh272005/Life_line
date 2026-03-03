import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

type Props = {
  name: string;
  bloodGroup?: string;
  blodgroup?: string;
  place: string;
  requestType?: string;
  location: string;
  time: string;
  responderCount?: number;
  responderLimit?: number;
  canRespond?: boolean;
  hasResponded?: boolean;
  hasDonated?: boolean;
  onRespondNow: () => void;
};

export default function Flatrender(props: Props) {
  const bloodGroup = props.bloodGroup ?? props.blodgroup ?? '--';
  const requestType = props.requestType ?? 'REQUEST';
  const responderCount = Number(props.responderCount || 0);
  const responderLimit = Number(props.responderLimit || 3);
  const canRespond = props.canRespond !== false;
  const hasResponded = Boolean(props.hasResponded);
  const hasDonated = Boolean(props.hasDonated);
  const buttonLabel = hasDonated
    ? 'Donation Confirmed'
    : hasResponded
      ? 'Continue Donation'
      : canRespond
        ? 'Respond Now'
        : 'Slots Full';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.bloodCircle}>
          <Text style={styles.bloodText}>{bloodGroup}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{props.name.toUpperCase()}</Text>
          <Text style={styles.place}>{props.place.toUpperCase()}</Text>
        </View>

        <View style={styles.condition}>
          <Text style={styles.conditionText}>
            {requestType.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.meta}>
          <Ionicons name="location-outline" size={18} />
          <Text style={styles.metaText}>{props.location}</Text>
        </View>

        <View style={styles.meta}>
          <Ionicons name="time-outline" size={18} />
          <Text style={styles.metaText}>{props.time}</Text>
        </View>
      </View>

      <Text style={styles.slotText}>
        Responders: {responderCount}/{responderLimit}
      </Text>

      <TouchableOpacity
        style={[styles.button, !canRespond && styles.disabledButton]}
        onPress={props.onRespondNow}
        disabled={!canRespond && !hasResponded}
      >
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFDF4',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    elevation: 5,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  bloodCircle: {
    height: 42,
    width: 42,
    borderRadius: 21,
    backgroundColor: '#C11717',
    justifyContent: 'center',
    alignItems: 'center',
  },

  bloodText: {
    color: '#FFF',
    fontWeight: 'bold',
  },

  info: {
    flex: 1,
    marginLeft: 10,
  },

  name: {
    fontWeight: 'bold',
  },

  place: {
    fontSize: 12,
    color: '#666',
  },

  condition: {
    backgroundColor: '#F82306',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },

  conditionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  metaText: {
    marginLeft: 4,
    fontSize: 12,
  },
  slotText: {
    marginTop: 8,
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },

  button: {
    marginTop: 12,
    backgroundColor: '#F82306',
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#9E9E9E',
  },

  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

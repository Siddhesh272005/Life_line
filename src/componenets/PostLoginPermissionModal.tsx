import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {
  PermissionState,
  getFilePermissionState,
  getLocationPermissionState,
  getNotificationPermissionState,
  requestFilePermission,
  requestLocationPermission,
  requestNotificationPermission,
} from '../services/appPermissions';

type Props = {
  visible: boolean;
  onDone: (completed: boolean) => void;
};

const statusText = (state: PermissionState) => {
  if (state === 'granted') return 'Granted';
  if (state === 'unavailable') return 'Not required';
  return 'Pending';
};

const statusColor = (state: PermissionState) => {
  if (state === 'granted') return '#208B3A';
  if (state === 'unavailable') return '#666';
  return '#C11717';
};

export default function PostLoginPermissionModal({ visible, onDone }: Props) {
  const [notificationState, setNotificationState] = React.useState<PermissionState>('denied');
  const [locationState, setLocationState] = React.useState<PermissionState>('denied');
  const [fileState, setFileState] = React.useState<PermissionState>('denied');
  const [errorMessage, setErrorMessage] = React.useState('');

  const refreshStates = React.useCallback(async () => {
    const [noti, loc, file] = await Promise.all([
      getNotificationPermissionState(),
      getLocationPermissionState(),
      getFilePermissionState(),
    ]);
    setNotificationState(noti);
    setLocationState(loc);
    setFileState(file);
  }, []);

  React.useEffect(() => {
    if (!visible) return;
    setErrorMessage('');
    void refreshStates().catch(() => {});
  }, [visible, refreshStates]);

  const requestNotifications = async () => {
    setErrorMessage('');
    try {
      const next = await requestNotificationPermission();
      setNotificationState(next);
    } catch (error) {
      const fallback = await getNotificationPermissionState();
      setNotificationState(fallback);
      const message = error instanceof Error ? error.message : 'Unable to update notification permission.';
      setErrorMessage(message);
    }
  };

  const requestLocation = async () => {
    setErrorMessage('');
    try {
      const next = await requestLocationPermission();
      setLocationState(next);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update location permission.';
      setErrorMessage(message);
    }
  };

  const requestFiles = async () => {
    setErrorMessage('');
    try {
      const next = await requestFilePermission();
      setFileState(next);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update file permission.';
      setErrorMessage(message);
    }
  };

  const ready =
    notificationState === 'granted' &&
    (locationState === 'granted' || locationState === 'unavailable') &&
    (fileState === 'granted' || fileState === 'unavailable');

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Allow Permissions</Text>
          <Text style={styles.subtitle}>
            Please allow required permissions to continue using app features.
          </Text>

          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>Notifications</Text>
              <Text style={[styles.itemStatus, { color: statusColor(notificationState) }]}>
                {statusText(notificationState)}
              </Text>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={requestNotifications}>
              <Text style={styles.actionText}>Allow</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>Location</Text>
              <Text style={[styles.itemStatus, { color: statusColor(locationState) }]}>
                {statusText(locationState)}
              </Text>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={requestLocation}>
              <Text style={styles.actionText}>Allow</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>File Access</Text>
              <Text style={[styles.itemStatus, { color: statusColor(fileState) }]}>
                {statusText(fileState)}
              </Text>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={requestFiles}>
              <Text style={styles.actionText}>Allow</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.continueBtn, !ready && { opacity: 0.65 }]}
            onPress={() => onDone(ready)}
            disabled={!ready}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {!ready ? (
            <TouchableOpacity onPress={() => Linking.openSettings()}>
              <Text style={styles.settingsHint}>Denied before? Open App Settings</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  subtitle: {
    marginTop: 4,
    color: '#666',
  },
  item: {
    marginTop: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  itemStatus: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtn: {
    backgroundColor: '#C11717',
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
  },
  continueBtn: {
    marginTop: 16,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#208B3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  settingsHint: {
    marginTop: 10,
    textAlign: 'center',
    color: '#C11717',
    fontWeight: '600',
  },
  errorText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#C11717',
    fontSize: 12,
  },
});

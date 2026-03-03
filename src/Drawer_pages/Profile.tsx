import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiDelete, apiGet, apiPut } from '../api/client';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../types';
import { useAuth } from '../context/AuthContext';

type UserRole = 'hospital' | 'civilian' | 'ngo';

type Field = {
  key: string;
  label: string;
  keyboard?: 'default' | 'numeric' | 'phone-pad';
  multiline?: boolean;
};

const PROFILE_FIELDS: Record<UserRole, Field[]> = {
  hospital: [
    { key: 'name', label: 'Hospital Name' },
    { key: 'licenseId', label: 'Hospital ID' },
    { key: 'email', label: 'Email' },
    { key: 'city', label: 'City' },
    { key: 'address', label: 'Address', multiline: true },
    { key: 'phone', label: 'Contact No', keyboard: 'phone-pad' },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'pincode', label: 'Pincode', keyboard: 'numeric' },
  ],
  civilian: [
    { key: 'name', label: 'Full Name' },
    { key: 'bloodGroup', label: 'Blood Group' },
    { key: 'gender', label: 'Gender' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'age', label: 'Age', keyboard: 'numeric' },
    { key: 'city', label: 'City' },
    { key: 'address', label: 'Address', multiline: true },
    { key: 'phone', label: 'Mobile No', keyboard: 'phone-pad' },
    { key: 'lastDonation', label: 'Last Donation Date' },
    { key: 'email', label: 'Email' },
  ],
  ngo: [
    { key: 'name', label: 'Organization Name' },
    { key: 'licenseId', label: 'License ID' },
    { key: 'city', label: 'City' },
    { key: 'address', label: 'Address', multiline: true },
    { key: 'phone', label: 'Contact No', keyboard: 'phone-pad' },
    { key: 'email', label: 'Email' },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'pincode', label: 'Pincode', keyboard: 'numeric' },
  ],
};

const roleTitle = (role: UserRole) => {
  if (role === 'civilian') return 'Personal Profile';
  if (role === 'hospital') return 'Hospital Profile';
  return 'NGO Profile';
};

const roleIcon = (role: UserRole) => {
  if (role === 'civilian') return require('../../assets/civilian_icon.png');
  if (role === 'hospital') return require('../../assets/hospital_icon.png');
  return require('../../assets/ngo_icon.png');
};

export default function Profile() {
  const navigation = useNavigation<AppNavigationProp>();
  const { logout } = useAuth();
  const [role, setRole] = React.useState<UserRole>('civilian');
  const [profile, setProfile] = React.useState<Record<string, string>>({});
  const [editMode, setEditMode] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet('/api/users/me');
      const user = data?.user || {};
      const p = data?.profile || {};
      const nextRole: UserRole = user.role || 'civilian';
      setRole(nextRole);
      setProfile({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        bloodGroup: p.bloodGroup || '',
        gender: p.gender || '',
        dob: p.dob || '',
        age: p.age != null ? String(p.age) : '',
        city: p.city || '',
        address: p.address || '',
        lastDonation: p.lastDonation || '',
        licenseId: p.licenseId || '',
        contactPerson: p.contactPerson || '',
        pincode: p.pincode || '',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load profile';
      Alert.alert('Profile Error', message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const profilePayload =
        role === 'civilian'
          ? {
              bloodGroup: profile.bloodGroup || '',
              gender: profile.gender || '',
              dob: profile.dob || '',
              age: Number(profile.age || 0),
              city: profile.city || '',
              address: profile.address || '',
              lastDonation: profile.lastDonation || '',
            }
          : {
              licenseId: profile.licenseId || '',
              contactPerson: profile.contactPerson || '',
              city: profile.city || '',
              address: profile.address || '',
              pincode: profile.pincode || '',
            };

      await apiPut('/api/users/me', {
        name: profile.name || '',
        phone: profile.phone || '',
        profile: profilePayload,
      });
      setEditMode(false);
      Alert.alert('Saved', 'Profile updated successfully.');
      load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      Alert.alert('Save Error', message);
    } finally {
      setSaving(false);
    }
  };

  const fields = PROFILE_FIELDS[role];

  const deleteAccount = React.useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This action is permanent. Your account and related data will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Delete',
              'Are you absolutely sure? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setDeleting(true);
                      await apiDelete('/api/users/me');
                      logout();
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Domain' }],
                      });
                    } catch (err) {
                      const message =
                        err instanceof Error ? err.message : 'Failed to delete account';
                      Alert.alert('Delete Failed', message);
                    } finally {
                      setDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [logout, navigation]);

  return (
    <SafeAreaView style={styles.background}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Image source={roleIcon(role)} style={styles.avatar} />
            <Text style={styles.title}>{roleTitle(role)}</Text>

            {loading ? (
              <Text style={styles.loading}>Loading profile...</Text>
            ) : (
              fields.map(field => (
                <View key={field.key} style={styles.field}>
                  <Text style={styles.label}>{field.label}</Text>
                  <TextInput
                    style={[
                      styles.input,
                      field.multiline && styles.multiline,
                      !editMode && styles.readonly,
                    ]}
                    editable={editMode}
                    multiline={field.multiline}
                    keyboardType={field.keyboard ?? 'default'}
                    value={profile[field.key] || ''}
                    onChangeText={t => setProfile(prev => ({ ...prev, [field.key]: t }))}
                  />
                </View>
              ))
            )}

            {!loading && (
              <>
                <TouchableOpacity
                  style={[styles.button, editMode && styles.saveButton]}
                  onPress={editMode ? handleSave : () => setEditMode(true)}
                  disabled={saving || deleting}
                >
                  <Text style={styles.buttonText}>
                    {saving ? 'Saving...' : editMode ? 'Save Changes' : 'Edit Profile'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={deleteAccount}
                  disabled={saving || deleting}
                >
                  <Text style={styles.deleteButtonText}>
                    {deleting ? 'Deleting...' : 'Delete Account'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scroll: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  avatar: {
    width: 110,
    height: 110,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  loading: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F1F3F6',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  readonly: {
    backgroundColor: '#ECEFF3',
  },
  multiline: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  button: {
    marginTop: 22,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#DC2626',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    marginTop: 12,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
  },
});

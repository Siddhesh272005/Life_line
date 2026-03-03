import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Formik } from 'formik';
import * as Yup from 'yup';

import Flatdonoravil from '../componenets/Flatdonoravil';
import { apiGet, apiPost } from '../api/client';

/* ================= VALIDATION ================= */
const userSchema = Yup.object().shape({
  bloodgroup: Yup.string().required('Required'),
  location: Yup.string().required('Required'),
});

export default function Search() {
  const [selectedDonors, setSelectedDonors] = useState<string[]>([]);
  const [resetCheckboxes, setResetCheckboxes] = useState(false);
  const [donors, setDonors] = useState<donors[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastFilters, setLastFilters] = useState<{ bloodgroup?: string; location?: string }>({});

  const fetchDonors = async (filters?: { bloodgroup?: string; location?: string }) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.bloodgroup?.trim()) {
        params.append('bloodGroup', filters.bloodgroup.trim());
      }
      if (filters?.location?.trim()) {
        params.append('location', filters.location.trim());
      }
      const query = params.toString();
      let data;
      try {
        data = await apiGet(`/api/users/donors/search${query ? `?${query}` : ''}`);
      } catch (primaryError) {
        const message = primaryError instanceof Error ? primaryError.message : '';
        if (message.toLowerCase().includes('request failed')) {
          data = await apiGet(`/api/users/donors${query ? `?${query}` : ''}`);
        } else {
          throw primaryError;
        }
      }
      if (Array.isArray(data)) {
        const mapped: donors[] = data.map(item => ({
          id: item.id,
          name: item.name || 'Donor',
          place: item.place || 'Unknown',
        }));
        setDonors(mapped);
        setLastFilters(filters || {});
      } else {
        setDonors([]);
      }
    } catch (error) {
      setDonors([]);
      const message = error instanceof Error ? error.message : 'Unable to fetch donors from backend.';
      Alert.alert('Search unavailable', message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDonors();
  }, []);

  const handleSelectDonor = (id: string, checked: boolean) => {
    setSelectedDonors(prev =>
      checked ? [...new Set([...prev, id])] : prev.filter(d => d !== id),
    );
  };

  const handleSendMessage = async () => {
    if (!selectedDonors.length) return;
    try {
      setSending(true);
      const response = await apiPost('/api/users/donors/notify', {
        donorUserIds: selectedDonors,
        bloodGroup: lastFilters.bloodgroup || '',
        location: lastFilters.location || '',
      });
      const count = Number(response?.notifiedCount || selectedDonors.length);
      Alert.alert('Notification sent', `Alert sent to ${count} donor${count > 1 ? 's' : ''}.`);
      setSelectedDonors([]);
      setResetCheckboxes(prev => !prev);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send notifications.';
      Alert.alert('Send failed', message);
    } finally {
      setSending(false);
    }
  };

  /* ---------- FLATLIST DATA ---------- */
  const listData: Array<{ type: 'search' } | { type: 'stickyHeader' } | ({ type: 'donor' } & donors)> = [
    { type: 'search' },
    { type: 'stickyHeader' },
    ...donors.map(d => ({ type: 'donor' as const, ...d })),
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={listData}
          stickyHeaderIndices={[1]} // ✅ EXACT sticky index
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => {
            /* ---------- SEARCH FORM ---------- */
            if (item.type === 'search') {
              return (
                <>
                  <Text style={styles.title}>Smart Donor Search</Text>
                  <Text style={styles.subtitle}>
                    Find donors by blood group and location
                  </Text>

                  <Formik
                    initialValues={{ bloodgroup: '', location: '' }}
                    validationSchema={userSchema}
                    onSubmit={async (values, { resetForm }) => {
                      await fetchDonors(values);
                      resetForm();
                    }}
                  >
                    {({ values, handleChange, handleSubmit }) => (
                      <View style={styles.form}>
                        <Input
                          label="Blood Group"
                          value={values.bloodgroup}
                          onChangeText={handleChange('bloodgroup')}
                          helperText='Format: O+, O-, A+, A-, B+, B-, AB+, AB-'
                        />
                        <Input
                          label="Location"
                          value={values.location}
                          onChangeText={handleChange('location')}
                          helperText='Format: city name or area (e.g., "Chennai" or "Anna Nagar")'
                        />

                        <TouchableOpacity
                          style={styles.searchBtn}
                          onPress={handleSubmit}
                        >
                          <Ionicons
                            name="search-outline"
                            size={20}
                            color="#fff"
                          />
                          <Text style={styles.searchText}>Search</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </Formik>
                </>
              );
            }

            /* ---------- STICKY HEADER ---------- */
            if (item.type === 'stickyHeader') {
              return (
                <View style={styles.stickyHeader}>
                  <Text style={styles.donorTitle}>Available Donors</Text>

                  <TouchableOpacity
                    disabled={selectedDonors.length === 0 || sending}
                    style={[
                      styles.sendBtn,
                      (selectedDonors.length === 0 || sending) && { opacity: 0.5 },
                    ]}
                    onPress={() => {
                      void handleSendMessage();
                    }}
                  >
                    <Ionicons name="send-outline" size={18} color="#fff" />
                    <Text style={styles.sendText}>{sending ? 'Sending...' : 'Send'}</Text>
                  </TouchableOpacity>
                </View>
              );
            }

            /* ---------- DONOR CARD ---------- */
            const donorItem = item as { type: 'donor' } & donors;
            return (
              <Flatdonoravil
                id={donorItem.id}
                name={donorItem.name}
                place={donorItem.place}
                reset={resetCheckboxes}
                onSelect={handleSelectDonor}
              />
            );
          }}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListFooterComponent={loading ? <Text style={styles.loading}>Loading donors...</Text> : null}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ================= INPUT ================= */
function Input({ label, helperText, ...props }: any) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} {...props} />
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    padding: 16,
    paddingBottom: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  form: {
    padding: 16,
    backgroundColor: '#FFFDF4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFD8D8',
    marginHorizontal: 4,
    marginBottom: 8,
  },

  inputWrap: {
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E5CFCF',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
  },
  helperText: {
    fontSize: 12,
    color: '#7A7A7A',
    marginTop: 4,
  },

  searchBtn: {
    backgroundColor: '#E53935',
    height: 46,
    borderRadius: 10,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 6,
  },

  /* 🔥 STICKY HEADER */
  stickyHeader: {
    backgroundColor: '#FFFDF4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#EFD8D8',
    zIndex: 10,
    borderRadius: 12,
    marginBottom: 10,
  },

  donorTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  sendBtn: {
    backgroundColor: '#C11717',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },
  loading: {
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
  },
});

import React, { JSX, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { apiGet, apiPost, apiPut } from '../api/client';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { BottomTabParamList } from '../types';
import Mapbox, { MapView, Camera, ShapeSource, CircleLayer } from '@rnmapbox/maps';
import { MAPBOX_PUBLIC_TOKEN } from '../config/runtime';

import * as Yup from 'yup';
import { Formik } from 'formik';

/* ================= VALIDATION ================= */
const userSchema = Yup.object().shape({
  name: Yup.string().required('Please enter the name'),
  bloodgroup: Yup.string().required('Please enter blood group'),
  requesttype: Yup.string().required('Please enter request type'),
  hospitalname: Yup.string().required('Please enter hospital name'),
  hospitaladdr: Yup.string().required('Please enter hospital address'),
  patientattenderphno: Yup.string().required('Please enter contact number'),
  hospitallocation: Yup.string().required('Please enter hospital location'),
  requirebloodunit: Yup.string().required('Please enter required units'),
  description: Yup.string().required('Please describe the situation'),
});

if (MAPBOX_PUBLIC_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_PUBLIC_TOKEN);
}

const DEFAULT_COORD: [number, number] = [78.01, 11.27];
const MAPBOX_COUNTRY = 'IN';
const MAPBOX_LANGUAGE = 'en';
const MAPBOX_TYPES = 'place,locality,neighborhood,poi';

type SearchResultItem = {
  id: string;
  title: string;
  subtitle: string;
  center: [number, number];
};

const parseCoordString = (value: string): [number, number] | null => {
  const parts = value.split(',').map(p => p.trim());
  if (parts.length !== 2) return null;
  const lon = Number(parts[0]);
  const lat = Number(parts[1]);
  if (Number.isNaN(lon) || Number.isNaN(lat)) return null;
  return [lon, lat];
};

const searchWithNominatimDirect = async (
  q: string,
  country: string,
  language: string
): Promise<SearchResultItem[]> => {
  const params =
    `q=${encodeURIComponent(q)}` +
    `&format=jsonv2` +
    `&limit=10` +
    `&addressdetails=1` +
    (country ? `&countrycodes=${encodeURIComponent(country.toLowerCase())}` : '') +
    (language ? `&accept-language=${encodeURIComponent(language)}` : '');

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Search fallback failed (${res.status})`);
  }

  const data = await res.json();
  const rows = Array.isArray(data) ? data : [];
  return rows
    .map((item: any) => {
      const lon = Number(item?.lon);
      const lat = Number(item?.lat);
      if (Number.isNaN(lon) || Number.isNaN(lat)) return null;
      return {
        id: `osm-${item?.place_id || `${lon}-${lat}`}`,
        title: item?.name || item?.display_name || 'Place',
        subtitle: item?.display_name || '',
        center: [lon, lat] as [number, number],
      } satisfies SearchResultItem;
    })
    .filter((item: SearchResultItem | null): item is SearchResultItem => Boolean(item));
};

export default function Request(): JSX.Element {
  const hasMapToken = Boolean(MAPBOX_PUBLIC_TOKEN);
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<BottomTabParamList, 'Request'>>();
  const editRequest = route.params?.request;
  const editRequestId = editRequest?.id || editRequest?._id;
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [pickedCoord, setPickedCoord] = useState<[number, number] | null>(
    editRequest?.location?.coordinates || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);

  const rankResults = (query: string, items: SearchResultItem[]) => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return [...items]
      .map(item => {
        const text = `${item.title} ${item.subtitle}`.toLowerCase();
        const matchCount = words.reduce((count, word) => (text.includes(word) ? count + 1 : count), 0);
        const institutionBoost =
          /college|school|university|hospital|institute|campus/i.test(text) ? 2 : 0;
        return { item, score: matchCount + institutionBoost };
      })
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.item);
  };

  const searchMapboxPlaces = async (q: string, proximity: [number, number]): Promise<SearchResultItem[]> => {
    const proximityParam = `${proximity[0]},${proximity[1]}`;
    const query =
      `q=${encodeURIComponent(q)}` +
      `&country=${encodeURIComponent(MAPBOX_COUNTRY)}` +
      `&language=${encodeURIComponent(MAPBOX_LANGUAGE)}` +
      `&types=${encodeURIComponent(MAPBOX_TYPES)}` +
      `&proximity=${encodeURIComponent(proximityParam)}`;

    try {
      const data = await apiGet(`/api/routes/geocode/search?${query}`);
      const features = Array.isArray(data?.features) ? data.features : [];
      const mapped = features
        .map((item: any) => {
          const coords = item?.center;
          if (!Array.isArray(coords) || coords.length !== 2) return null;
          if (typeof coords[0] !== 'number' || typeof coords[1] !== 'number') return null;
          return {
            id: String(item?.id || `${coords[0]}-${coords[1]}`),
            title: item?.text || item?.place_name || 'Place',
            subtitle: item?.place_name || '',
            center: [coords[0], coords[1]] as [number, number],
          } satisfies SearchResultItem;
        })
        .filter((item: SearchResultItem | null): item is SearchResultItem => Boolean(item));
      if (mapped.length) return mapped;
    } catch {}

    return searchWithNominatimDirect(q, MAPBOX_COUNTRY, MAPBOX_LANGUAGE);
  };

  const searchLocation = async () => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      const proximity = pickedCoord || DEFAULT_COORD;
      const results = await searchMapboxPlaces(q, proximity);
      setSearchResults(rankResults(q, results).slice(0, 10));
    } catch (error) {
      setSearchResults([]);
      const message = error instanceof Error ? error.message : 'Unable to fetch location suggestions.';
      Alert.alert('Search failed', `${message} Check internet and try again.`);
    } finally {
      setSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* TITLE */}
            <Text style={styles.title}>Blood Request Board</Text>
            <Text style={styles.subtitle}>
              Help save lives by posting urgent blood requests
            </Text>

            {/* FORM */}
            <Formik
              initialValues={{
                name: editRequest?.patientName || '',
                bloodgroup: editRequest?.bloodGroup || '',
                requesttype: editRequest?.requestType || '',
                hospitalname: editRequest?.hospitalName || '',
                hospitaladdr: editRequest?.address || '',
                patientattendername: '',
                patientattenderphno: editRequest?.phone || '',
                hospitallocation: editRequest?.location?.coordinates
                  ? `${editRequest.location.coordinates[0]}, ${editRequest.location.coordinates[1]}`
                  : '',
                requirebloodunit: editRequest?.units ? String(editRequest.units) : '',
                description: editRequest?.condition || '',
              }}
              validationSchema={userSchema}
              onSubmit={async (values, { resetForm }) => {
                const parts = values.hospitallocation.split(',').map(p => p.trim());
                if (parts.length !== 2) {
                  Alert.alert('Invalid location', 'Use "longitude, latitude" format.');
                  return;
                }
                const lon = Number(parts[0]);
                const lat = Number(parts[1]);
                if (Number.isNaN(lon) || Number.isNaN(lat)) {
                  Alert.alert('Invalid location', 'Coordinates must be numbers.');
                  return;
                }

                const payload = {
                  patientName: values.name,
                  bloodGroup: values.bloodgroup,
                  condition: values.description,
                  requestType: values.requesttype,
                  hospitalName: values.hospitalname,
                  units: Number(values.requirebloodunit || 1),
                  phone: values.patientattenderphno,
                  address: values.hospitaladdr,
                  notes: values.description,
                  location: { coordinates: [lon, lat] },
                };

                try {
                  if (editRequestId) {
                    await apiPut(`/api/requests/${editRequestId}`, payload);
                  } else {
                    await apiPost('/api/requests', payload);
                  }
                  resetForm({
                    values: {
                      name: '',
                      bloodgroup: '',
                      requesttype: '',
                      hospitalname: '',
                      hospitaladdr: '',
                      patientattendername: '',
                      patientattenderphno: '',
                      hospitallocation: '',
                      requirebloodunit: '',
                      description: '',
                    },
                  });
                  setPickedCoord(null);
                  setSearchQuery('');
                  setSearchResults([]);
                  navigation.navigate('Home');
                } catch (err) {
                  const message =
                    err instanceof Error ? err.message : 'Request failed';
                  Alert.alert('Request failed', message);
                }
              }}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                handleSubmit,
                setFieldValue,
                submitCount,
              }) => (
                <View style={styles.form}>
                  <Input
                    label="Patient Name"
                    value={values.name}
                    onChangeText={handleChange('name')}
                    onBlur={handleBlur('name')}
                    error={(touched.name || submitCount > 0) && errors.name}
                    helperText='Format: alphabets only (e.g., "Rahul Kumar")'
                  />

                  <View style={styles.row}>
                    <Input
                      label="Blood Group"
                      value={values.bloodgroup}
                      onChangeText={handleChange('bloodgroup')}
                      onBlur={handleBlur('bloodgroup')}
                      error={(touched.bloodgroup || submitCount > 0) && errors.bloodgroup}
                      style={{ width: '48%' }}
                      helperText='Format: O+, O-, A+, A-, B+, B-, AB+, AB-'
                    />
                    <Input
                      label="Request Type"
                      value={values.requesttype}
                      onChangeText={handleChange('requesttype')}
                      onBlur={handleBlur('requesttype')}
                      error={(touched.requesttype || submitCount > 0) && errors.requesttype}
                      style={{ width: '48%' }}
                      helperText='Format: Emergency / Planned / Replacement'
                    />
                  </View>

                  <Input
                    label="Hospital Name"
                    value={values.hospitalname}
                    onChangeText={handleChange('hospitalname')}
                    onBlur={handleBlur('hospitalname')}
                    error={(touched.hospitalname || submitCount > 0) && errors.hospitalname}
                    helperText='Format: official name (e.g., "Apollo Hospital")'
                  />

                  <Input
                    label="Hospital Address"
                    value={values.hospitaladdr}
                    onChangeText={handleChange('hospitaladdr')}
                    onBlur={handleBlur('hospitaladdr')}
                    error={(touched.hospitaladdr || submitCount > 0) && errors.hospitaladdr}
                    helperText='Format: street, area, city'
                  />

                  <Input
                    label="Contact Number"
                    value={values.patientattenderphno}
                    onChangeText={handleChange('patientattenderphno')}
                    onBlur={handleBlur('patientattenderphno')}
                    error={(touched.patientattenderphno || submitCount > 0) && errors.patientattenderphno}
                    keyboardType="phone-pad"
                    helperText='Format: mobile number for responder contact'
                  />

                  <TouchableOpacity
                    style={styles.locationInput}
                    onPress={() => {
                      const existing = parseCoordString(values.hospitallocation);
                      if (existing) {
                        setPickedCoord(existing);
                      }
                      setLocationPickerOpen(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.label}>Hospital Location</Text>
                    {(touched.hospitallocation || submitCount > 0) && errors.hospitallocation ? (
                      <Text style={styles.error}>{errors.hospitallocation}</Text>
                    ) : null}
                    <View style={styles.locationBox}>
                      <Text style={styles.locationText}>
                        {values.hospitallocation
                          ? values.hospitallocation
                          : 'Tap to pick location on map'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <Input
                    label="Required Blood Units"
                    value={values.requirebloodunit}
                    onChangeText={handleChange('requirebloodunit')}
                    onBlur={handleBlur('requirebloodunit')}
                    error={
                      (touched.requirebloodunit || submitCount > 0) &&
                      errors.requirebloodunit
                    }
                    helperText='Format: number only (e.g., 1, 2, 3)'
                  />

                  <Input
                    label="Patient Condition"
                    value={values.description}
                    onChangeText={handleChange('description')}
                    onBlur={handleBlur('description')}
                    error={(touched.description || submitCount > 0) && errors.description}
                    multiline
                    helperText='Format: short summary (e.g., "Severe blood loss after surgery")'
                  />

                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleSubmit}
                  >
                    <Text style={styles.buttonText}>
                      Post Request
                    </Text>
                  </TouchableOpacity>

                  <Modal
                    visible={locationPickerOpen}
                    animationType="slide"
                    onRequestClose={() => setLocationPickerOpen(false)}
                  >
                    <View style={styles.pickerContainer}>
                      <View style={styles.pickerHeader}>
                        <Text style={styles.pickerTitle}>Pick Hospital Location</Text>
                        <TouchableOpacity
                          onPress={() => setLocationPickerOpen(false)}
                          style={styles.closeButton}
                        >
                          <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.searchBar}>
                        <TextInput
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          placeholder="Search place or address"
                          style={styles.searchInput}
                          returnKeyType="search"
                          onSubmitEditing={searchLocation}
                        />
                        <TouchableOpacity
                          style={styles.searchButton}
                          onPress={searchLocation}
                        >
                          <Text style={styles.searchButtonText}>Search</Text>
                        </TouchableOpacity>
                      </View>

                      {searching ? (
                        <View style={styles.searchLoading}>
                          <ActivityIndicator />
                          <Text style={styles.searchLoadingText}>Searching...</Text>
                        </View>
                      ) : null}

                      {searchResults.length > 0 ? (
                        <ScrollView
                          style={styles.searchResults}
                          keyboardShouldPersistTaps="handled"
                        >
                          {searchResults.map(item => (
                            <TouchableOpacity
                              key={item.id}
                              style={styles.searchResultItem}
                              onPress={() => {
                                setPickedCoord(item.center);
                                setSearchQuery(item.title);
                                setSearchResults([]);
                                Keyboard.dismiss();
                              }}
                            >
                              <Text style={styles.searchResultTitle}>
                                {item.title}
                              </Text>
                              <Text style={styles.searchResultSubtitle}>
                                {item.subtitle}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      ) : null}

                      <View style={styles.pickerMapWrap}>
                        {hasMapToken ? (
                          <MapView
                            style={styles.pickerMap}
                            styleURL="mapbox://styles/mapbox/satellite-streets-v12"
                            onPress={event => {
                              const geometry = event?.geometry;
                              const coords =
                                geometry && 'coordinates' in geometry
                                  ? geometry.coordinates
                                  : null;
                              if (
                                Array.isArray(coords) &&
                                coords.length === 2 &&
                                typeof coords[0] === 'number' &&
                                typeof coords[1] === 'number'
                              ) {
                                setPickedCoord([coords[0], coords[1]]);
                              }
                            }}
                          >
                            <Camera
                              centerCoordinate={pickedCoord || DEFAULT_COORD}
                              zoomLevel={12}
                              animationDuration={300}
                            />
                            {pickedCoord ? (
                              <ShapeSource
                                id="pickedPoint"
                                shape={{
                                  type: 'FeatureCollection',
                                  features: [
                                    {
                                      type: 'Feature',
                                      geometry: {
                                        type: 'Point',
                                        coordinates: pickedCoord,
                                      },
                                      properties: {},
                                    },
                                  ],
                                }}
                              >
                                <CircleLayer
                                  id="pickedCircle"
                                  style={{
                                    circleRadius: 7,
                                    circleColor: '#F82306',
                                    circleStrokeWidth: 2,
                                    circleStrokeColor: '#FFFFFF',
                                  }}
                                />
                              </ShapeSource>
                            ) : null}
                          </MapView>
                        ) : (
                          <View style={styles.mapUnavailable}>
                            <Text style={styles.mapUnavailableText}>
                              Map unavailable: configure MAPBOX_PUBLIC_TOKEN.
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.pickerFooter}>
                        <TouchableOpacity
                          style={styles.secondaryButton}
                          onPress={() => setLocationPickerOpen(false)}
                        >
                          <Text style={styles.secondaryButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.primaryButton}
                          onPress={() => {
                            if (pickedCoord) {
                              const value = `${pickedCoord[0].toFixed(6)}, ${pickedCoord[1].toFixed(6)}`;
                              setFieldValue('hospitallocation', value);
                              setLocationPickerOpen(false);
                            } else {
                              Alert.alert('Pick a location', 'Tap on the map to choose a location.');
                            }
                          }}
                        >
                          <Text style={styles.primaryButtonText}>Use This Location</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Modal>
                </View>
              )}
            </Formik>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ================= REUSABLE INPUT ================= */
function Input({
  label,
  helperText,
  error,
  style,
  multiline,
  ...props
}: any) {
  return (
    <View style={[styles.inputWrap, style]}>
      <Text style={styles.label}>{label}</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <TextInput
        style={[
          styles.input,
          multiline && {
            height: 100,
            textAlignVertical: 'top',
          },
        ]}
        multiline={multiline}
        {...props}
      />
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    color: '#000',
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    marginBottom: 16,
  },

  /* CARD */
  form: {
    backgroundColor: '#FFFDF4',
    borderRadius: 14,
    padding: 16,

    borderWidth: 1,
    borderColor: '#E0E0E0',

    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 14,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  inputWrap: {
    marginBottom: 14,
  },
  label: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    height: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#CFCFCF',
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginBottom: 4,
  },
  helperText: {
    color: '#777',
    fontSize: 11,
    marginTop: 4,
  },

  button: {
    backgroundColor: '#E53935',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },

  locationInput: {
    marginBottom: 14,
  },
  locationBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    height: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#CFCFCF',
    justifyContent: 'center',
  },
  locationText: {
    color: '#333',
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F3F3',
  },
  closeText: {
    color: '#111',
    fontWeight: '600',
  },
  pickerMapWrap: {
    flex: 1,
  },
  pickerMap: {
    flex: 1,
  },
  mapUnavailable: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  mapUnavailableText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    paddingHorizontal: 10,
  },
  searchButton: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  searchLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 6,
    gap: 8,
  },
  searchLoadingText: {
    color: '#666',
  },
  searchResults: {
    maxHeight: 160,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchResultItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  searchResultTitle: {
    fontWeight: '600',
    color: '#111',
  },
  searchResultSubtitle: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  pickerFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  secondaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#F82306',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
});

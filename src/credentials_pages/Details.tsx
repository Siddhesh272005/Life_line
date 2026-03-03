import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Ionicons from '@react-native-vector-icons/ionicons';
import { pick, types } from '@react-native-documents/picker';
import { apiPost } from '../api/client';
import { useAuth } from '../context/AuthContext';

/* ================= VALIDATION ================= */

const civilianSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
  bloodgroup: Yup.string().required('Required'),
  gender: Yup.string().required('Required'),
  dob: Yup.string().required('Required'),
  age: Yup.string().required('Required'),
  city: Yup.string().required('Required'),
  address: Yup.string().required('Required'),
  phone: Yup.string().required('Required'),
  lastDonation: Yup.string(),
});

const orgSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
  license: Yup.string().required('Required'),
  contactPerson: Yup.string().required('Required'),
  phone: Yup.string().required('Required'),
  address: Yup.string().required('Required'),
  city: Yup.string().required('Required'),
  pincode: Yup.string().required('Required'),
});

/* ================= MAIN ================= */

export default function UserDetails() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { setAuth } = useAuth();

  const { userType } = route.params; // civilian | hospital | ngo
  const validationSchema = userType === 'civilian' ? civilianSchema : orgSchema;

  const handleDocumentPick = async (setFieldValue: any) => {
    try {
      const doc = await pick({ type: [types.pdf] });
      setFieldValue('document', doc);
    } catch {}
  };

  return (
    <SafeAreaView style={styles.background}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ===== TITLE ===== */}
        <Text style={styles.title}>
          {userType === 'civilian' && 'Civilian Details'}
          {userType === 'hospital' && 'Hospital Details'}
          {userType === 'ngo' && 'NGO Details'}
        </Text>

        <Formik
          initialValues={{
            name: '',
            bloodgroup: '',
            gender: '',
            dob: '',
            age: '',
            city: '',
            address: '',
            phone: '',
            lastDonation: '',
            license: '',
            contactPerson: '',
            pincode: '',
            document: null,
          }}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            const email = route.params.signupEmail;
            const password = route.params.signupPassword;
            if (!email || !password) {
              Alert.alert(
                'Missing signup info',
                'Please restart signup from the Sign Up screen.'
              );
              return;
            }
            const profile =
              userType === 'civilian'
                ? {
                    bloodGroup: values.bloodgroup,
                    gender: values.gender,
                    dob: values.dob,
                    age: Number(values.age || 0),
                    city: values.city,
                    address: values.address,
                    lastDonation: values.lastDonation,
                  }
                : {
                    licenseId: values.license,
                    contactPerson: values.contactPerson,
                    city: values.city,
                    address: values.address,
                    pincode: values.pincode,
                  };

            const payload = {
              email,
              password,
              role: userType,
              name: values.name,
              phone: values.phone,
              profile,
            };

            try {
              const data = await apiPost('/api/auth/register', payload);
              setAuth(data.token, data.user);
              navigation.reset({
                index: 0,
                routes: [{ name: 'AppDrawer', params: { userType: route.params.userType } }],
              });
            } catch (err) {
              const message =
                err instanceof Error ? err.message : 'Request failed';
              const normalized = message.toLowerCase();

              if (normalized.includes('email already registered')) {
                Alert.alert(
                  'Email already registered',
                  'Please log in with this email.'
                );
                navigation.navigate('Login', { userType });
                return;
              }

              if (
                normalized.includes('profile') ||
                normalized.includes('details') ||
                normalized.includes('incomplete') ||
                normalized.includes('missing')
              ) {
                Alert.alert(
                  'Incomplete details',
                  'Please fill your details from Profile.'
                );
                return;
              }

              Alert.alert('Sign Up Failed', message);
            }
          }}
        >
          {({
            errors,
            handleChange,
            handleSubmit,
            setFieldValue,
          }) => (
            <View style={styles.card}>
              {/* ===== CIVILIAN INPUTS ===== */}
              {userType === 'civilian' && (
                <>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput style={styles.input} onChangeText={handleChange('name')} />
                  <Text style={styles.helperText}>Enter your full legal name</Text>

                  <Text style={styles.label}>Blood Group</Text>
                  <TextInput style={styles.input} onChangeText={handleChange('bloodgroup')} />
                  <Text style={styles.helperText}>Example: A+, O-, AB+</Text>

                  <Text style={styles.label}>Gender</Text>
                  <TextInput style={styles.input} onChangeText={handleChange('gender')} />
                  <Text style={styles.helperText}>Enter your gender as on official records</Text>

                  <Text style={styles.label}>Date of Birth</Text>
                  <TextInput style={styles.input} onChangeText={handleChange('dob')} />
                  <Text style={styles.helperText}>Use format DD/MM/YYYY</Text>

                  <Text style={styles.label}>Age</Text>
                  <TextInput style={styles.input} onChangeText={handleChange('age')} />
                  <Text style={styles.helperText}>Enter age in years</Text>

                  <Text style={styles.label}>City</Text>
                  <TextInput style={styles.input} onChangeText={handleChange('city')} />
                  <Text style={styles.helperText}>Enter your current city</Text>

                  <Text style={styles.label}>Address</Text>
                  <TextInput style={styles.input} onChangeText={handleChange('address')} />
                  <Text style={styles.helperText}>Enter complete address with area/locality</Text>

                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput style={styles.input} onChangeText={handleChange('phone')} />
                  <Text style={styles.helperText}>Enter a reachable 10-digit mobile number</Text>

                  <Text style={styles.label}>Last Donation Date</Text>
                  <TextInput
                    style={styles.input}
                    onChangeText={handleChange('lastDonation')}
                  />
                  <Text style={styles.helperText}>Optional: Use DD/MM/YYYY if you donated before</Text>
                </>
              )}

              {/* ===== HOSPITAL / NGO INPUTS ===== */}
              {userType !== 'civilian' && (
                <>
                  <Text style={styles.label}>
                    {userType === 'hospital' ? 'Hospital Name' : 'NGO Name'}
                  </Text>
                  <TextInput style={styles.input} onChangeText={handleChange('name')} />
                  <Text style={styles.helperText}>
                    {userType === 'hospital'
                      ? 'Enter registered hospital name'
                      : 'Enter registered NGO name'}
                  </Text>

                  <Text style={styles.label}>License ID</Text>
                  <TextInput style={styles.input} onChangeText={handleChange('license')} />
                  <Text style={styles.helperText}>Enter valid license or registration ID</Text>

                  <Text style={styles.label}>Contact Person</Text>
                  <TextInput
                    style={styles.input}
                    onChangeText={handleChange('contactPerson')}
                  />
                  <Text style={styles.helperText}>Provide primary coordinator name</Text>

                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput style={styles.input} onChangeText={handleChange('phone')} />
                  <Text style={styles.helperText}>Enter an active contact number</Text>

                  <Text style={styles.label}>Address</Text>
                  <TextInput style={styles.input} onChangeText={handleChange('address')} />
                  <Text style={styles.helperText}>Enter complete office/hospital address</Text>

                  <Text style={styles.label}>City</Text>
                  <TextInput style={styles.input} onChangeText={handleChange('city')} />
                  <Text style={styles.helperText}>Enter operating city</Text>

                  <Text style={styles.label}>Pincode</Text>
                  <TextInput style={styles.input} onChangeText={handleChange('pincode')} />
                  <Text style={styles.helperText}>Enter 6-digit pincode</Text>
                </>
              )}

              {/* ===== DOCUMENT ===== */}
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => handleDocumentPick(setFieldValue)}
              >
                <Ionicons name="push-outline" size={22} />
                <Text style={styles.uploadText}>Upload Verification ID</Text>
              </TouchableOpacity>
              <Text style={styles.helperText}>
                Example: Aadhaar card or PAN card (PDF)
              </Text>

              {/* ===== SUBMIT ===== */}
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitText}>Sign Up</Text>
              </TouchableOpacity>

              {Object.keys(errors).length > 0 && (
                <Text style={styles.errorText}>
                  Please fill all required fields
                </Text>
              )}
            </View>
          )}
        </Formik>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 6,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
    paddingLeft: 6,
  },

  card: {
    backgroundColor: '#FFFDF4',
    borderRadius: 4,
    padding: 16,
    marginHorizontal: 6,
    elevation: 12,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 10,
  },

  input: {
    height: 46,
    backgroundColor: '#F1F1F1',
    borderRadius: 8,
    paddingHorizontal: 10,
  },

  helperText: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 4,
  },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    backgroundColor: '#D9D9D9',
    borderRadius: 8,
    marginTop: 16,
  },

  uploadText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '600',
  },

  submitBtn: {
    marginTop: 20,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#D83737',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },

  submitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  errorText: {
    marginTop: 10,
    color: 'red',
    textAlign: 'center',
  },
});

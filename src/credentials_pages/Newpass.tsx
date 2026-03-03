import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import {
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { AppNavigationProp, RootStackParamList } from '../types';

import * as Yup from 'yup';
import { Formik } from 'formik';

/* ---------- Validation ---------- */
const userSchema = Yup.object().shape({
  password: Yup.string().required('Fill the column'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match')
    .required('Please re-enter password'),
});

export default function Newpass() {
  const navigation = useNavigation<AppNavigationProp>();
  const route =
    useRoute<RouteProp<RootStackParamList, 'Newpass'>>();

  const { userType } = route.params;

  return (
    <SafeAreaView style={styles.background}>
      <Formik
        initialValues={{
          password: '',
          confirmPassword: '',
        }}
        validationSchema={userSchema}
        onSubmit={values => {
          console.log(values);
          navigation.navigate('Login', {userType});
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleSubmit,
        }) => (
          <>
            {/* HEADER */}
            <View style={styles.header}>
              <Pressable
                onPress={() =>
                  navigation.navigate('Forget', {
                    userType,
                  })
                }
              >
                <Ionicons
                  name="arrow-back-outline"
                  size={32}
                />
              </Pressable>
              <Text style={styles.headerText}>
                Enter New Password
              </Text>
            </View>

            {/* CARD */}
            <View style={styles.card}>
              <Text style={styles.label}>New Password</Text>
              {touched.password && errors.password && (
                <Text style={styles.error}>
                  {errors.password}
                </Text>
              )}
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                secureTextEntry
                value={values.password}
                onChangeText={handleChange('password')}
              />

              <Text style={styles.label}>
                Confirm Password
              </Text>
              {touched.confirmPassword &&
                errors.confirmPassword && (
                  <Text style={styles.error}>
                    {errors.confirmPassword}
                  </Text>
                )}
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                secureTextEntry
                value={values.confirmPassword}
                onChangeText={handleChange(
                  'confirmPassword',
                )}
              />

              <Pressable
                android_ripple={{
                  color: 'rgba(255,255,255,0.15)',
                }}
                style={styles.btn}
                onPress={handleSubmit}
              >
                <Text style={styles.btnText}>
                  Confirm New Password
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </Formik>
    </SafeAreaView>
  );
}

/* ---------- Styles (Android-only) ---------- */
const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },

  headerText: {
    fontSize: 26,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  card: {
    backgroundColor: '#FFFDF4',
    borderRadius: 16,
    padding: 20,
    elevation: 6,
  },

  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },

  input: {
    backgroundColor: '#D9D9D9',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 4,
  },

  btn: {
    backgroundColor: '#D83737',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    overflow: 'hidden',
  },

  btnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  error: {
    color: 'red',
    marginTop: 2,
  },
});

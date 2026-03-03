import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AppNavigationProp, RootStackParamList } from '../types';

import * as Yup from 'yup';
import { Formik } from 'formik';

/* ---------- Validation ---------- */
const userSchema = Yup.object().shape({
  email: Yup.string().email().required('Fill the column'),
});

export default function ForgotPassword() {
  const navigation = useNavigation<AppNavigationProp>();
  const route =
    useRoute<RouteProp<RootStackParamList, 'Forget'>>();

  const { userType } = route.params;

  return (
    <SafeAreaView style={styles.background}>
      <Formik
        initialValues={{ email: '' }}
        validationSchema={userSchema}
        onSubmit={values => {
          console.log(values);
          navigation.navigate('Newpass', {userType});
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
            {/* HEADER (same style as login/signup) */}
            <View style={styles.header}>
              <Pressable
                onPress={() => navigation.navigate('Login',{userType})}
              >
                <Ionicons
                  name="arrow-back-outline"
                  size={32}
                />
              </Pressable>
              <Text style={styles.headerText}>Back to Login</Text>
            </View>

            {/* CARD */}
            <View style={styles.card}>
              <Text style={styles.title}>Forgot Password</Text>
              <Text style={styles.subtitle}>
                Enter your email to reset your password
              </Text>

              <Text style={styles.label}>Email</Text>
              {touched.email && errors.email && (
                <Text style={styles.error}>{errors.email}</Text>
              )}

              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={values.email}
                onChangeText={handleChange('email')}
              />

              <TouchableOpacity
                style={styles.btn}
                onPress={handleSubmit}
              >
                <Text style={styles.btnText}>
                  Change Password
                </Text>
              </TouchableOpacity>
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

  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  subtitle: {
    fontSize: 16,
    marginTop: 6,
    marginBottom: 16,
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

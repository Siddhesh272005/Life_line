import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AppNavigationProp, RootStackParamList } from '../types';

import * as Yup from 'yup';
import { Formik } from 'formik';

/* ---------- Validation ---------- */
const userSchema = Yup.object().shape({
  email: Yup.string().email().required('Fill the column'),
  password: Yup.string().required('Fill the column'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match')
    .required('Please re-enter password'),
});

/* ---------- Config by user type ---------- */
const SIGNUP_CONFIG = {
  civilian: {
    title: 'Civilian Account',
    subtitle: 'For individual donors and requestors',
    icon: require('../../assets/civilian_icon.png'),
    next: 'Civiliandetails',
    login: 'Civilianlogin',
  },
  hospital: {
    title: 'Hospital Account',
    subtitle: 'For healthcare facilities and medical centers',
    icon: require('../../assets/hospital_icon.png'),
    next: 'Hospitaldetails',
    login: 'Hospitallogin',
  },
  ngo: {
    title: 'NGO Account',
    subtitle: 'For non-profit organizations and charities',
    icon: require('../../assets/ngo_icon.png'),
    next: 'Ngodetails',
    login: 'Ngologin',
  },
};

export default function Signup() {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'Signup'>>();

  const { userType } = route.params;
  const config = SIGNUP_CONFIG[userType];

  return (
    <SafeAreaView style={styles.background}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <Formik
            initialValues={{
              email: '',
              password: '',
              confirmPassword: '',
            }}
            validationSchema={userSchema}
            onSubmit={values => {
              navigation.navigate('Details',{
                userType,
                signupEmail: values.email,
                signupPassword: values.password,
              });
            }}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              submitCount,
            }) => (
              <>
                {/* HEADER — SAME AS LOGIN */}
                <View style={styles.uppercontainer}>
                  <Text style={styles.headerText}>Sign Up</Text>
                </View>

                {/* CARD */}
                <View style={styles.card}>
                  {/* Account Info */}
                  <View style={styles.middlecontainer}>
                    <Image source={config.icon} />
                    <Text style={styles.title}>{config.title}</Text>
                    <Text style={styles.subtitle}>{config.subtitle}</Text>
                  </View>

                  {/* FORM */}
                  <View>
                    <Text style={styles.label}>Email</Text>
                    {(touched.email || submitCount > 0) && errors.email && (
                      <Text style={styles.error}>{errors.email}</Text>
                    )}
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      value={values.email}
                      onChangeText={handleChange('email')}
                      onBlur={handleBlur('email')}
                    />

                    <Text style={styles.label}>New Password</Text>
                    {(touched.password || submitCount > 0) && errors.password && (
                      <Text style={styles.error}>{errors.password}</Text>
                    )}
                    <TextInput
                      style={styles.input}
                      placeholder="Enter password"
                      secureTextEntry
                      value={values.password}
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                    />

                    <Text style={styles.label}>Confirm Password</Text>
                    {(touched.confirmPassword || submitCount > 0) &&
                      errors.confirmPassword && (
                        <Text style={styles.error}>
                          {errors.confirmPassword}
                        </Text>
                      )}
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm password"
                      secureTextEntry
                      value={values.confirmPassword}
                      onChangeText={handleChange('confirmPassword')}
                      onBlur={handleBlur('confirmPassword')}
                    />

                    {/* BUTTON */}
                    <TouchableOpacity
                      style={styles.btn}
                      onPress={handleSubmit}
                    >
                      <Text style={styles.btnText}>Proceed</Text>
                    </TouchableOpacity>

                    {/* FOOTER */}
                    <View style={styles.footerRow}>
                      <Text>Already have an account?</Text>
                      <Pressable
                        onPress={() =>
                          navigation.navigate('Login',{userType})
                        }
                      >
                        <Text style={styles.link}> Login</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </>
            )}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- Styles (Android-only, matched with Login) ---------- */
const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  scroll: {
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 30,
  },

  uppercontainer: {
    height: 60,
    justifyContent: 'center',
  },

  headerText: {
    fontSize: 26,
    fontWeight: 'bold',
    marginLeft: 10,
    marginTop: -40,
  },

  card: {
    backgroundColor: '#FFFDF4',
    borderRadius: 16,
    padding: 20,
    elevation: 6,
  },

  middlecontainer: {
    alignItems: 'center',
    marginBottom: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
  },

  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },

  input: {
    backgroundColor: '#F1F1F1',
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
    marginTop: 20,
    overflow: 'hidden',
  },

  btnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },

  link: {
    color: '#DF2828',
    fontWeight: 'bold',
  },

  error: {
    color: 'red',
    marginTop: 2,
  },
});

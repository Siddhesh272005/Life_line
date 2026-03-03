import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AppNavigationProp, RootStackParamList } from '../types';
import { apiPost } from '../api/client';
import { useAuth } from '../context/AuthContext';

import * as Yup from 'yup';
import { Formik } from 'formik';

/* ---------- Validation ---------- */
const userSchema = Yup.object().shape({
  email: Yup.string().email().required('Email is required'),
  password: Yup.string().required('Password is required'),
});

/* ---------- Config by user type ---------- */
const LOGIN_CONFIG = {
  hospital: {
    title: 'Hospital Account',
    subtitle: 'For healthcare facilities and medical centers',
    icon: require('../../assets/hospital_icon.png'),
    tabs: 'HospitalTabs',
    forgot: 'Hospitalforget',
    signup: 'Hospitalsignup',
  },
  civilian: {
    title: 'Civilian Account',
    subtitle: 'For individual donors and requestors',
    icon: require('../../assets/civilian_icon.png'),
    tabs: 'CivilianTabs',
    forgot: 'Civilianforget',
    signup: 'Civiliansignup',
  },
  ngo: {
    title: 'NGO Account',
    subtitle: 'For non-profit organizations and charities',
    icon: require('../../assets/ngo_icon.png'),
    tabs: 'NgoTabs',
    forgot: 'Ngoforget',
    signup: 'Ngosignup',
  },
};

export default function Login() {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'Login'>>();
  const { setAuth } = useAuth();

  const { userType } = route.params;
  const config = LOGIN_CONFIG[userType];

  return (
    <SafeAreaView style={styles.background}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={styles.backBtn}
              onPress={() => navigation.navigate('Domain')}
            >
              <Ionicons name="arrow-back-outline" size={28} />
            </Pressable>
            <Text style={styles.headerTitle}>Login</Text>
          </View>

          {/* Single Container */}
          <View style={styles.container}>
            <Image source={config.icon} style={styles.icon} />

            <Text style={styles.accountTitle}>{config.title}</Text>
            <Text style={styles.subtitle}>{config.subtitle}</Text>

            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={userSchema}
              onSubmit={async (values) => {
                try {
                  const data = await apiPost('/api/auth/login', values);
                  if (data?.user?.role && data.user.role !== userType) {
                    Alert.alert(
                      'Wrong account type',
                      `This email is registered as ${data.user.role}. Please select the correct account type.`
                    );
                    return;
                  }
                  setAuth(data.token, data.user);
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'AppDrawer', params: { userType: route.params.userType } }],
                  });
                } catch (err) {
                  const message =
                    err instanceof Error ? err.message : 'Login failed';
                  Alert.alert('Login failed', message);
                }
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
                  {/* Email */}
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={[
                      styles.input,
                      touched.email && errors.email && styles.inputError,
                    ]}
                    placeholder="Enter your email"
                    placeholderTextColor="#777"
                    value={values.email}
                    onChangeText={handleChange('email')}
                  />
                  {touched.email && errors.email && (
                    <Text style={styles.error}>{errors.email}</Text>
                  )}

                  {/* Password */}
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={[
                      styles.input,
                      touched.password && errors.password && styles.inputError,
                    ]}
                    placeholder="Enter your password"
                    placeholderTextColor="#777"
                    secureTextEntry
                    value={values.password}
                    onChangeText={handleChange('password')}
                  />
                  {touched.password && errors.password && (
                    <Text style={styles.error}>{errors.password}</Text>
                  )}

                  <Pressable onPress={() => navigation.navigate('Forget',{userType})}>
                    <Text style={styles.link}>Forgot Password?</Text>
                  </Pressable>

                
                  <TouchableOpacity style={styles.cardButton} onPress={handleSubmit}>
                    <Text style={styles.loginText}>Login</Text>
                  </TouchableOpacity>
              

                  <View style={styles.signupRow}>
                    <Text style={styles.signupText}>Don't have an account?</Text>
                    <Pressable onPress={() => navigation.navigate('Signup', {userType})}>
                      <Text style={styles.signupLink}> Sign Up</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </Formik>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- Modern Android Styles (Single Container) ---------- */
const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 8,
  },

  /* Main Container */
  container: {
    backgroundColor: '#FFFDF4',
    borderRadius: 20,
    padding: 22,
    elevation: 5,
    width: '94%',         
    alignSelf: 'center',   
    marginTop: 20,         
  },


  icon: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  accountTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 18,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F1F1F1',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#DF2828',
  },
  error: {
    color: '#DF2828',
    fontSize: 13,
    marginTop: 2,
  },
  link: {
    color: '#DF2828',
    marginTop: 10,
    fontWeight: '600',
  },

  cardButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#D83737',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,

    // Android shadow only
    elevation: 4,
  },

  loginText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.6,
  },

  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },

  signupText: {
    fontSize: 14,
    color: '#333',
  },

  signupLink: {
    color: '#DF2828',
    fontWeight: '700',
    fontSize: 14,
  },

});

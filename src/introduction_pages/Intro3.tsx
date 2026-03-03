import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../types';


export default function Intro3() {

  const navigation = useNavigation<AppNavigationProp>();

  return (
    <SafeAreaView style={styles.background}>
      <View style={styles.uppercontainer}>
        <Pressable>
          <Text style={{fontWeight: 'bold',fontSize: 18,paddingRight: 5}}>Skip</Text>
        </Pressable>
      </View>
      <View style={styles.middlecontainer}>
        <Image
          source={require('../../assets/recongnition.png')}
          style={{transform:[{translateY: -90}]}}
        />
        <Text style={{fontWeight:'bold', fontSize: 26,transform:[{translateY: -30}]}}>
          Earn Recognition & Badges
        </Text>
        <Text style={{paddingHorizontal: 20, textAlign: 'center', fontSize: 18}}>
          Get recognized for your contributions with badges and certificates of appreciation
        </Text>
      </View>
      <View style={styles.lowwercontainer}>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Domain')}>
          <Text style={{fontWeight: 'bold', color:'#FFFFFF', fontSize: 26}}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  background: {
    backgroundColor: '#FFFFFF',
    height: '100%',
    padding: 8,
  },
  uppercontainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  middlecontainer: {
    flex: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lowwercontainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn:{
    backgroundColor: '#D83737',
    width: '100%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
})

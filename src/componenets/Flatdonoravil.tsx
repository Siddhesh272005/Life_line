import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import BouncyCheckbox from 'react-native-bouncy-checkbox';

type Props = {
  id: string | number;
  name: string;
  place: string;
  onSelect: (id: string, checked: boolean) => void;
  reset: boolean;
};

export default function Flatdonoravil({
  id,
  name,
  place,
  onSelect,
  reset,
}: Props) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(false);
  }, [reset]);

  return (
    <View style={styles.container}>
      <View style={styles.first}>
        <Ionicons name="person-outline" size={22} color="#C11717" />
      </View>

      <View style={styles.second}>
        <Text style={styles.text}>{name.toUpperCase()}</Text>
        <Text style={styles.placeText}>{place}</Text>
      </View>

      <View style={styles.third}>
        <BouncyCheckbox
          isChecked={checked}
          fillColor="#C11717"
          unFillColor="#FFF"
          iconStyle={{ borderColor: '#C11717', borderRadius: 6 }}
          innerIconStyle={{ borderWidth: 2 }}
          onPress={(isChecked: boolean) => {
            setChecked(isChecked);
            onSelect(String(id), isChecked);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 66,
    width: '100%',
    backgroundColor: '#FFFDF4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFD8D8',
    marginBottom: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  first: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FDEBEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  second: {
    flex: 1,
    paddingLeft: 10,
  },
  third: {
    paddingRight: 6,
  },
  text: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F1F1F',
  },
  placeText: {
    marginTop: 2,
    color: '#6D6D6D',
  },
});

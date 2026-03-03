import React,{PropsWithChildren} from 'react';
import {
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';


type tokendporps = PropsWithChildren <{
  name: string;
  points: number;
  image: ReturnType<typeof require>;
}>



export default function token(props: tokendporps) {
  return (
     <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <Image
        source={
          typeof props.image === 'string' ? { uri: props.image } : props.image
        }
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.name}>{props.name}</Text>
      <Text style={styles.points}>{props.points} pts</Text>
    </TouchableOpacity>
  )
}


const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    alignItems: 'center',
    padding: 12,
    marginVertical: 10,
    width: screenWidth / 2.3, // fits 2 columns nicely
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginHorizontal: 6,
  },
  image: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  points: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
})
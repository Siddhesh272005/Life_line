import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Flatrewards from '../componenets/Flatrewards';
import { apiGet } from '../api/client';

const getRewardImage = (key: string) => {
  if (key === 'amazon') return require('../../assets/amazon.webp');
  if (key === 'flipkart') return require('../../assets/flipkart.webp');
  return require('../../assets/coin.png');
};

export default function Rewards() {
  const [points, setPoints] = React.useState(0);
  const [offers, setOffers] = React.useState<RewardToken[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await apiGet('/api/users/rewards');
        setPoints(Number(data?.points || 0));
        setOffers(
          Array.isArray(data?.offers)
            ? data.offers.map((item: any, index: number) => ({
                id: index + 1,
                name: item.name || 'Reward',
                points: Number(item.points || 0),
                image: getRewardImage(item.image || ''),
              }))
            : []
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load rewards';
        Alert.alert('Rewards Error', message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pointsCard}>
        <View style={styles.pointsLeft}>
          <Image source={require('../../assets/coin.png')} style={styles.coin} />
          <Text style={styles.pointsText}>{points}</Text>
        </View>
        <Text style={styles.pointsLabel}>Reward Points</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={offers}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <Flatrewards {...item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  pointsCard: {
    margin: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFF8E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
  },
  pointsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coin: {
    height: 50,
    width: 50,
    marginRight: 12,
  },
  pointsText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
  },
  pointsLabel: {
    fontSize: 14,
    color: '#555',
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
});

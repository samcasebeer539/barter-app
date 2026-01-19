import { View, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import CardWheel from '../components/CardWheel';

export default function BarterScreen() {
  const sampleCards = [
    {
      title: 'Vintage Bike',
      photo: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800',
    },
    {
      title: 'Classic Camera',
      photo: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800',
    },
    {
      title: 'Acoustic Guitar',
      photo: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800',
    },
    {
      title: 'Leather Boots',
      photo: 'https://images.unsplash.com/photo-1542280756-74b2f55e73ab?w=800',
    },
    {
      title: 'Vintage Watch',
      photo: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800',
    },
    {
      title: 'Coffee Maker',
      photo: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Text style={styles.instructions}>Swipe left or right to spin the wheel</Text>
      
      <CardWheel cards={sampleCards} radius={350} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  instructions: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
});

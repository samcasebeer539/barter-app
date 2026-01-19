import { View, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import CardWheel from '../components/CardWheel';

export default function BarterScreen() {
  const sampleCards = [
    {
      title: 'accept/decline',
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
  ];

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      
      <View style={{ marginTop: 1000 }}>
        <CardWheel cards={sampleCards} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },

});

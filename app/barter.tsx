import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import CardWheel from '../components/CardWheel';
import Deck from '../components/Deck';

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
  ];

  const samplePost = {
    type: 'good' as const,
    name: 'Vintage Leather Jacket',
    description: 'Beautiful vintage leather jacket in excellent condition. Worn only a few times. Perfect for motorcycle enthusiasts or anyone looking for a classic style. This jacket has a timeless design with quality craftsmanship that you just don\'t see anymore.',
    photos: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
      'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=800',
    ],
  };

  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <StatusBar style="light" />
  

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Card Wheel (also broken)</Text>
        <Text style={styles.instructions}>this would be for action cards during negotion</Text>
        <CardWheel cards={sampleCards} />
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 60,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructions: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
});

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

  const deckCards = [
    {
      type: 'good' as const,
      name: 'Mountain Bike',
      description: 'High-quality mountain bike perfect for trails and adventures.',
      photos: ['https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800'],
    },
    {
      type: 'good' as const,
      name: 'Laptop',
      description: 'Modern laptop in excellent condition, great for work and entertainment.',
      photos: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800'],
    },
    {
      type: 'good' as const,
      name: 'Book Collection',
      description: 'Curated collection of classic literature and modern bestsellers.',
      photos: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800'],
    },
    {
      type: 'good' as const,
      name: 'Desk Lamp',
      description: 'Stylish and functional desk lamp with adjustable brightness.',
      photos: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800'],
    },
    {
      type: 'good' as const,
      name: 'Running Shoes',
      description: 'Comfortable running shoes with excellent cushioning and support.',
      photos: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'],
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <StatusBar style="light" />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Card Deck (broken)</Text>
        <Deck cards={deckCards} />
      </View>

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

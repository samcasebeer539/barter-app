import { View, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Deck from '../components/Deck';

export default function BarterScreen() {
  const deckCards = [
    {
      title: 'Mountain Bike',
      photo: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800',
    },
    {
      title: 'Laptop',
      photo: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
    },
    {
      title: 'Book Collection',
      photo: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800',
    },
    {
      title: 'Desk Lamp',
      photo: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800',
    },
    {
      title: 'Running Shoes',
      photo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Card Deck</Text>
        <Text style={styles.instructions}>Swipe left to send top card to back, right to bring it back</Text>
        <Deck cards={deckCards} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 40,
  },
});

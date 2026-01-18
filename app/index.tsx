import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2; // 2 columns with padding

// Sample barter items - later you'll fetch from backend
const BARTER_ITEMS = [
  { id: '1', title: 'Vintage Camera', image: '📷', category: 'Electronics' },
  { id: '2', title: 'Yoga Classes', image: '🧘', category: 'Services' },
  { id: '3', title: 'Homemade Bread', image: '🍞', category: 'Food' },
  { id: '4', title: 'Guitar Lessons', image: '🎸', category: 'Services' },
  { id: '5', title: 'Vintage Books', image: '📚', category: 'Books' },
  { id: '6', title: 'Plant Cuttings', image: '🌱', category: 'Plants' },
  { id: '7', title: 'Handmade Jewelry', image: '💍', category: 'Crafts' },
  { id: '8', title: 'Bicycle Repair', image: '🔧', category: 'Services' },
  { id: '9', title: 'Fresh Vegetables', image: '🥕', category: 'Food' },
  { id: '10', title: 'Art Prints', image: '🎨', category: 'Art' },
];

export default function HomeScreen() {
  // Split items into two columns
  const leftColumn = BARTER_ITEMS.filter((_, index) => index % 2 === 0);
  const rightColumn = BARTER_ITEMS.filter((_, index) => index % 2 === 1);

  const renderItem = (item: typeof BARTER_ITEMS[0]) => (
    <TouchableOpacity key={item.id} style={styles.card}>
      <View style={styles.imageContainer}>
        <Text style={styles.emoji}>{item.image}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.category}>{item.category}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.columnsContainer}>
          <View style={styles.column}>
            {leftColumn.map(renderItem)}
          </View>
          <View style={styles.column}>
            {rightColumn.map(renderItem)}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  columnsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  column: {
    flex: 1,
    gap: 16,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 0,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
  },
  cardContent: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  category: {
    fontSize: 13,
    color: '#8E8E93',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
});

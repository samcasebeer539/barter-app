import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

// Sample data - later you'll fetch this from your backend
const SAMPLE_LISTINGS = [
  { id: '1', title: 'Lawn Mowing Service', type: 'service', offering: 'Lawn care', seeking: 'Plumbing help' },
  { id: '2', title: 'Vintage Guitar', type: 'good', offering: 'Guitar', seeking: 'Bike' },
  { id: '3', title: 'Web Design', type: 'service', offering: 'Website creation', seeking: 'Photography' },
  { id: '4', title: 'Books Collection', type: 'good', offering: '20+ sci-fi books', seeking: 'Board games' },
];

export default function ListingsScreen() {
  const router = useRouter();

  const renderItem = ({ item }: { item: typeof SAMPLE_LISTINGS[0] }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.typeIcon}>{item.type === 'service' ? '⚙️' : '📦'}</Text>
        <Text style={styles.cardTitle}>{item.title}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.label}>Offering: <Text style={styles.value}>{item.offering}</Text></Text>
        <Text style={styles.label}>Seeking: <Text style={styles.value}>{item.seeking}</Text></Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={SAMPLE_LISTINGS}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.header}>Available Trades</Text>
        }
      />
      
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cardContent: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    color: '#333',
    fontWeight: '400',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
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

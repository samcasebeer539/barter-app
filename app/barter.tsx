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
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Main content area with card wireframes */}
      <View style={styles.mainContent}>
        <View style={styles.cardsContainer}>
          {/* Left card - larger and higher */}
          <View style={styles.leftCard}>
            <View style={styles.wireframe} />
          </View>
          
          {/* Right card - smaller and lower */}
          <View style={styles.rightCard}>
            <View style={styles.wireframe} />
          </View>
        </View>
      </View>

      {/* Card Wheel at bottom */}
      <View style={styles.cardWheelContainer}>
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
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  cardsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    marginBottom: 400,
  },
  leftCard: {
    width: 200,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightCard: {
    width: 140,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -40,
  },
  wireframe: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 16,
    borderStyle: 'dashed',
  },
  cardWheelContainer: {
    position: 'absolute',
    bottom: -530,
    left: 0,
    right: 0,
    paddingBottom: 0,
  },
});

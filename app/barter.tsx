import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import BarterCard from '../components/BarterCard';

export default function BarterScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        <BarterCard 
          title="Amazing Vintage Bike"
          photo="https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800"
        />
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
});

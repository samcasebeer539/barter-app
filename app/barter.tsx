import { View, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';
import PostCard from '../components/PostCard';

export default function BarterScreen() {
  const spinValue = useRef(new Animated.Value(0)).current;

  const spinCard = () => {
    // Reset to 0 first
    spinValue.setValue(0);
    
    // Animate a full 360 degree spin clockwise
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  // Interpolate the spin value to rotation (0deg to 360deg for clockwise)
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Sample post data for the PostCard
  const samplePost = {
    type: 'good' as const,
    name: 'Amazing Vintage Bike',
    description: 'Classic vintage road bike in excellent condition. Perfect for weekend rides or daily commute. Features include lightweight aluminum frame, 21-speed gear system, and comfortable saddle.',
    photos: [
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800',
      'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800',
    ],
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        <Animated.View style={{ transform: [{ rotateY: spin }] }}>
          <PostCard post={samplePost} />
        </Animated.View>
        
        <TouchableOpacity style={styles.spinButton} onPress={spinCard}>
          <Text style={styles.spinButtonText}>🔄 Spin Card</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    gap: 32,
  },
  spinButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  spinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

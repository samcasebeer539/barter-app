import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';

export default function BarterScreen() {
  const spinValue = useRef(new Animated.Value(0)).current;

  const spinCard = () => {
    // Reset to 0 first
    spinValue.setValue(0);
    
    // Animate a full 360 degree spin
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  // Interpolate the spin value to rotation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <StatusBar style="light" />
        
        <View style={styles.cardWrapper}>
          <Animated.View style={[styles.card, { transform: [{ rotateY: spin }] }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Amazing Vintage Bike</Text>
              <Text style={styles.cardPrice}>$250</Text>
            </View>
            
            <View style={styles.cardBody}>
              <Text style={styles.cardDescription}>
                Classic vintage road bike in excellent condition. Perfect for weekend rides or daily commute.
              </Text>
              
              <View style={styles.tagContainer}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Vintage</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Bikes</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.cardFooter}>
              <Text style={styles.sellerText}>Posted by @cyclistjoe</Text>
            </View>
          </Animated.View>
          
          <TouchableOpacity style={styles.spinButton} onPress={spinCard}>
            <Text style={styles.spinButtonText}>🔄 Spin Card</Text>
          </TouchableOpacity>
        </View>
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
  },
  cardWrapper: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  cardPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  cardBody: {
    marginBottom: 16,
  },
  cardDescription: {
    fontSize: 16,
    color: '#b0b0b0',
    lineHeight: 24,
    marginBottom: 16,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingTop: 12,
  },
  sellerText: {
    fontSize: 14,
    color: '#808080',
  },
  spinButton: {
    marginTop: 24,
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

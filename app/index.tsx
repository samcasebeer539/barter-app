import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useRef } from 'react';

const { width } = Dimensions.get('window');

// Sample barter items - later you'll fetch from backend
const BARTER_ITEMS = [
  { id: '1', title: 'Vintage Camera', image: '📷', type: 'good' },
  { id: '2', title: 'Yoga Classes', image: '🧘', type: 'service' },
  { id: '3', title: 'Homemade Bread', image: '🍞', type: 'good' },
  { id: '4', title: 'Guitar Lessons', image: '🎸', type: 'service' },
  { id: '5', title: 'Vintage Books', image: '📚', type: 'good' },
  { id: '6', title: 'Plant Cuttings', image: '🌱', type: 'good' },
  { id: '7', title: 'Handmade Jewelry', image: '💍', type: 'good' },
  { id: '8', title: 'Bicycle Repair', image: '🔧', type: 'service' },
  { id: '9', title: 'Fresh Vegetables', image: '🥕', type: 'good' },
  { id: '10', title: 'Art Prints', image: '🎨', type: 'good' },
];

export default function HomeScreen() {
  const [showHeader, setShowHeader] = useState(true);
  const scrollY = useRef(0);
  const headerTranslateY = useRef(new Animated.Value(0)).current;

  const leftColumn = BARTER_ITEMS.filter((_, index) => index % 2 === 0);
  const rightColumn = BARTER_ITEMS.filter((_, index) => index % 2 === 1);

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollingDown = currentScrollY > scrollY.current && currentScrollY > 50;
    const scrollingUp = currentScrollY < scrollY.current;

    if (scrollingDown && showHeader) {
      setShowHeader(false);
      Animated.timing(headerTranslateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (scrollingUp && !showHeader) {
      setShowHeader(true);
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    scrollY.current = currentScrollY;
  };

  const renderItem = (item: typeof BARTER_ITEMS[0]) => (
    <View key={item.id} style={styles.cardWrapper}>
      <TouchableOpacity style={styles.card}>
        <View style={styles.imageContainer}>
          <Text style={styles.emoji}>{item.image}</Text>
          <View style={styles.typeIconContainer}>
            <MaterialIcons 
              name={item.type === 'service' ? 'schedule' : 'inventory-2'} 
              size={20} 
              color="#FFFFFF" 
            />
          </View>
        </View>
      </TouchableOpacity>
      <Text style={styles.itemTitle}>{item.title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Animated.View 
        style={[
          styles.topIconsContainer,
          { transform: [{ translateY: headerTranslateY }] }
        ]}
      >
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="location-on" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="search" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topIconsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(28, 28, 30, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 120,
  },
  columnsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  column: {
    flex: 1,
    gap: 16,
  },
  cardWrapper: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  emoji: {
    fontSize: 64,
  },
  typeIconContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 6,
    padding: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    marginLeft: 4,
  },
});

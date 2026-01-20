import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Animated, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useRef } from 'react';

const { width } = Dimensions.get('window');

// Sample barter items with actual images and varying aspect ratios (portrait and landscape)
const BARTER_ITEMS = [
  { id: '1', title: 'Vintage Camera', image: 'https://picsum.photos/seed/camera1/400/500', type: 'good', height: 250 },
  { id: '2', title: 'Guitar Lessons', image: 'https://picsum.photos/seed/guitar1/500/400', type: 'service', height: 180 },
  { id: '3', title: 'Bike Repair', image: 'https://picsum.photos/seed/bike1/400/450', type: 'service', height: 225 },
  { id: '4', title: 'Vintage Records', image: 'https://picsum.photos/seed/records1/500/350', type: 'good', height: 160 },
  { id: '5', title: 'Photography Session', image: 'https://picsum.photos/seed/photo1/400/500', type: 'service', height: 250 },
  { id: '6', title: 'Handmade Pottery', image: 'https://picsum.photos/seed/pottery1/400/650', type: 'good', height: 325 },
  { id: '7', title: 'Web Design', image: 'https://picsum.photos/seed/web1/500/380', type: 'service', height: 170 },
  { id: '8', title: 'Plant Collection', image: 'https://picsum.photos/seed/plants1/400/520', type: 'good', height: 260 },
  { id: '9', title: 'Yoga Classes', image: 'https://picsum.photos/seed/yoga1/400/600', type: 'service', height: 300 },
  { id: '10', title: 'Vintage Books', image: 'https://picsum.photos/seed/books1/500/370', type: 'good', height: 165 },
  { id: '11', title: 'Carpentry Work', image: 'https://picsum.photos/seed/wood1/400/550', type: 'service', height: 275 },
  { id: '12', title: 'Art Prints', image: 'https://picsum.photos/seed/art1/400/580', type: 'good', height: 290 },
];

export default function FeedScreen() {
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
        <View style={[styles.imageContainer, { height: item.height }]}>
          <Image 
            source={{ uri: item.image }} 
            style={styles.image}
            resizeMode="cover"
          />
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
    backgroundColor: '#141414',
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
    backgroundColor: '#2C2C2E',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
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

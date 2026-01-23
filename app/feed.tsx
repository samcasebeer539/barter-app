import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Animated, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useRef } from 'react';
import PostCard from '@/components/PostCard';

const { width } = Dimensions.get('window');

// Sample barter items with aspect ratios between 3:4 (0.75) and 4:3 (1.33)
const BARTER_ITEMS = [
  { id: '1', title: 'Vintage Camera', image: 'https://picsum.photos/seed/camera1/400/500', type: 'good', height: 150 },
  { id: '2', title: 'Guitar Lessons', image: 'https://picsum.photos/seed/guitar1/400/320', type: 'service', height: 200 },
  { id: '3', title: 'Bike Repair', image: 'https://picsum.photos/seed/bike1/400/480', type: 'service', height: 240 },
  { id: '4', title: 'Vintage Records', image: 'https://picsum.photos/seed/records1/400/340', type: 'good', height: 170 },
  { id: '5', title: 'Photography Session', image: 'https://picsum.photos/seed/photo1/400/520', type: 'service', height: 260 },
  { id: '6', title: 'Handmade Pottery', image: 'https://picsum.photos/seed/pottery1/400/500', type: 'good', height: 250 },
  { id: '7', title: 'Web Design', image: 'https://picsum.photos/seed/web1/400/310', type: 'service', height: 155 },
  { id: '8', title: 'Plant Collection', image: 'https://picsum.photos/seed/plants1/400/460', type: 'good', height: 230 },
  { id: '9', title: 'Yoga Classes', image: 'https://picsum.photos/seed/yoga1/400/530', type: 'service', height: 265 },
  { id: '10', title: 'Vintage Books', image: 'https://picsum.photos/seed/books1/400/330', type: 'good', height: 165 },
  { id: '11', title: 'Carpentry Work', image: 'https://picsum.photos/seed/wood1/400/490', type: 'service', height: 245 },
  { id: '12', title: 'Art Prints', image: 'https://picsum.photos/seed/art1/400/450', type: 'good', height: 225 },
];

// Sample post data for the modal
const SAMPLE_POST = {
  type: 'service' as const,
  name: 'Bike Repair service',
  description: 'Professional bike repair and maintenance services. I have over 10 years of experience fixing all types of bikes from mountain bikes to road bikes.',
  photos: [
    'https://picsum.photos/seed/landscape1/800/400',
    'https://picsum.photos/seed/portrait1/400/600',
    'https://picsum.photos/seed/square1/500/500',
  ],
};

export default function FeedScreen() {
  const [showHeader, setShowHeader] = useState(true);
  const [selectedPost, setSelectedPost] = useState<typeof SAMPLE_POST | null>(null);
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

  const handleCardPress = () => {
    setSelectedPost(SAMPLE_POST);
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  const handleOffer = () => {
    console.log('Offer button pressed');
    // Add your offer logic here
  };

  const renderItem = (item: typeof BARTER_ITEMS[0]) => (
    <View key={item.id} style={styles.cardWrapper}>
      <TouchableOpacity style={styles.card} onPress={handleCardPress}>
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

      {/* Overlay for PostCard - renders below tab bar */}
      {selectedPost && (
        <View style={styles.modalOverlay} pointerEvents="box-none">
          <TouchableOpacity 
            style={styles.modalBackground} 
            activeOpacity={1} 
            onPress={handleCloseModal}
          />
          <View style={styles.modalContent} pointerEvents="box-none">
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleCloseModal}
            >
              <MaterialIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <View pointerEvents="auto" style={styles.cardContainer}>
              <PostCard 
                post={selectedPost}
                scale={1}
                cardWidth={Math.min(width - 40, 400)}
              />
            </View>
            <View style={styles.buttonContainer} pointerEvents="auto">
              <TouchableOpacity 
                style={styles.offerButton}
                onPress={handleOffer}
              >
                <Text style={styles.offerButtonText}>OFFER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    position: 'relative',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  cardContainer: {
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: -50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
  },
  offerButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  offerButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

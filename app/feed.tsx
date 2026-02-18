import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome6 } from '@expo/vector-icons';
import { useState, useRef } from 'react';
import FeedDeck from '@/components/FeedDeck';
import FeedBar from '@/components/FeedBar';
import { defaultTextStyle, globalFonts, colors, uiColors } from '../styles/globalStyles';


// Sample barter items with aspect ratios between 3:4 (0.75) and 4:3 (1.33)
const BARTER_ITEMS = [
  { id: '1', title: 'sci-fi books', image: 'https://picsum.photos/seed/camera1/400/500', type: 'good', height: 150 },
  { id: '2', title: 'iPad 5th Generation 2017', image: 'https://picsum.photos/seed/guitar1/400/320', type: 'good', height: 200 },
  { id: '3', title: 'Bike Repair', image: 'https://picsum.photos/seed/bike1/400/480', type: 'service', height: 210 },
  { id: '4', title: 'HP Laptop', image: 'https://picsum.photos/seed/records1/400/340', type: 'good', height: 170 },
  { id: '5', title: 'DVD collection', image: 'https://picsum.photos/seed/photo1/400/520', type: 'good', height: 260 },
  { id: '6', title: 'Handmade Pottery Set For Sale Now', image: 'https://picsum.photos/seed/pottery1/400/500', type: 'service', height: 250 },
  { id: '7', title: 'Web Design', image: 'https://picsum.photos/seed/web1/400/310', type: 'service', height: 155 },
  { id: '8', title: 'Plant Collection', image: 'https://picsum.photos/seed/plants1/400/460', type: 'good', height: 230 },
  { id: '9', title: 'Yoga Classes', image: 'https://picsum.photos/seed/yoga1/400/530', type: 'service', height: 265 },
  { id: '10', title: 'Vintage Books', image: 'https://picsum.photos/seed/books1/400/330', type: 'good', height: 165 },
  { id: '11', title: 'Carpentry Work', image: 'https://picsum.photos/seed/wood1/400/490', type: 'service', height: 245 },
  { id: '12', title: 'Art Prints', image: 'https://picsum.photos/seed/art1/400/450', type: 'good', height: 225 },
  { id: '13', title: 'Vintage Camera', image: 'https://picsum.photos/seed/camera1/400/500', type: 'good', height: 150 },
  { id: '14', title: 'Guitar Lessons', image: 'https://picsum.photos/seed/guitar1/400/320', type: 'service', height: 200 },
  { id: '15', title: 'Bike Repair', image: 'https://picsum.photos/seed/bike1/400/480', type: 'service', height: 240 },
  { id: '16', title: 'Vintage Records', image: 'https://picsum.photos/seed/records1/400/340', type: 'good', height: 170 },
 
];

// Sample posts for the deck
const DECK_POSTS = [
  {
    type: 'service' as const,
    name: 'Bike Repair Service This Title is Long',
    description: 'Professional bike repair and maintenance services. I have over 10 years of experience fixing all types of bikes from mountain bikes to road bikes.',
    photos: [
      'https://picsum.photos/seed/landscape1/800/400',
      'https://picsum.photos/seed/portrait1/400/600',
      'https://picsum.photos/seed/square1/500/500',
    ],
  },
  {
    type: 'good' as const,
    name: 'DVD collection',
    description: 'This has an unusually long description. adsf asdf asdga sfgsd hsdgh sdfg asdg sdg asfgs fga sfg asfgdfjahsdfg asdfgasdf asdf asdf asdf asdf asdf a sdf asdg asgf asdg fas gf asdf sdf asdf as df asdfasd gfas g asdgasf g sagf ADF A S DFASDGASDGASFGASDFASDFASDFAas df  ',
    photos: [
      'https://picsum.photos/seed/camera1/600/400',
      'https://picsum.photos/seed/camera2/500/700',
      'https://picsum.photos/seed/camera3/600/600',
    ],
  },
  {
    type: 'good' as const,
    name: 'iPad 5th Generation 2017',
    description: '128 GB storage, factory reset, battery capacity at 82%. Case if you want it!',
    photos: [
       Image.resolveAssetSource(require('@/assets/photos/ipad.jpeg')).uri,
      'https://picsum.photos/seed/camera3/600/600',
    ],
  },
  {
    type: 'good' as const,
    name: 'Handmade Pottery Set',
    description: 'Beautiful hand-thrown ceramic bowls, plates, and mugs. Food-safe glazes in earthy tones.',
    photos: [
      'https://picsum.photos/seed/pottery1/600/400',
      'https://picsum.photos/seed/pottery2/500/700',
      'https://picsum.photos/seed/pottery3/600/600',
    ],
  },
  {
    type: 'service' as const,
    name: 'Professional Photography',
    description: 'Portrait and event photography services. 10+ years experience with professional equipment.',
    photos: [
      'https://picsum.photos/seed/photo1/700/500',
      'https://picsum.photos/seed/photo2/400/600',
      'https://picsum.photos/seed/photo3/500/500',
    ],
  },
];

export default function FeedScreen() {
  const [showHeader, setShowHeader] = useState(true);
  const [showDeck, setShowDeck] = useState(false);
  const [showSaved, setShowSaved] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
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
        toValue: -110,
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
    setShowDeck(true);
  };

  const handleCloseDeck = () => {
    setShowDeck(false);
  };

  const handleSave = () => {
    console.log('Save button', showSaved);
    setShowSaved(prev => !prev);
  };
  const handleLocation = () => {
    console.log('Location button', showLocation);
    setShowLocation(prev => !prev);
  };
  const handleSearch = () => {
    console.log('Search bar');

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
          <FontAwesome6 
            name={item.type === 'good' ? 'gifts' : 'hand-sparkles'} 
            size={18} 
            color={item.type === 'good' ? colors.cardTypes.good : colors.cardTypes.service}
            style={styles.typeIcon}
          />
        

        </View>
      </TouchableOpacity>
      
      <View style={styles.itemTitleWrapper}>
        <Text style={styles.itemTitle}>{item.title}</Text>
      </View>
     
    </View>
  );

  return (
    
    <View style={styles.container}>
      
      <StatusBar style="light" />
      
      <FeedBar
        showLocation={showLocation}
        showSaved={showSaved}
        onLocationPress={handleLocation}
        
        onSavePress={handleSave}
        headerTranslateY={headerTranslateY}
      />

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

      {/* FeedDeck Component */}
      <FeedDeck 
        posts={DECK_POSTS}
        visible={showDeck}
        onClose={handleCloseDeck}
      />

      
    </View>
    
   
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: colors.ui.background,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingTop: 96,
  },
  columnsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  column: {
    flex: 1,
    gap: 8,
  },
  cardWrapper: {
    marginBottom: 2,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 2,
    borderBottomLeftRadius: 2,
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
  typeIcon: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  itemTitleWrapper: {
    backgroundColor: colors.ui.secondary,
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 2,
  },
  itemTitle: {
    fontSize: 16,

    color: '#FFFFFF',
    fontFamily: globalFonts.bold,
    
  },
});

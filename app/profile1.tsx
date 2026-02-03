//todo: add profile background photo
//    this will be added to user card as well

// and a box for the top of postcard for deck
// 12 available TRADES!


import React, { useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import PostCard from '@/components/PostCard';
import PostCardWithDeck from '@/components/PostCardWithDeck';
import ProfilePicture from '@/components/ProfilePicture';
import CreateCard from '@/components/CreateCard';
import { defaultTextStyle, globalFonts, colors } from '../styles/globalStyles';


const POSTS = [
  {
    type: 'service' as const,
    name: 'Bike Repair service',
    description:
      'Professional bike repair and maintenance services. I have over 10 years of experience fixing all types of bikes from mountain bikes to road bikes.',
    photos: [
      'https://picsum.photos/seed/landscape1/800/400',
      'https://picsum.photos/seed/portrait1/400/600',
      'https://picsum.photos/seed/square1/500/500',
    ],
  },
  {
    type: 'good' as const,
    name: 'Vintage Camera Collection',
    description:
      'Beautiful vintage cameras from the 1960s-1980s. Perfect working condition.',
    photos: [
      'https://picsum.photos/seed/camera1/600/400',
      'https://picsum.photos/seed/camera2/500/700',
      'https://picsum.photos/seed/camera3/600/600',
    ],
  },
  {
    type: 'service' as const,
    name: 'Guitar Lessons',
    description:
      'Experienced guitar teacher offering beginner to intermediate lessons. ',
    photos: [
      'https://picsum.photos/seed/guitar1/700/500',
      'https://picsum.photos/seed/guitar2/400/600',
      'https://picsum.photos/seed/guitar3/500/500',
    ],
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const revealProgress = useRef(new Animated.Value(0)).current; // 0 = collapsed, 1 = revealed
  const [isDeckRevealed, setIsDeckRevealed] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const cardWidth = Math.min(screenWidth - 110, 400);
  const cardSpacing = 0;
  const sidePadding = (screenWidth - cardWidth) / 2;

  // replace this with actual user data from API
  const profileImageUrl = 'https://picsum.photos/seed/profile/400/400';

  // Interpolate animations based on reveal progress
  const headerTranslateY = revealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -700], // Move header completely out of view
  });

  const carouselTranslateY = revealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, screenHeight * 0.36], // Move carousel way down (70% of screen height)
  });

  const handleRevealChange = (revealed: boolean) => {
    console.log('Deck revealed:', revealed);
    setIsDeckRevealed(revealed);
  };

  const handleSettingsPress = () => {
    router.push('/settings');
  };

  // Create array with CreateCard at the front
  const carouselItems = [{ type: 'create' }, ...POSTS];

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Top Gradient Overlay */}
      <View style={styles.topGradientContainer}>
        <LinearGradient
          colors={['#000000', 'rgba(0, 0, 0, 0.95)', 'rgba(0, 0, 0, 0)']}
          locations={[0, 0.4, 1]}
          style={styles.topGradient}
        />
      </View>

      {/* Settings Icon - Animates with header */}
      <Animated.View 
        style={[
          styles.settingsIconContainer,
          {
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <TouchableOpacity onPress={handleSettingsPress} style={styles.settingsButton}>
          <FontAwesome6 name="gear" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={false}
        style={{ overflow: 'visible' }}
      >
        {/* HEADER */}
        <Animated.View 
          style={[
            styles.header,
            {
              transform: [{ translateY: headerTranslateY }],
              zIndex: -1,
            },
          ]}
        >
          {/* Profile Picture and Name Row */}
          <View style={styles.profileRow}>
            <ProfilePicture 
              size={80} 
              imageSource={profileImageUrl}
              avatarText="SC" 
            />
            <View style={styles.nameContainer}>
               {/* replace with api data */}
              <Text style={styles.name}>Sam Casebeer</Text>   
              <View style={styles.locationRow}>
                <FontAwesome6 name="location-dot" size={14} color="#FFFFFF" />
                <Text style={styles.location}>Santa Cruz, CA</Text>
              </View>
            </View>
          </View>

          {/* Bio - api */}
          <Text style={styles.bio}>
            Passionate about sustainable living and building community through sharing. 
            Always looking for unique trades and meaningful connections.
          </Text>

          {/* Tags
          <View style={styles.tagsContainer}>
            <View style={[styles.tag, styles.tagPink]}>
              <Text style={styles.tagtextPink}>Community Builder</Text>
            </View>
            <View style={[styles.tag, styles.tagGreen]}>
              <Text style={styles.tagtextGreen}>Eco-Friendly</Text>
            </View>
            <View style={[styles.tag, styles.tagPurple]}>
              <Text style={styles.tagtextPurple}>Master Barterer</Text>
            </View>
          </View> */}
        </Animated.View>

        {/* CAROUSEL */}
        <Animated.View 
          style={[
            styles.cardsWrapper,
            {
              transform: [{ translateY: carouselTranslateY }],
              zIndex: 10,
              overflow: 'visible',
            },
          ]}
        >
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardWidth + cardSpacing}
            decelerationRate="fast"
            scrollEnabled={!isDeckRevealed} // Disable carousel scrolling when deck is revealed
            style={{ overflow: 'visible' }}
            contentContainerStyle={{
              paddingHorizontal: sidePadding,
              paddingBottom: 50, // Extra bottom padding for drag space
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          >
            {carouselItems.map((item, index) => {
              // Calculate the scale for each card
              const inputRange = [
                (index - 1) * (cardWidth + cardSpacing),
                index * (cardWidth + cardSpacing),
                (index + 1) * (cardWidth + cardSpacing),
              ];
              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.9, 1, 0.9],
                extrapolate: 'clamp',
              });

              return (
                <Animated.View
                  key={index}
                  style={{
                    width: cardWidth,
                    marginRight: index < carouselItems.length - 1 ? cardSpacing : 0,
                    transform: [{ scale: scale ?? 1 }],
                    overflow: 'visible',
                  }}
                >
                  <View style={{ flex: 1, overflow: 'visible' }}>
                    {/* Render CreateCard for the first item */}
                    {item.type === 'create' ? (
                      <CreateCard scale={1} cardWidth={cardWidth} />
                    ) : index === 1 ? (
                      // Use PostCardWithDeck for the second card (first actual post)
                      <PostCardWithDeck 
                        post={item} 
                        deckPosts={POSTS} // Pass all POSTS as deck posts
                        scale={1} 
                        cardWidth={cardWidth}
                        revealProgress={revealProgress}
                        onRevealChange={handleRevealChange}
                        deckRevealed={isDeckRevealed}
                      />
                    ) : (
                      <PostCard post={item} scale={1} cardWidth={cardWidth} />
                    ) }
                  </View>
                </Animated.View>
              );
            })}
          </Animated.ScrollView>
          
        </Animated.View>
      </ScrollView>

   
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ui.background,
    
  },
  topGradientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    zIndex: 200,
    pointerEvents: 'none',
  },
  topGradient: {
    flex: 1,
  },
  settingsIconContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100,
  },
  settingsButton: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 30,
    backgroundColor: colors.ui.background,
    flexGrow: 1,
    overflow: 'visible',
  },
  header: {
    paddingTop: 30,
    paddingBottom: 10,
    paddingHorizontal: 20,
    
    
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  nameContainer: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    fontFamily: globalFonts.bold,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 4,
    ...defaultTextStyle
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    color: '#fff',
    marginBottom: 8,
    ...defaultTextStyle
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  tagPink: { borderColor: '#FF3B81' },
  tagGreen: { borderColor: '#34C759' },
  tagPurple: { borderColor: '#9747FF' },
  tagtextPink: { color: '#FF3B81', fontSize: 14, fontWeight: '500', ...defaultTextStyle },
  tagtextGreen: { color: '#34C759', fontSize: 14, fontWeight: '500', ...defaultTextStyle },
  tagtextPurple: { color: '#9747FF', fontSize: 14, fontWeight: '500', ...defaultTextStyle },
  cardsWrapper: {
    top: 300, // Increased to push carousel down more in initial position
  },

});

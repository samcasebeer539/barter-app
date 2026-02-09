//todo: add profile background photo
//    this will be added to user card as well


import React, { useRef, useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Carousel from '@/components/Carousel';
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
    hasDeck: true,
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
    hasDeck: true,
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
    hasDeck: true,
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const revealProgress = useRef(new Animated.Value(0)).current;
  const [isDeckRevealed, setIsDeckRevealed] = useState(false);

  // replace this with actual user data from API
  const profileImageUrl = 'https://picsum.photos/seed/cat/400/400';

  const headerTranslateY = revealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -700],
  });

  const handleToggleReveal = useCallback(() => {
    const toValue = isDeckRevealed ? 0 : 1;
    setIsDeckRevealed(!isDeckRevealed);
    Animated.timing(revealProgress, {
      toValue,
      useNativeDriver: true,
      duration: 260,
    }).start();
  }, [isDeckRevealed, revealProgress]);

  const handleSettingsPress = () => {
    router.push('/settings');
  };

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
          { transform: [{ translateY: headerTranslateY }] },
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
          <View style={styles.profileRow}>
            <Image
              source={{ uri: profileImageUrl }}
              style={styles.profileImage}
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
        </Animated.View>

        <View style={styles.cardsWrapper}>
          <Carousel
            posts={POSTS}
            deckPosts={POSTS}
            showCreateCard={true}
            revealProgress={revealProgress}
            isDeckRevealed={isDeckRevealed}
            onToggleReveal={handleToggleReveal}
          />
        </View>
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
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
   
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
    ...defaultTextStyle,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    color: '#fff',
    marginBottom: 8,
    ...defaultTextStyle,
  },
  cardsWrapper: {
    top: 100,
  },
});
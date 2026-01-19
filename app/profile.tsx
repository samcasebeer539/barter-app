import React, { useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import PostCard from '../components/PostCard';
import PostCardWithDeck from '../components/PostCardWithDeck';

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
  const scrollX = useRef(new Animated.Value(0)).current;
  const revealProgress = useRef(new Animated.Value(0)).current; // 0 = collapsed, 1 = revealed
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const cardWidth = Math.min(screenWidth - 110, 400);
  const cardSpacing = 10;
  const sidePadding = (screenWidth - cardWidth) / 2;

  // Interpolate animations based on reveal progress
  const headerTranslateY = revealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -400], // Move header completely out of view
  });

  const carouselTranslateY = revealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, screenHeight * 0.4], // Move carousel way down (70% of screen height)
  });

  const carouselOpacity = revealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.2], // Fade out carousel more
  });

  const handleRevealChange = (revealed: boolean) => {
    console.log('Deck revealed:', revealed);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={false}
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
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>

          <Text style={styles.name}>Sam Casebeer</Text>

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
          </View>
        </Animated.View>

        {/* CAROUSEL */}
        <Animated.View 
          style={[
            styles.cardsWrapper,
            {
              transform: [{ translateY: carouselTranslateY }],
              opacity: carouselOpacity,
              zIndex: 10,
            },
          ]}
        >
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardWidth + cardSpacing}
            decelerationRate="fast"
            contentContainerStyle={{
              paddingHorizontal: sidePadding,
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          >
            {POSTS.map((post, index) => {
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
                    marginRight: index < POSTS.length - 1 ? cardSpacing : 0,
                    transform: [{ scale: scale ?? 1 }],
                  }}
                >
                  <View style={{ flex: 1 }}>
                    {/* Use PostCardWithDeck for the first card */}
                    {index === 0 ? (
                      <PostCardWithDeck 
                        post={post} 
                        scale={1} 
                        cardWidth={cardWidth}
                        revealProgress={revealProgress}
                        onRevealChange={handleRevealChange}
                      />
                    ) : (
                      <PostCard post={post} scale={1} cardWidth={cardWidth} />
                    )}
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
    backgroundColor: '#141414',
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 30,
    backgroundColor: '#141414',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 40,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    color: '#fff',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
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
  tagtextPink: { color: '#FF3B81', fontSize: 12, fontWeight: '500' },
  tagtextGreen: { color: '#34C759', fontSize: 12, fontWeight: '500' },
  tagtextPurple: { color: '#9747FF', fontSize: 12, fontWeight: '500' },
  cardsWrapper: {
    marginTop: 20,
  },
});

import React, { useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import PostCard from '@/components/PostCard';
import PostCardWithDeck from '@/components/PostCardWithDeck';

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
    hasDeck: false,
  },
];

export default function ProfileScreen() {
  const scrollX = useRef(new Animated.Value(0)).current;
  const revealProgress = useRef(new Animated.Value(0)).current;
  const [isDeckRevealed, setIsDeckRevealed] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const cardWidth = Math.min(screenWidth - 110, 400);
  const cardSpacing = 10;
  const sidePadding = (screenWidth - cardWidth) / 2;

  const headerTranslateY = revealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -400],
  });

  const carouselTranslateY = revealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, screenHeight * 0.4],
  });

  const handleRevealChange = (revealed: boolean) => {
    console.log('Deck revealed:', revealed);
    setIsDeckRevealed(revealed);
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (cardWidth + cardSpacing));
    setCurrentCardIndex(index);
  };

  // Custom pan gesture handler for when deck is revealed
  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: new Animated.Value(0) } }],
    { useNativeDriver: false }
  );

  const handlePanStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END && isDeckRevealed) {
      const { translationX, velocityX } = event.nativeEvent;
      
      // Determine scroll direction
      let targetIndex = currentCardIndex;
      
      // Swipe left (go to next card)
      if (translationX < -50 || velocityX < -500) {
        targetIndex = currentCardIndex + 1;
      }
      // Swipe right (go to previous card)
      else if (translationX > 50 || velocityX > 500) {
        targetIndex = currentCardIndex - 1;
      }
      
      // Validate the target index
      if (targetIndex >= 0 && targetIndex < POSTS.length) {
        const targetPost = POSTS[targetIndex];
        
        // Only allow scrolling to cards with decks
        if (targetPost.hasDeck) {
          const targetPosition = targetIndex * (cardWidth + cardSpacing);
          scrollViewRef.current?.scrollTo({
            x: targetPosition,
            animated: true,
          });
        }
      }
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
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
              zIndex: 10,
              overflow: 'visible',
            },
          ]}
        >
          <PanGestureHandler
            onGestureEvent={onPanGestureEvent}
            onHandlerStateChange={handlePanStateChange}
            enabled={isDeckRevealed}
            activeOffsetX={[-10, 10]}
          >
            <Animated.View style={{ flex: 1 }}>
              <Animated.ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={cardWidth + cardSpacing}
                decelerationRate="fast"
                style={{ overflow: 'visible' }}
                contentContainerStyle={{
                  paddingHorizontal: sidePadding,
                  paddingBottom: 50,
                }}
                scrollEnabled={!isDeckRevealed}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { 
                    useNativeDriver: true,
                    listener: handleScroll,
                  }
                )}
                scrollEventThrottle={16}
              >
                {POSTS.map((post, index) => {
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
                        overflow: 'visible',
                      }}
                    >
                      <View style={{ flex: 1, overflow: 'visible' }}>
                        {post.hasDeck ? (
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
          </PanGestureHandler>
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
    overflow: 'visible',
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
    marginTop: 230,
  },
});

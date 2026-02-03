//this will be refactored profile carousel
import ProfileDeck from './ProfileDeck';
import React, { useState, useCallback } from 'react';
import { View, Dimensions, StyleSheet, Animated, ScrollView } from 'react-native';
import PostCard from '@/components/PostCard';
import CreateCard from '@/components/CreateCard';
import { colors } from '@/styles/globalStyles';

interface Post {
  type: 'good' | 'service';
  name: string;
  description: string;
  photos: string[];
  hasDeck: boolean;
}

interface CarouselProps {
  posts: Post[];
  showCreateCard?: boolean;
  revealProgress: Animated.Value;
  isDeckRevealed: boolean;
  onToggleReveal: () => void;
  deckPosts: Post[];
}

const CARD_SLIDE_DOWN = 280;
const DECK_SLIDE_UP = 262;

const Carousel: React.FC<CarouselProps> = ({
  posts,
  deckPosts,
  showCreateCard = true,
  revealProgress,
  isDeckRevealed,
  onToggleReveal,
}) => {
  const [centeredIndex, setCenteredIndex] = useState(0);

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const cardWidth = Math.min(screenWidth - 100, 400);
  const cardSpacing = 12;
  const sidePadding = (screenWidth - cardWidth) / 2;

  const cardTranslateY = revealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CARD_SLIDE_DOWN],
  });

  const activeDeckTranslateY = revealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -DECK_SLIDE_UP],
  });

  const inactiveDeckTranslateY = cardTranslateY;
  const backdropTranslateY = cardTranslateY;

  const handleScroll = useCallback((event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollX / (cardWidth + cardSpacing));
    setCenteredIndex(index);
  }, [cardWidth, cardSpacing]);

  const carouselItems: ({ type: 'create' } | Post)[] = [
    ...(showCreateCard ? [{ type: 'create' as const }] : []),
    ...posts,
  ];

  return (
    <View style={styles.cardsWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + cardSpacing}
        decelerationRate="fast"
        scrollEnabled={!isDeckRevealed}
        style={{ overflow: 'visible' }}
        contentContainerStyle={{
          paddingHorizontal: sidePadding,
          paddingBottom: 50,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {carouselItems.map((item, index) => {
          const isCreate = item.type === 'create';
          const showDeck = !isCreate && item.hasDeck;
          const isCentered = index === centeredIndex;

          return (
            <View
              key={index}
              style={{
                width: cardWidth,
                marginRight: index < carouselItems.length - 1 ? cardSpacing : 0,
                overflow: 'visible',
              }}
            >
              {/* Layer 1: ProfileDeck — centered goes up, rest go down */}
              {showDeck && (
                <Animated.View
                  style={[
                    styles.deckLayer,
                    {
                      transform: [
                        { translateY: isCentered ? activeDeckTranslateY : inactiveDeckTranslateY },
                      ],
                    },
                  ]}
                  pointerEvents="box-none"
                >
                  <ProfileDeck
                    posts={deckPosts}
                    onToggleReveal={isCentered ? onToggleReveal : undefined}
                    toggleEnabled={isCentered}
                    isDeckRevealed={isDeckRevealed}
                  />
                </Animated.View>
              )}

              {/* Layer 2: per-card backdrop — animates down with the card */}
              {showDeck && (
                <Animated.View
                  style={[
                    styles.perCardBackdrop,
                    { height: screenHeight, transform: [{ translateY: backdropTranslateY }] },
                  ]}
                  pointerEvents="none"
                />
              )}

              {/* Layer 3: the actual card — animates down */}
              <Animated.View style={[styles.cardLayer, { transform: [{ translateY: cardTranslateY }] }]}>
                {isCreate ? (
                  <CreateCard scale={1} cardWidth={cardWidth} />
                ) : (
                  <PostCard post={item} scale={1} cardWidth={cardWidth} />
                )}
              </Animated.View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  cardsWrapper: {
    overflow: 'visible',
  },
  deckLayer: {
    position: 'absolute',
    top: 574,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  perCardBackdrop: {
    position: 'absolute',
    top: -8,
    left: -40,
    right: -40,
    bottom: 0,
    backgroundColor: colors.ui.background,
    zIndex: 2,
  },
  cardLayer: {
    position: 'relative',
    zIndex: 3,
  },
});

export default Carousel;